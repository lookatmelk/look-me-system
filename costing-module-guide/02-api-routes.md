# 02 — API Routes

> **Files to create:**
> - `src/app/api/costing/route.ts` — GET (list) + POST (create)
> - `src/app/api/costing/[id]/route.ts` — GET (single) + PUT (update) + DELETE
> - `src/app/api/costing/descriptions/route.ts` — GET (unique purchasing descriptions)

---

## 1. List + Create: `/api/costing/route.ts`

### GET `/api/costing`

Fetches all costing records with optional query parameters for filtering.

**Query Parameters:**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `search` | string | `"LEGGING"` | Search in designNo, description, fabricName |
| `size` | string | `"M"` | Exact match on size |
| `description` | string | `"Fabric for cotton"` | Exact match on description (from purchasing) |
| `minProfit` | number | `20` | Minimum profit percentage |
| `maxProfit` | number | `40` | Maximum profit percentage |
| `minTotalCost` | number | `200` | Minimum total cost |
| `maxTotalCost` | number | `1000` | Maximum total cost |
| `minSellingPrice` | number | `500` | Minimum selling price |
| `maxSellingPrice` | number | `2000` | Maximum selling price |
| `sortBy` | string | `"totalCost"` | Field to sort by |
| `sortOrder` | string | `"asc"` or `"desc"` | Sort direction |
| `limit` | number | `50` | Limit number of results |

**Response Shape:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "664abc...",
      "designNo": "1001",
      "description": "LEGGING",
      "size": "S",
      "fabricName": "VISCOSE LYCRA",
      "fabricPrice": 360.00,
      "fabricConsumption": 16,
      "printBelt": 0,
      "threadLabelsPollyBags": 10.00,
      "fusingElasticButtonZip": 5.00,
      "standardMinutesValue": 6,
      "fabricCost": 168.00,
      "sewingCost": 36.00,
      "accessoriesCost": 15.00,
      "totalCost": 219.00,
      "sellingPrice": 275.00,
      "grossProfit": 56.00,
      "profitPercentage": 25.57,
      "createdAt": "2026-03-29T...",
      "updatedAt": "2026-03-29T..."
    }
  ]
}
```

**Implementation Pattern (follows `src/app/api/purchasing/route.ts`):**

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // ─── Build Query ───
    const query: any = {};

    // Text search (case-insensitive regex)
    const search = searchParams.get('search');
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { designNo: regex },
        { description: regex },
        { fabricName: regex },
      ];
    }

    // Exact filters
    const size = searchParams.get('size');
    if (size) query.size = size;

    const description = searchParams.get('description');
    if (description) query.description = description;

    // Range filters — profit percentage
    const minProfit = searchParams.get('minProfit');
    const maxProfit = searchParams.get('maxProfit');
    if (minProfit || maxProfit) {
      query.profitPercentage = {};
      if (minProfit) query.profitPercentage.$gte = Number(minProfit);
      if (maxProfit) query.profitPercentage.$lte = Number(maxProfit);
    }

    // Range filters — total cost
    const minTotalCost = searchParams.get('minTotalCost');
    const maxTotalCost = searchParams.get('maxTotalCost');
    if (minTotalCost || maxTotalCost) {
      query.totalCost = {};
      if (minTotalCost) query.totalCost.$gte = Number(minTotalCost);
      if (maxTotalCost) query.totalCost.$lte = Number(maxTotalCost);
    }

    // Range filters — selling price
    const minSellingPrice = searchParams.get('minSellingPrice');
    const maxSellingPrice = searchParams.get('maxSellingPrice');
    if (minSellingPrice || maxSellingPrice) {
      query.sellingPrice = {};
      if (minSellingPrice) query.sellingPrice.$gte = Number(minSellingPrice);
      if (maxSellingPrice) query.sellingPrice.$lte = Number(maxSellingPrice);
    }

    // ─── Sort ───
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // ─── Limit ───
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.floor(Number(limitParam)) : null;

    // ─── Execute query ───
    let recordsQuery = CostingRecord.find(query).sort({ [sortBy]: sortOrder });
    if (limit && limit > 0) {
      recordsQuery = recordsQuery.limit(limit);
    }

    const records = await recordsQuery;

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

### POST `/api/costing`

Creates a new costing record.

```typescript
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Calculate derived fields before saving
    const payload = { ...body };

    // fabricCost
    if (payload.fabricPrice && payload.fabricConsumption) {
      payload.fabricCost = Number(
        (payload.fabricPrice * payload.fabricConsumption).toFixed(2)
      );
    }

    // totalCost
    payload.totalCost = Number(
      (
        (payload.fabricCost || 0) +
        (payload.sewingCost || 0) +
        (payload.accessoriesCost || 0) +
        (payload.printBelt || 0) +
        (payload.threadLabelsPollyBags || 0) +
        (payload.fusingElasticButtonZip || 0)
      ).toFixed(2)
    );

    // grossProfit
    if (payload.sellingPrice !== undefined) {
      payload.grossProfit = Number(
        (payload.sellingPrice - payload.totalCost).toFixed(2)
      );
    }

    // profitPercentage
    if (payload.sellingPrice && payload.sellingPrice > 0) {
      payload.profitPercentage = Number(
        ((payload.grossProfit / payload.sellingPrice) * 100).toFixed(2)
      );
    } else {
      payload.profitPercentage = 0;
    }

    const record = await CostingRecord.create(payload);

    return NextResponse.json(
      { success: true, data: record },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle duplicate designNo
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

## 2. Single Record CRUD: `/api/costing/[id]/route.ts`

### GET `/api/costing/:id`

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const record = await CostingRecord.findById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Costing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

### PUT `/api/costing/:id`

```typescript
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Recalculate derived fields
    const payload = { ...body };

    if (payload.fabricPrice !== undefined && payload.fabricConsumption !== undefined) {
      payload.fabricCost = Number(
        (payload.fabricPrice * payload.fabricConsumption).toFixed(2)
      );
    }

    payload.totalCost = Number(
      (
        (payload.fabricCost || 0) +
        (payload.sewingCost || 0) +
        (payload.accessoriesCost || 0) +
        (payload.printBelt || 0) +
        (payload.threadLabelsPollyBags || 0) +
        (payload.fusingElasticButtonZip || 0)
      ).toFixed(2)
    );

    if (payload.sellingPrice !== undefined) {
      payload.grossProfit = Number(
        (payload.sellingPrice - payload.totalCost).toFixed(2)
      );
    }

    if (payload.sellingPrice && payload.sellingPrice > 0) {
      payload.profitPercentage = Number(
        ((payload.grossProfit / payload.sellingPrice) * 100).toFixed(2)
      );
    } else {
      payload.profitPercentage = 0;
    }

    const record = await CostingRecord.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Costing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
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

### DELETE `/api/costing/:id`

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await CostingRecord.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Costing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## 3. Purchasing Descriptions Endpoint: `/api/costing/descriptions/route.ts`

This is the **critical endpoint** that powers the purchasing description dropdown. It queries the `PurchaseRecord` collection for unique descriptions.

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';

export async function GET() {
  try {
    await dbConnect();

    // Get unique descriptions from all purchasing records
    const descriptions: string[] = await PurchaseRecord.distinct('description');

    // Sort alphabetically for better UX
    const sorted = descriptions
      .filter((d) => d && d.trim() !== '')
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      data: sorted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

**Response Shape:**
```json
{
  "success": true,
  "data": [
    "Cotton slab",
    "FABRIC * 100",
    "Fabric for cotton"
  ]
}
```

---

## Important Notes

1. **`params` is a Promise** in Next.js 16 — you must `await params` before accessing `id`. This follows the existing pattern in `src/app/api/purchasing/[id]/route.ts`.

2. **No `populate()` calls** needed for CostingRecord — unlike PurchaseRecord which references Supplier/Category by ObjectId, the CostingRecord stores `description` as a plain string.

3. **Duplicate handling** — the `designNo` field has a unique index; the API returns a `409 Conflict` if a duplicate is attempted.

4. **Calculation sync** — derived fields are calculated both in the API route (for `findByIdAndUpdate` which skips pre-save hooks) and in the Mongoose pre-save hook (for `create` / `save`).

---

> **Next:** [03-sidebar-navigation.md](./03-sidebar-navigation.md)
