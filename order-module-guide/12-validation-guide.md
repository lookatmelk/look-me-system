# 12 — Validation Guide

> Comprehensive validation strategy for the Orders module covering Zod schemas, Mongoose validations, server-side API validation, and client-side form validation.

---

## Validation Layers

```
┌──────────────────────────┐
│   Layer 1: Client-Side   │  ← react-hook-form + Zod (instant feedback)
│   (OrderForm.tsx)        │
├──────────────────────────┤
│   Layer 2: API Route     │  ← Server-side validation in route handlers
│   (route.ts)             │
├──────────────────────────┤
│   Layer 3: Mongoose      │  ← Schema validators + pre-save hooks
│   (OrderRecord.ts)       │
└──────────────────────────┘
```

All three layers must be consistent. If validation passes Layer 1 (client), it should also pass Layers 2 and 3 (server).

---

## 1. Zod Schema (Client-Side)

**File:** `src/components/orders/OrderForm.tsx`

```typescript
import * as z from 'zod';

// ─── Sub-schemas ───

const shopAllocationSchema = z.object({
  qty: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(99999, 'Quantity too large'),
  sizes: z
    .array(z.string())
    .default([]),
});

// ─── Main Order Schema ───

const orderSchema = z.object({
  costingId: z
    .string()
    .min(1, 'Please select a design number'),

  orderDate: z
    .string()
    .min(1, 'Order date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format'),

  status: z.enum(
    ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
    { errorMap: () => ({ message: 'Invalid order status' }) }
  ),

  shop1: shopAllocationSchema,
  shop2: shopAllocationSchema,
  shop3: shopAllocationSchema,

  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

// ─── Cross-Field Refinements ───

const orderSchemaRefined = orderSchema
  .refine(
    (data) => {
      const total = (data.shop1.qty || 0) + (data.shop2.qty || 0) + (data.shop3.qty || 0);
      return total > 0;
    },
    {
      message: 'At least one shop must have a quantity greater than 0',
      path: ['shop1', 'qty'],
    }
  )
  .refine(
    (data) => {
      // If a shop has qty > 0, it must have at least one size
      const shops = [data.shop1, data.shop2, data.shop3];
      return shops.every(shop => shop.qty === 0 || shop.sizes.length > 0);
    },
    {
      message: 'Shops with a quantity must have at least one size selected',
      path: ['shop1', 'sizes'],
    }
  );

type OrderFormValues = z.infer<typeof orderSchema>;
```

---

## 2. Per-Step Validation

The form uses a 3-step wizard. Each step validates only its own fields before allowing progression.

### Step 1 → Step 2

```typescript
const validateStep1 = async (): Promise<boolean> => {
  const isValid = await trigger(['costingId', 'orderDate', 'status']);
  return isValid;
};
```

**Fields validated:**
| Field | Rule | Error Message |
|-------|------|---------------|
| `costingId` | Required, non-empty string | "Please select a design number" |
| `orderDate` | Required, valid date format | "Order date is required" / "Invalid date format" |
| `status` | Must be one of the enum values | "Invalid order status" |

### Step 2 → Step 3

```typescript
const validateStep2 = async (): Promise<boolean> => {
  // 1. Validate individual shop fields
  const fieldsValid = await trigger(['shop1', 'shop2', 'shop3']);

  // 2. Check total qty > 0
  const total = (watch('shop1.qty') || 0) + (watch('shop2.qty') || 0) + (watch('shop3.qty') || 0);
  if (total === 0) {
    setError('shop1.qty', {
      type: 'manual',
      message: 'At least one shop must have a quantity greater than 0',
    });
    return false;
  }

  // 3. Check sizes for shops with qty > 0
  let sizesValid = true;
  (['shop1', 'shop2', 'shop3'] as const).forEach(key => {
    const qty = watch(`${key}.qty`) || 0;
    const sizes = watch(`${key}.sizes`) || [];
    if (qty > 0 && sizes.length === 0) {
      setError(`${key}.sizes` as any, {
        type: 'manual',
        message: `Select at least one size for ${key === 'shop1' ? 'Shop 1' : key === 'shop2' ? 'Shop 2' : 'Shop 3'}`,
      });
      sizesValid = false;
    }
  });

  return fieldsValid && sizesValid;
};
```

**Fields validated:**
| Field | Rule | Error Message |
|-------|------|---------------|
| `shop1.qty` | Number, integer, min 0, max 99999 | "Quantity must be a whole number" / "Quantity cannot be negative" |
| `shop2.qty` | Same as above | Same |
| `shop3.qty` | Same as above | Same |
| Total qty | At least one > 0 | "At least one shop must have a quantity > 0" |
| `shopX.sizes` | Required if `shopX.qty > 0` | "Select at least one size for Shop X" |

### Step 3 (Final Submit)

The full schema is validated on submit via `handleSubmit(onSubmit)` from react-hook-form.

---

## 3. Server-Side API Validation

**File:** `src/app/api/orders/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // ─── Validate Required Fields ───
    if (!body.costingId) {
      return NextResponse.json(
        { success: false, error: 'Design selection (costingId) is required.' },
        { status: 400 }
      );
    }

    // ─── Validate CostingRecord Exists ───
    const costing = await CostingRecord.findById(body.costingId);
    if (!costing) {
      return NextResponse.json(
        { success: false, error: 'Selected design not found in costing records.' },
        { status: 404 }
      );
    }

    // ─── Validate Shop Quantities ───
    const shop1Qty = body.shop1?.qty || 0;
    const shop2Qty = body.shop2?.qty || 0;
    const shop3Qty = body.shop3?.qty || 0;
    const totalQty = shop1Qty + shop2Qty + shop3Qty;

    if (totalQty <= 0) {
      return NextResponse.json(
        { success: false, error: 'At least one shop must have a quantity greater than 0.' },
        { status: 400 }
      );
    }

    // ─── Validate Sizes for Active Shops ───
    const shops = [
      { key: 'Shop 1', data: body.shop1 },
      { key: 'Shop 2', data: body.shop2 },
      { key: 'Shop 3', data: body.shop3 },
    ];

    for (const shop of shops) {
      if ((shop.data?.qty || 0) > 0 && (!shop.data?.sizes || shop.data.sizes.length === 0)) {
        return NextResponse.json(
          { success: false, error: `${shop.key} has a quantity but no sizes selected.` },
          { status: 400 }
        );
      }
    }

    // ─── Validate Status ───
    const validStatuses = ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${body.status}` },
        { status: 400 }
      );
    }

    // ─── Validate Order Date ───
    if (!body.orderDate) {
      return NextResponse.json(
        { success: false, error: 'Order date is required.' },
        { status: 400 }
      );
    }

    // ─── Validate Notes Length ───
    if (body.notes && body.notes.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Notes cannot exceed 500 characters.' },
        { status: 400 }
      );
    }

    // ... continue with creating the record
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## 4. Mongoose Schema Validation

**File:** `src/models/OrderRecord.ts`

These are the **last line of defense** — they prevent invalid data from reaching the database.

| Field | Mongoose Validator | Error Message |
|-------|-------------------|---------------|
| `designNo` | `required: [true, 'Design number is required']` | "Design number is required" |
| `costingId` | `required: [true, 'Costing reference is required']` | "Costing reference is required" |
| `description` | `required: [true, 'Description is required']` | "Description is required" |
| `shop1.qty` | `min: [0, 'Quantity cannot be negative']` | "Quantity cannot be negative" |
| `shop2.qty` | Same | Same |
| `shop3.qty` | Same | Same |
| `shop1.sizes` | Custom validator for valid size values | "Invalid size value found" |
| `status` | `enum: ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']` | "{VALUE} is not a valid order status" |
| `orderDate` | `required: [true, 'Order date is required']` | "Order date is required" |
| `notes` | `maxLength: [500, 'Notes cannot exceed 500 characters']` | "Notes cannot exceed 500 characters" |
| `sellingPrice` | `min: [0, 'Selling price cannot be negative']` | "Selling price cannot be negative" |
| `totalCost` | `min: [0, 'Total cost cannot be negative']` | "Total cost cannot be negative" |

---

## 5. Error Display in Form

All validation errors should be displayed inline, **below the relevant field**, using the standard error style:

```tsx
{errors.costingId && (
  <p className="mt-1 text-xs text-red-600">{errors.costingId.message}</p>
)}
```

For cross-field errors (e.g., total qty must be > 0), display above the affected section:

```tsx
{errors.shop1?.qty?.type === 'manual' && (
  <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-3 flex items-start gap-2">
    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
    <p>{errors.shop1.qty.message}</p>
  </div>
)}
```

---

## 6. Validation Matrix

| Field | Client (Zod) | API (Route) | Mongoose | Notes |
|-------|:---:|:---:|:---:|-------|
| costingId required | ✅ | ✅ | ✅ | Must exist in CostingRecord |
| costingId exists in DB | ❌ | ✅ | ❌ | Only API can check DB |
| orderDate required | ✅ | ✅ | ✅ | |
| orderDate valid format | ✅ | ✅ | ✅ | Date type auto-validates |
| status enum | ✅ | ✅ | ✅ | |
| shop qty ≥ 0 | ✅ | ✅ | ✅ | |
| shop qty is integer | ✅ | ❌ | ❌ | Client-only UX concern |
| shop qty ≤ 99999 | ✅ | ❌ | ❌ | Client-only UX concern |
| total qty > 0 | ✅ | ✅ | ❌ | Cross-field validation |
| sizes required if qty > 0 | ✅ | ✅ | ❌ | Cross-field validation |
| sizes values valid | ❌ | ❌ | ✅ | Custom Mongoose validator |
| notes max 500 chars | ✅ | ✅ | ✅ | |
| sellingPrice ≥ 0 | ❌ | ❌ | ✅ | Set by server, not user |
| totalCost ≥ 0 | ❌ | ❌ | ✅ | Set by server, not user |

---

## 7. Error Response Format

All API error responses follow the existing convention:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

HTTP status codes:
| Code | Usage |
|------|-------|
| `400` | Validation errors, bad request |
| `404` | CostingRecord not found, OrderRecord not found |
| `409` | Duplicate conflict (if applicable) |
| `500` | Internal server error |

---

> **Next:** [13-testing-guide.md](./13-testing-guide.md)
