# 05 — Order Form (Add / Edit)

> **Files to create:**
> - `src/app/admin/orders/add/page.tsx` — Full-page Add Order form
> - `src/app/admin/orders/[id]/edit/page.tsx` — Full-page Edit Order form
> - `src/components/orders/OrderForm.tsx` — Shared form component (used by both Add and Edit)

---

## Overview

Multi-step wizard form (3 steps), matching the purchasing and costing form patterns. Uses a **dedicated full page** (not a modal), following the purchasing module's `/add` and `/[id]/edit` pattern.

| Step | Title | Fields |
|------|-------|--------|
| 1 | **Design Selection** | Design Number (dropdown from CostingRecord), auto-filled Description, Order Date, Status |
| 2 | **Shop Allocations** | Shop 1 (Qty + Sizes), Shop 2 (Qty + Sizes), Shop 3 (Qty + Sizes) |
| 3 | **Review & Confirm** | Summary of all entries + live calculated totals + costing info |

---

## Zod Validation Schema

```typescript
import * as z from 'zod';

const shopAllocationSchema = z.object({
  qty: z.number()
    .min(0, 'Quantity cannot be negative')
    .int('Quantity must be a whole number'),
  sizes: z.array(z.string()).default([]),
});

const orderSchema = z.object({
  costingId: z.string().min(1, 'Please select a design'),
  orderDate: z.string().min(1, 'Order date is required'),
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  shop1: shopAllocationSchema,
  shop2: shopAllocationSchema,
  shop3: shopAllocationSchema,
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
}).refine(
  (data) => {
    const total = (data.shop1.qty || 0) + (data.shop2.qty || 0) + (data.shop3.qty || 0);
    return total > 0;
  },
  {
    message: 'At least one shop must have a quantity greater than 0',
    path: ['shop1', 'qty'],
  }
).refine(
  (data) => {
    // If a shop has qty > 0, it should have at least one size selected
    if (data.shop1.qty > 0 && data.shop1.sizes.length === 0) return false;
    if (data.shop2.qty > 0 && data.shop2.sizes.length === 0) return false;
    if (data.shop3.qty > 0 && data.shop3.sizes.length === 0) return false;
    return true;
  },
  {
    message: 'Shops with quantity must have at least one size selected',
    path: ['shop1', 'sizes'],
  }
);

type OrderFormValues = z.infer<typeof orderSchema>;
```

---

## Component Interface

```typescript
interface OrderFormProps {
  initialData?: any;                    // null for Add, populated for Edit
  availableDesigns: DesignOption[];     // From /api/orders/designs
  isLoading?: boolean;
  onSubmit: (data: OrderFormValues) => Promise<void>;
}

interface DesignOption {
  _id: string;
  designNo: string;
  description: string;
  sellingPrice: number;
  totalCost: number;
  profitPercentage: number;
  size: string;
}
```

---

## Step 1: Design Selection

```tsx
{step === 1 && (
  <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">

    {/* ★ Design Number — DROPDOWN FROM COSTING RECORDS ★ */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Design Number <span className="text-red-500">*</span>
        <span className="text-xs text-slate-400 ml-1">(from costing)</span>
      </label>
      <select
        {...register('costingId')}
        onChange={(e) => {
          register('costingId').onChange(e);
          handleDesignChange(e.target.value);
        }}
        className={`mt-1 block w-full rounded-md border ${
          errors.costingId ? 'border-red-500' : 'border-gray-300'
        } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
      >
        <option value="">Select a design number...</option>
        {availableDesigns.map((design) => (
          <option key={design._id} value={design._id}>
            {design.designNo} — {design.description} (LKR {design.sellingPrice.toLocaleString()})
          </option>
        ))}
      </select>
      {errors.costingId && (
        <p className="mt-1 text-xs text-red-600">{errors.costingId.message}</p>
      )}
    </div>

    {/* Auto-filled Design Info Card */}
    {selectedDesign && (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 space-y-2 animate-fade-in">
        <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Selected Design</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Description</span>
            <span className="text-sm font-bold text-slate-900">{selectedDesign.description}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Size</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
              {selectedDesign.size}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Selling Price</span>
            <span className="text-sm font-black text-green-700 font-mono">
              LKR {selectedDesign.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Total Cost</span>
            <span className="text-sm font-black text-red-700 font-mono">
              LKR {selectedDesign.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    )}

    {/* Order Date */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Order Date <span className="text-red-500">*</span>
      </label>
      <input
        type="date"
        {...register('orderDate')}
        className={`mt-1 block w-full rounded-md border ${
          errors.orderDate ? 'border-red-500' : 'border-gray-300'
        } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
      />
      {errors.orderDate && (
        <p className="mt-1 text-xs text-red-600">{errors.orderDate.message}</p>
      )}
    </div>

    {/* Status (default PENDING for new orders) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Status <span className="text-red-500">*</span>
      </label>
      <select
        {...register('status')}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white"
      >
        <option value="PENDING">Pending</option>
        <option value="IN_PRODUCTION">In Production</option>
        <option value="DISPATCHED">Dispatched</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>

    {/* Notes */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Notes <span className="text-xs text-slate-400 ml-1">(optional)</span>
      </label>
      <textarea
        {...register('notes')}
        rows={3}
        placeholder="Any additional notes about this order..."
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white resize-none"
      />
      {errors.notes && (
        <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
      )}
    </div>
  </div>
)}
```

---

## Step 2: Shop Allocations

Each shop has a **Quantity input** and a **Sizes multi-select** (chip-based). This mirrors the Excel "Orders" sheet structure.

```tsx
{step === 2 && (
  <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

    {/* ── Shop 1 ── */}
    <ShopAllocationSection
      shopName="Shop 1"
      shopColor="blue"
      shopKey="shop1"
      register={register}
      watch={watch}
      setValue={setValue}
      errors={errors}
    />

    {/* ── Shop 2 ── */}
    <ShopAllocationSection
      shopName="Shop 2"
      shopColor="violet"
      shopKey="shop2"
      register={register}
      watch={watch}
      setValue={setValue}
      errors={errors}
    />

    {/* ── Shop 3 ── */}
    <ShopAllocationSection
      shopName="Shop 3"
      shopColor="emerald"
      shopKey="shop3"
      register={register}
      watch={watch}
      setValue={setValue}
      errors={errors}
    />

    {/* Live Design Total */}
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
      <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Design Total</span>
      <span className="text-2xl font-black text-green-700 font-mono">
        {designTotalCalc.toLocaleString()}
      </span>
    </div>
  </div>
)}
```

### ShopAllocationSection Component

```tsx
function ShopAllocationSection({
  shopName,
  shopColor,
  shopKey,
  register,
  watch,
  setValue,
  errors,
}: {
  shopName: string;
  shopColor: string;
  shopKey: 'shop1' | 'shop2' | 'shop3';
  register: any;
  watch: any;
  setValue: any;
  errors: any;
}) {
  const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'FREE'];
  const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
  const currentSizes: string[] = watch(`${shopKey}.sizes`) || [];
  const currentQty = watch(`${shopKey}.qty`) || 0;

  const toggleSize = (size: string) => {
    const updated = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    setValue(`${shopKey}.sizes`, updated);
  };

  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50/50',
    violet: 'border-violet-200 bg-violet-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
  };
  const chipActive: Record<string, string> = {
    blue: 'bg-blue-600 text-white border-blue-600',
    violet: 'bg-violet-600 text-white border-violet-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
  };

  return (
    <div className={clsx('p-4 rounded-xl border-2', colorMap[shopColor])}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Store className={`h-4 w-4 text-${shopColor}-600`} />
          <span className="text-sm font-bold text-slate-800">{shopName}</span>
        </div>
        {currentQty > 0 && (
          <span className={`text-xs font-bold text-${shopColor}-700 bg-${shopColor}-100 px-2 py-0.5 rounded-full`}>
            {currentQty} units
          </span>
        )}
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
        <input
          type="number"
          min="0"
          step="1"
          {...register(`${shopKey}.qty`, { valueAsNumber: true })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-right font-mono text-sm shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 bg-white"
          placeholder="0"
        />
      </div>

      {/* Sizes (Multi-Select Chips) */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Available Sizes
          {currentQty > 0 && currentSizes.length === 0 && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>

        {/* Text Sizes */}
        <p className="text-[10px] text-slate-400 font-medium mb-1.5">Standard</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {AVAILABLE_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                currentSizes.includes(size)
                  ? chipActive[shopColor]
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Numeric Sizes */}
        <p className="text-[10px] text-slate-400 font-medium mb-1.5">Numeric</p>
        <div className="flex flex-wrap gap-1.5">
          {NUMERIC_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                currentSizes.includes(size)
                  ? chipActive[shopColor]
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Selected sizes summary */}
        {currentSizes.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-2">
            Selected: <span className="font-semibold">{currentSizes.join(', ')}</span>
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## Step 3: Review & Confirm

```tsx
{step === 3 && (
  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">

    {/* Design Summary */}
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Summary</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Design No</span>
          <p className="font-bold text-slate-900">{selectedDesign?.designNo}</p>
        </div>
        <div>
          <span className="text-slate-500">Description</span>
          <p className="font-bold text-slate-900">{selectedDesign?.description}</p>
        </div>
      </div>
    </div>

    {/* Shop Breakdown */}
    <div className="space-y-2">
      {[
        { key: 'shop1', label: 'Shop 1', color: 'blue' },
        { key: 'shop2', label: 'Shop 2', color: 'violet' },
        { key: 'shop3', label: 'Shop 3', color: 'emerald' },
      ].map(shop => {
        const qty = watch(`${shop.key}.qty`) || 0;
        const sizes = watch(`${shop.key}.sizes`) || [];
        return (
          <div key={shop.key} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-white border border-slate-100">
            <div>
              <span className="text-sm font-semibold text-slate-700">{shop.label}</span>
              {sizes.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">{sizes.join(', ')}</p>
              )}
            </div>
            <span className={clsx(
              'font-mono text-sm font-bold',
              qty > 0 ? `text-${shop.color}-700` : 'text-slate-300'
            )}>
              {qty > 0 ? qty.toLocaleString() : '—'}
            </span>
          </div>
        );
      })}
    </div>

    {/* Totals */}
    <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Design Total</span>
        <span className="text-xl font-black text-green-700 font-mono">{designTotalCalc.toLocaleString()}</span>
      </div>
      <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
        <span className="text-slate-500">Selling Price × Total</span>
        <span className="font-bold text-slate-900 font-mono">
          LKR {projectedRevenueCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Projected Profit</span>
        <span className={clsx(
          'font-bold font-mono',
          projectedProfitCalc >= 0 ? 'text-green-700' : 'text-red-600'
        )}>
          LKR {projectedProfitCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>

    {/* Info notice */}
    <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-md flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p>Review all shop allocations carefully. Revenue and profit are calculated from the costing record.</p>
    </div>
  </div>
)}
```

---

## Live Calculation Variables

```typescript
const watchShop1Qty = watch('shop1.qty') || 0;
const watchShop2Qty = watch('shop2.qty') || 0;
const watchShop3Qty = watch('shop3.qty') || 0;

const designTotalCalc = Number(watchShop1Qty) + Number(watchShop2Qty) + Number(watchShop3Qty);

const projectedRevenueCalc = selectedDesign
  ? Number((selectedDesign.sellingPrice * designTotalCalc).toFixed(2))
  : 0;

const projectedProfitCalc = selectedDesign
  ? Number(((selectedDesign.sellingPrice - selectedDesign.totalCost) * designTotalCalc).toFixed(2))
  : 0;
```

---

## Stepper Navigation

Match the costing form stepper exactly:

```tsx
{/* Stepper Header */}
<div className="mb-8">
  <div className="flex items-center justify-between relative">
    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2" />
    <div
      className="absolute left-0 top-1/2 h-0.5 bg-[var(--color-primary)] transition-all duration-300 -z-10 transform -translate-y-1/2"
      style={{ width: `${((step - 1) / 2) * 100}%` }}
    />
    {[1, 2, 3].map((num) => (
      <div
        key={num}
        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white font-semibold text-sm transition-colors ${
          step >= num
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-gray-300 text-gray-400'
        }`}
      >
        {step > num ? <CheckCircle2 className="w-5 h-5 fill-current" /> : num}
      </div>
    ))}
  </div>
  <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
    <span>Design Selection</span>
    <span>Shop Allocations</span>
    <span>Review</span>
  </div>
</div>
```

---

## Step Validation

```typescript
const nextStep = async () => {
  let isValid = false;
  if (step === 1) {
    isValid = await trigger(['costingId', 'orderDate', 'status']);
  } else if (step === 2) {
    isValid = await trigger(['shop1', 'shop2', 'shop3']);
    // Additional check: at least one shop has qty > 0
    const total = (watch('shop1.qty') || 0) + (watch('shop2.qty') || 0) + (watch('shop3.qty') || 0);
    if (total === 0) {
      setError('shop1.qty', { message: 'At least one shop must have quantity > 0' });
      isValid = false;
    }
    // Check sizes for shops with qty > 0
    ['shop1', 'shop2', 'shop3'].forEach(key => {
      const qty = watch(`${key}.qty`) || 0;
      const sizes = watch(`${key}.sizes`) || [];
      if (qty > 0 && sizes.length === 0) {
        setError(`${key}.sizes`, { message: 'Select at least one size' });
        isValid = false;
      }
    });
  }
  if (isValid) setStep(step + 1);
};
```

---

## Default Values

```typescript
const defaultValues: OrderFormValues = {
  costingId: '',
  orderDate: new Date().toISOString().split('T')[0],  // Today
  status: 'PENDING',
  shop1: { qty: 0, sizes: [] },
  shop2: { qty: 0, sizes: [] },
  shop3: { qty: 0, sizes: [] },
  notes: '',
};
```

---

## Design Change Handler

```typescript
const [selectedDesign, setSelectedDesign] = useState<DesignOption | null>(null);

const handleDesignChange = (costingId: string) => {
  const design = availableDesigns.find(d => d._id === costingId);
  setSelectedDesign(design || null);
};
```

---

## Add Page Wrapper

**File:** `src/app/admin/orders/add/page.tsx`

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import OrderForm from '@/components/orders/OrderForm';
import { showToast, Toaster } from '@/components/ui/Toaster';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AddOrderPage() {
  const router = useRouter();
  const [availableDesigns, setAvailableDesigns] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await axios.get('/api/orders/designs');
        if (res.data.success) setAvailableDesigns(res.data.data);
      } catch { /* silent */ }
    };
    fetchDesigns();
  }, []);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/orders', data);
      if (res.data.success) {
        showToast('Order created successfully!', 'success');
        setTimeout(() => router.push('/admin/orders'), 1000);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <Toaster />

      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">
        Add Order
      </h1>

      <OrderForm
        availableDesigns={availableDesigns}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
```

---

## Key Notes

1. **The costingId field is a `<select>` dropdown**, populated from `/api/orders/designs` — displays `designNo — description (LKR price)`.
2. **Sizes use a chip/toggle UI**, NOT a text input or dropdown — each size is a clickable chip that toggles on/off.
3. **Both standard sizes (S, M, L, XL, 2XL, FREE) and numeric sizes (28, 30, 32, 34) are supported** — matching the Excel sheet data.
4. **Shop 1/2/3 are visually separated** with distinct accent colors (blue, violet, emerald) and border treatment.
5. **Same stepper progress bar** as the costing form — green gradient line.
6. **Uses ConfirmModal pattern** for navigation away (unsaved changes warning).
7. **Full-page form** (not modal) — follows the purchasing module's `/add` pattern.

---

> **Next:** [06-design-number-dropdown.md](./06-design-number-dropdown.md)
