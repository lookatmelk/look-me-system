# Guide 03 — OrderForm Component Rewrite

## File to Rewrite

`src/components/orders/OrderForm.tsx`

---

## Objective

Completely rewrite the OrderForm from a **3-step stepper** to a **single, flat, scrollable form** with:
- `sampleNo` field alongside `designNo`
- **Selective shop display** (user picks shops, not all shown at once)
- **Enter-key navigation** between all fields
- **Dynamic summary** panel showing live totals
- Same design patterns as the updated `CostingForm.tsx`

---

## Current Problems with the Existing OrderForm

1. **3-step stepper** — user requirement says no stepper, use a single form
2. **All shops loaded at once** — renders a `ShopAllocationSection` for EVERY active shop
3. **`DesignOption.size` is a string** — should be `sizes: string[]` to match updated CostingRecord
4. **No `sampleNo` field**
5. **No Enter-key navigation**
6. **Form blocks Enter key globally** — `onKeyDown` in the `<form>` prevents all Enter on `<input>`, which is too aggressive

---

## New Form Architecture

### Section Layout (All Visible at Once, Scrollable)

```
┌────────────────────────────────────────────────┐
│ Section 1: Design & Order Details              │
│ ┌──────────────┐ ┌──────────────┐              │
│ │ Design No *  │ │ Sample No    │              │
│ │ (dropdown)   │ │ (text input) │              │
│ └──────────────┘ └──────────────┘              │
│                                                │
│ [Selected Design Preview Card - conditional]   │
│                                                │
│ ┌──────────────┐ ┌──────────────┐              │
│ │ Order Date * │ │ Status *     │              │
│ └──────────────┘ └──────────────┘              │
│                                                │
│ ┌──────────────────────────────────┐           │
│ │ Notes (optional, textarea)       │           │
│ └──────────────────────────────────┘           │
├────────────────────────────────────────────────┤
│ Section 2: Shop Allocations                    │
│                                                │
│ ┌────────────────────────────┐ ┌─────────────┐ │
│ │ Select a shop to add...   │ │ Add All     │ │
│ └────────────────────────────┘ └─────────────┘ │
│                                                │
│ ┌─ Shop Allocation Row ──────────────────────┐ │
│ │ 🟢 Shop Name                          [×]  │ │
│ │ Quantity: [____]                             │ │
│ │ Sizes: [S] [M] [L] [XL] ... (toggle chips) │ │
│ └────────────────────────────────────────────┘ │
│ ┌─ Shop Allocation Row ──────────────────────┐ │
│ │ 🔵 Another Shop                       [×]  │ │
│ │ ...                                         │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ Design Total ─────────────────────────────┐ │
│ │ Total Quantity: 450                         │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ Section 3: Summary (live calculations)         │
│  Design Total: 450                             │
│  Selling Price / Unit: LKR 1,200.00            │
│  Cost / Unit: LKR 850.00                       │
│  ──────────────────────────                    │
│  Projected Revenue: LKR 540,000.00             │
│  Projected Profit: LKR 157,500.00              │
│  Profit Margin: 29.17%                         │
├────────────────────────────────────────────────┤
│ [Cancel]                          [Create Order]│
└────────────────────────────────────────────────┘
```

---

## Updated Interfaces

### `DesignOption` (exported)

```typescript
export interface DesignOption {
  _id: string;
  designNo: string;
  description: string;
  sellingPrice: number;
  totalCost: number;
  profitPercentage: number;
  sizes: string[];              // ← CHANGED from `size: string`
}
```

### `OrderFormProps`

```typescript
interface OrderFormProps {
  initialData?: any;
  availableDesigns: DesignOption[];
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit: (data: OrderFormValues) => Promise<void>;
}
```

---

## Updated Zod Schema

```typescript
const shopAllocationSchema = z.object({
  shopId: z.string().min(1, 'Shop is required'),
  shopName: z.string(),
  qty: z.number()
    .min(0, 'Quantity cannot be negative')
    .int('Quantity must be a whole number'),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
});

const orderSchema = z.object({
  costingId: z.string().min(1, 'Please select a design'),
  sampleNo: z.string().max(50, 'Sample number cannot exceed 50 characters').optional().or(z.literal('')),
  orderDate: z.string().min(1, 'Order date is required'),
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
  shopAllocations: z.array(shopAllocationSchema)
    .min(1, 'At least one shop allocation is required'),
}).refine(
  (data) => {
    const total = data.shopAllocations.reduce((sum, alloc) => sum + (alloc.qty || 0), 0);
    return total > 0;
  },
  {
    message: 'At least one shop must have a quantity greater than 0',
    path: ['shopAllocations'],
  }
);

type OrderFormValues = z.infer<typeof orderSchema>;
```

**Key changes from current schema:**
- Added `sampleNo` field
- Each individual `shopAllocationSchema` now validates `sizes.min(1)` directly (instead of a top-level refine)
- Removed the separate refine for sizes validation (moved into the shopAllocationSchema itself)
- Added `.min(1)` to the `shopAllocations` array (at least one allocation required)

---

## Shop Allocation UX — Selective Shop Display

### Core Concept

Instead of loading ALL shops and rendering a row for each:
1. Fetch all active shops into a local `activeShops` state (same as before).
2. Do **NOT** auto-populate `shopAllocations` with all shops.
3. Show a **dropdown** (`<select>`) listing available shops (those not yet added).
4. When the user selects a shop from the dropdown:
   - Add a new entry to `shopAllocations` with `qty: 0, sizes: []`
   - Remove that shop from the "available" list in the dropdown
5. Each allocation row has a **remove (×)** button to delete it.
6. An **"Add All Shops"** button adds every remaining unallocated shop at once.

### State Management

```typescript
const [activeShops, setActiveShops] = useState<any[]>([]);
const [shopsLoading, setShopsLoading] = useState(true);

// Use useFieldArray for dynamic allocations
const { fields, append, remove } = useFieldArray({
  control,
  name: 'shopAllocations',
});
```

### Available Shops Computation

```typescript
// Compute which shops haven't been added yet
const allocatedShopIds = new Set(
  (watch('shopAllocations') || []).map((a: any) => a.shopId)
);

const availableShops = activeShops.filter(
  (shop) => !allocatedShopIds.has(shop._id)
);
```

### Add Shop Handler

```typescript
const handleAddShop = (shopId: string) => {
  const shop = activeShops.find((s) => s._id === shopId);
  if (!shop) return;
  
  append({
    shopId: shop._id,
    shopName: shop.name,
    qty: 0,
    sizes: [],
  });
};
```

### Add All Shops Handler

```typescript
const handleAddAllShops = () => {
  availableShops.forEach((shop) => {
    append({
      shopId: shop._id,
      shopName: shop.name,
      qty: 0,
      sizes: [],
    });
  });
};
```

### Remove Shop Handler

```typescript
const handleRemoveShop = (index: number) => {
  remove(index);
};
```

### Edit Mode (`initialData` Provided)

When editing an existing order:
1. The order's `shopAllocations` already contains the allocated shops.
2. Populate the `shopAllocations` field array with these existing allocations.
3. The dropdown should still show remaining (unallocated) shops.

```typescript
useEffect(() => {
  if (initialData?.shopAllocations) {
    // Map existing allocations to form values
    const existingAllocations = initialData.shopAllocations.map((alloc: any) => ({
      shopId: typeof alloc.shopId === 'object' ? alloc.shopId._id : alloc.shopId,
      shopName: alloc.shopName || alloc.shopId?.name || '',
      qty: alloc.qty || 0,
      sizes: alloc.sizes || [],
    }));
    setValue('shopAllocations', existingAllocations);
  }
}, [initialData, setValue]);
```

---

## Shop Allocation Row Component

Each shop allocation row should display:

```
┌─────────────────────────────────────────────────┐
│ 🟢 Shop Name (color dot)              [× Remove] │
│                                                   │
│ Quantity: [________] (number input, right-aligned) │
│                                                   │
│ Sizes: (toggle chip buttons)                      │
│ [S] [M] [L] [XL] [2XL] [3XL] [4XL] [FREE]       │
│ [28] [30] [32] [34] [36] [38] [40]                │
│ Selected: M, L, XL                                │
└─────────────────────────────────────────────────┘
```

The **color dot** comes from the shop's `color` field. Look up the shop in `activeShops` to get its color.

The **sizes** use toggle chip buttons (same as current `ShopAllocationSection`). Keep the standard + numeric size groups.

---

## Form Default Values

```typescript
const defaultValues: OrderFormValues = {
  costingId: initialData?.costingId?._id || initialData?.costingId || '',
  sampleNo: initialData?.sampleNo || '',
  orderDate: initialData?.orderDate
    ? new Date(initialData.orderDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
  status: initialData?.status || 'PENDING',
  notes: initialData?.notes || '',
  shopAllocations: [], // Populated dynamically (NOT all shops)
};
```

---

## Enter-Key Navigation

Follow the exact same pattern as `CostingForm.tsx` (see Guide 06 for details). The key components:

1. `inputRefs` — a `useRef` holding an array of all focusable elements
2. `submitBtnRef` — ref to the submit button
3. `mergeRefs()` — merges react-hook-form's `register()` ref with the navigation ref
4. `handleFormKeyDown()` — the form-level `onKeyDown` handler

### Field Navigation Order

```
1.  Design No (select/dropdown)
2.  Sample No (text input)
3.  Order Date (date input)
4.  Status (select)
5.  Notes (textarea — SKIP Enter nav for textarea, textarea uses Enter for newlines)
6.  [For each shop allocation row]:
    6a. Quantity (number input)
    → Note: Size chip buttons are NOT part of Enter nav (they are clicked)
7.  [Next shop allocation row, if any]
8.  [Last field Enter → triggers Save button]
```

**Important**: The `<textarea>` for notes should NOT participate in Enter-key navigation. The `handleFormKeyDown` should only trigger on `HTMLInputElement` and `HTMLSelectElement`, which is already the pattern in `CostingForm.tsx`.

**Important**: The size toggle buttons are `<button type="button">` elements and are NOT part of the Enter navigation chain. Only quantity inputs participate.

---

## Design Selection & Preview

When the user selects a design from the dropdown:

1. Set `costingId` in the form
2. Store the full design object in local state (`selectedDesign`)
3. Display a preview card showing:
   - Description
   - Sizes (as tags/chips)
   - Selling Price
   - Total Cost

```typescript
const handleDesignChange = (costingId: string) => {
  const design = availableDesigns.find((d) => d._id === costingId);
  setSelectedDesign(design || null);
  setValue('costingId', costingId);
  if (errors.costingId) clearErrors('costingId');
};
```

### Selected Design Preview JSX Pattern

```tsx
{selectedDesign && (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 animate-fade-in">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Design</p>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Description</span>
        <span className="text-sm font-bold text-slate-900">{selectedDesign.description}</span>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Sizes</span>
        <div className="flex flex-wrap gap-1">
          {(selectedDesign.sizes || []).map((sz) => (
            <span key={sz} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
              {sz}
            </span>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Selling Price</span>
        <span className="text-sm font-black text-slate-900 font-mono">
          LKR {selectedDesign.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Total Cost</span>
        <span className="text-sm font-black text-slate-900 font-mono">
          LKR {selectedDesign.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  </div>
)}
```

---

## Summary Section

The summary section should be always visible (not behind a step) and show live-calculated values:

```typescript
const designTotalCalc = (watch('shopAllocations') || []).reduce(
  (sum, a) => sum + (a.qty || 0), 0
);

const projectedRevenueCalc = selectedDesign
  ? Number((selectedDesign.sellingPrice * designTotalCalc).toFixed(2))
  : 0;

const projectedProfitCalc = selectedDesign
  ? Number(((selectedDesign.sellingPrice - selectedDesign.totalCost) * designTotalCalc).toFixed(2))
  : 0;
```

---

## Form Submit Handler

```typescript
const onFormSubmit = async (data: OrderFormValues) => {
  setIsSubmitting(true);
  try {
    const cleanedData = {
      ...data,
      shopAllocations: data.shopAllocations
        .filter((a) => a.qty > 0)  // Only send allocations with qty > 0
        .map((a) => ({
          shopId: a.shopId,
          shopName: a.shopName,
          qty: a.qty,
          sizes: a.sizes,
        })),
    };
    await onSubmit(cleanedData);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Input Styling

Use the same `inputClass` helper as the existing form (and costing form):

```typescript
const inputClass = (error?: boolean) =>
  `mt-1 block w-full rounded-lg border ${
    error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
  } px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all min-h-[42px]`;
```

---

## Styling Consistency Checklist

- ✅ White card wrapper: `bg-white rounded-2xl shadow-sm border border-slate-100`
- ✅ Section headers: `text-sm font-black text-slate-700 uppercase tracking-wider`
- ✅ Labels: `text-sm font-bold text-slate-700 mb-1`
- ✅ Required asterisk: `<span className="text-red-500">*</span>`
- ✅ Error messages: `text-xs font-semibold text-red-600`
- ✅ Mono font for numbers: `font-mono`
- ✅ Green accent: `text-green-600`, `bg-green-50`, `border-green-500`
- ✅ Sticky footer: `absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100`
- ✅ Submit button: gradient green `bg-gradient-to-r from-green-600 to-green-500` with shadow
- ✅ `pb-20` on the wrapper for footer clearance

---

## Constants to Keep

Keep these constants from the existing file:

```typescript
const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'FREE'];
const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38', '40'];

const SHOP_COLOR_MAP: Record<string, string> = { /* ... keep as-is ... */ };

const resolveShopColor = (shopColor: string) => SHOP_COLOR_MAP[shopColor] || '#16a34a';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
```

---

## What to Remove

- ❌ The `step` state and all step-related logic (`setStep`, `nextStep`, `prevStep`)
- ❌ The stepper header UI (progress bar, numbered circles)
- ❌ The `validateStep1`, `validateStep2` functions
- ❌ The conditional rendering (`{step === 1 && (...)}`, `{step === 2 && (...)}`, `{step === 3 && (...)}`)
- ❌ The "Next Step" and "Back" buttons
- ❌ The `replace()` call that populates ALL shops into shopAllocations
- ❌ The `{step < 3 ? ... : ...}` footer logic
- ❌ The `ShopAllocationSection` sub-component (replace with a new inline or extracted component)

---

## Imports

Update imports to include what's needed:

```typescript
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, AlertCircle, Loader2, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
```

Remove: `CheckCircle2`, `ChevronLeft`, `ChevronRight` (stepper icons no longer needed).
