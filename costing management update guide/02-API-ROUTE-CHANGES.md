# Guide 02 — API Route Changes

## Files to Modify

1. `src/app/api/costing/route.ts` — GET (list) + POST (create)
2. `src/app/api/costing/[id]/route.ts` — GET/PUT/DELETE by ID

## File to Delete

3. `src/app/api/costing/descriptions/route.ts` — **DELETE this entire file and folder**

This endpoint served as the bridge between Purchasing and Costing — it fetched PurchaseRecord descriptions and mapped them to fabric names. Since the costing ↔ purchasing relationship is being removed, this endpoint is no longer needed.

---

## Changes to `src/app/api/costing/route.ts`

### GET Handler Updates

#### Remove These Query Parameters
- `purchasingDescription` — no longer exists in schema
- Any references to `fabric` in the `$or` search regex

#### Update Search

**Before:**
```typescript
query.$or = [
  { designNo: regex },
  { description: regex },
  { purchasingDescription: regex },
  { fabric: regex },
];
```

**After:**
```typescript
query.$or = [
  { designNo: regex },
  { description: regex },
];
```

#### Remove Filter Logic
Remove these lines:
```typescript
const purchasingDescription = searchParams.get('purchasingDescription');
if (purchasingDescription) query.purchasingDescription = purchasingDescription;
```

#### Add Size Array Filter (Optional)
If filtering by size is needed:
```typescript
const size = searchParams.get('size');
if (size) {
  // Filter records that contain the specified size in the sizes array
  query.sizes = size;
}
```

### POST Handler Updates

The POST handler currently manually calculates derived fields before `CostingRecord.create(payload)`. The pre-save hook on the model should handle all calculations now, but for safety, the API should also validate and compute amounts.

**Replace the current calculation logic with:**

```typescript
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const payload = { ...body };

    // ─── Calculate line item amounts ───

    // Sewing: amount = rate × consumption
    if (payload.sewingItems) {
      payload.sewingItems = payload.sewingItems.map((item: any) => ({
        ...item,
        amount: Number((item.rate * item.consumption).toFixed(2)),
      }));
    }

    // Fabric: amount = (rate × consumption) + ((rate × consumption) / 100 × 5)
    if (payload.fabricItems) {
      payload.fabricItems = payload.fabricItems.map((item: any) => {
        const base = item.rate * item.consumption;
        return {
          ...item,
          amount: Number((base + (base / 100) * 5).toFixed(2)),
        };
      });
    }

    // Accessories: amount = rate × consumption
    if (payload.accessoriesItems) {
      payload.accessoriesItems = payload.accessoriesItems.map((item: any) => ({
        ...item,
        amount: Number((item.rate * item.consumption).toFixed(2)),
      }));
    }

    // Special: amount = rate × consumption
    if (payload.specialItems) {
      payload.specialItems = payload.specialItems.map((item: any) => ({
        ...item,
        amount: Number((item.rate * item.consumption).toFixed(2)),
      }));
    }

    // ─── Category Totals ───
    payload.sewingCost = Number(
      (payload.sewingItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );
    payload.fabricCost = Number(
      (payload.fabricItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );
    payload.accessoriesCost = Number(
      (payload.accessoriesItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );
    payload.specialCost = Number(
      (payload.specialItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );

    // ─── Grand Total ───
    payload.totalCost = Number(
      (payload.sewingCost + payload.fabricCost + payload.accessoriesCost + payload.specialCost).toFixed(2)
    );

    // ─── Profit ───
    if (payload.sellingPrice !== undefined) {
      payload.grossProfit = Number((payload.sellingPrice - payload.totalCost).toFixed(2));
    }
    if (payload.sellingPrice && payload.sellingPrice > 0) {
      payload.profitPercentage = Number(
        ((payload.grossProfit / payload.sellingPrice) * 100).toFixed(2)
      );
    } else {
      payload.profitPercentage = 0;
    }

    const record = await CostingRecord.create(payload);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A costing record with this design number already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## Changes to `src/app/api/costing/[id]/route.ts`

### PUT Handler Updates

Apply the exact same calculation logic as the POST handler above. Replace the current flat-field calculations with the line-item-based calculations.

**Current code to remove (lines 42-71 approximately):**
```typescript
if (payload.fabricPrice !== undefined && payload.fabricConsumption !== undefined) {
  payload.fabricCost = Number(
    (payload.fabricPrice * payload.fabricConsumption).toFixed(2)
  );
}
// ... old flat totalCost calculation ...
```

**Replace with** the same line-item calculation block shown in the POST handler above.

### GET Handler — No Changes Needed
The GET handler just fetches by `findById` and returns. It will automatically return the new schema structure.

### DELETE Handler — No Changes Needed
Delete logic is schema-agnostic.

---

## API Request/Response Shape Change

### Old POST/PUT Body:
```json
{
  "designNo": "1009",
  "description": "FRONT GATHARING LONG SLEEVE SHORT FROCK",
  "purchasingDescription": "VISCOSE PRINTED",
  "size": "M",
  "fabric": "VISCOSE PRINTED",
  "fabricPrice": 300,
  "fabricConsumption": 1,
  "printBelt": 0,
  "threadLabelsPollyBags": 0,
  "fusingElasticButtonZip": 0,
  "standardMinutesValue": 0,
  "sewingCost": 250,
  "accessoriesCost": 0,
  "sellingPrice": 1200
}
```

### New POST/PUT Body:
```json
{
  "designNo": "1009",
  "description": "FRONT GATHARING LONG SLEEVE SHORT FROCK",
  "sizes": ["S", "M", "L", "XL"],
  "sewingItems": [
    {
      "type": "SEWING",
      "description": "CUTTING, SEWING, PACKING",
      "unit": "SMV",
      "rate": 10.00,
      "consumption": 25.00
    }
  ],
  "fabricItems": [
    {
      "type": "FABRIC",
      "description": "VISCOSE PRINTED",
      "unit": "YADS",
      "rate": 300.00,
      "consumption": 1.00
    },
    {
      "type": "LILING",
      "description": "LINING",
      "unit": "YADS",
      "rate": 120.00,
      "consumption": 0.75
    },
    {
      "type": "FUSING",
      "description": "DOT FUSING",
      "unit": "YADS",
      "rate": 45.00,
      "consumption": 0.05
    }
  ],
  "accessoriesItems": [
    {
      "type": "THREADS",
      "description": "COTTON AND YARN",
      "unit": "CONN",
      "rate": 160.00,
      "consumption": 0.10
    },
    {
      "type": "ELASTIC",
      "description": "1\" ELASTIC",
      "unit": "ROLL",
      "rate": 400.00,
      "consumption": 0.50
    },
    {
      "type": "POLLY BAGS",
      "description": "11 X14 POLLY BAGS",
      "unit": "NOS",
      "rate": 9.50,
      "consumption": 1.00
    }
  ],
  "specialItems": [
    {
      "type": "EMB/PRINT",
      "description": "FRONT PRINT",
      "unit": "NOS",
      "rate": 60.00,
      "consumption": 1.00
    }
  ],
  "sellingPrice": 1200
}
```

### New GET Response:
All `amount` fields and category totals are auto-calculated:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "designNo": "1009",
    "description": "FRONT GATHARING LONG SLEEVE SHORT FROCK",
    "sizes": ["S", "M", "L", "XL"],
    "sewingItems": [
      { "type": "SEWING", "description": "CUTTING, SEWING, PACKING", "unit": "SMV", "rate": 10.00, "consumption": 25.00, "amount": 250.00 }
    ],
    "fabricItems": [
      { "type": "FABRIC", "description": "VISCOSE PRINTED", "unit": "YADS", "rate": 300.00, "consumption": 1.00, "amount": 315.00 }
    ],
    "accessoriesItems": [...],
    "specialItems": [...],
    "sewingCost": 250.00,
    "fabricCost": 411.86,
    "accessoriesCost": 360.96,
    "specialCost": 60.00,
    "totalCost": 1082.82,
    "sellingPrice": 1200.00,
    "grossProfit": 117.18,
    "profitPercentage": 9.77,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Deletion Instructions

### Delete Entire Directory: `src/app/api/costing/descriptions/`

This route fetches purchasing records and maps them for costing. It imports `PurchaseRecord` and `Category` models. Since the costing ↔ purchasing relationship is removed, this endpoint and its containing directory must be deleted.
