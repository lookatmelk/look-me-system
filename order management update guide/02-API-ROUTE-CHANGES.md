# Guide 02 — API Route Changes

## Files to Modify

1. `src/app/api/orders/designs/route.ts` — Fix costing field references
2. `src/app/api/orders/route.ts` — Update GET search, POST handler
3. `src/app/api/orders/[id]/route.ts` — Update GET populate, PUT handler
4. `src/app/api/orders/stats/route.ts` — Add sampleNo awareness (minor)

---

## Change 1: Fix Designs API (`/api/orders/designs/route.ts`)

### Problem

The current designs API selects `size` (singular) from CostingRecord:

```typescript
const designs = await CostingRecord.find({})
  .select('designNo description sellingPrice totalCost profitPercentage size')
  .sort({ designNo: 1 });
```

The CostingRecord model no longer has a `size` field — it now has `sizes` (array of strings).

### Fix

Replace `size` with `sizes` in the `.select()` call:

```diff
 const designs = await CostingRecord.find({})
-  .select('designNo description sellingPrice totalCost profitPercentage size')
+  .select('designNo description sellingPrice totalCost profitPercentage sizes')
   .sort({ designNo: 1 });
```

### Complete updated file:

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET() {
  try {
    await dbConnect();

    const designs = await CostingRecord.find({})
      .select('designNo description sellingPrice totalCost profitPercentage sizes')
      .sort({ designNo: 1 });

    return NextResponse.json({
      success: true,
      data: designs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## Change 2: Update Orders GET Route (`/api/orders/route.ts`)

### 2a. Add `sampleNo` to Search

The GET handler builds a regex-based `$or` query for text search. Add `sampleNo` to the search targets:

```diff
 if (search) {
   const regex = new RegExp(search, 'i');
   query.$or = [
     { designNo: regex },
     { description: regex },
+    { sampleNo: regex },
   ];
 }
```

### 2b. Add `sampleNo` Exact Filter

Add support for filtering by exact `sampleNo`:

```diff
 const designNo = searchParams.get('designNo');
 if (designNo) query.designNo = designNo;

+const sampleNo = searchParams.get('sampleNo');
+if (sampleNo) query.sampleNo = sampleNo;
```

### 2c. Fix Populate Calls

The populate call for `costingId` references `size` — change to `sizes`:

```diff
-.populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric')
+.populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
```

Also remove `fabric` from the populate — that field no longer exists on CostingRecord.

---

## Change 3: Update Orders POST Route (`/api/orders/route.ts`)

### 3a. Accept `sampleNo` in Payload

No explicit validation is needed for `sampleNo` since it's optional, but include it in the payload that gets saved. The current code uses spread (`...body`) so `sampleNo` will be passed through automatically.

However, to make it explicit and mirror `designNo`, add it to the payload construction:

```diff
 const payload = {
   ...body,
   shopAllocations: filteredAllocations,
   designNo: costing.designNo,
+  sampleNo: body.sampleNo || '',
   description: costing.description,
   sellingPrice: costing.sellingPrice,
   totalCost: costing.totalCost,
   profitPercentage: costing.profitPercentage,
   designTotal: totalQty,
 };
```

### 3b. Fix Populate on Returned Record

```diff
 const populatedRecord = await OrderRecord.findById(record._id)
-  .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric')
+  .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
   .populate('shopAllocations.shopId', 'name slug color');
```

---

## Change 4: Update Orders GET/PUT/DELETE by ID (`/api/orders/[id]/route.ts`)

### 4a. Fix GET Populate

```diff
 const record = await OrderRecord.findById(id)
-  .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric fabricPrice')
+  .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
   .populate('shopAllocations.shopId', 'name slug color');
```

### 4b. Fix PUT Populate

```diff
 const record = await OrderRecord.findByIdAndUpdate(id, payload, {
   new: true,
   runValidators: true,
 })
-.populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric')
+.populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
 .populate('shopAllocations.shopId', 'name slug color');
```

### 4c. Handle `sampleNo` in PUT

The PUT handler uses spread (`...body`), so `sampleNo` will pass through. No additional changes needed unless you want explicit handling. The model schema will handle validation.

---

## Change 5: Update Stats Route (`/api/orders/stats/route.ts`)

No structural changes required. The stats aggregation does not reference `sampleNo` or any costing fields directly. This file is fine as-is.

---

## Summary of All Populate Changes

Every `.populate('costingId', ...)` call across the orders API must be updated to:

```typescript
.populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
```

**Removed fields**: `size`, `fabric`, `fabricPrice` (they no longer exist on CostingRecord).
**Added fields**: `sizes` (the new array field).

---

## Verification

After making these changes:
1. `GET /api/orders/designs` should return designs with `sizes` (array) instead of `size` (string).
2. `POST /api/orders` should accept a `sampleNo` field and persist it.
3. `GET /api/orders` should:
   - Search across `designNo`, `description`, and `sampleNo`.
   - Filter by exact `sampleNo` if provided.
   - Return populated costing data with `sizes` array.
4. `GET /api/orders/:id` should return the order with `sampleNo` and correct costing fields.
5. `PUT /api/orders/:id` should accept `sampleNo` updates.
6. No 500 errors from referencing non-existent costing fields.
