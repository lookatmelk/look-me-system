# 02 — API Routes

> **Files to create:**
> - `src/app/api/orders/route.ts` — GET (list) + POST (create)
> - `src/app/api/orders/[id]/route.ts` — GET (single) + PUT (update) + DELETE
> - `src/app/api/orders/designs/route.ts` — GET (available design numbers from CostingRecord)
> - `src/app/api/orders/stats/route.ts` — GET (aggregated stats for the dashboard strip)

---

## 1. List + Create: `/api/orders/route.ts`

### GET `/api/orders`

Fetches all order records with optional query parameters for filtering.

**Query Parameters:**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `search` | string | `"LEGGING"` | Search in designNo, description |
| `status` | string | `"PENDING"` | Exact match on order status |
| `designNo` | string | `"1001"` | Exact match on design number |
| `shop` | string | `"shop1"` | Filter orders that have qty > 0 for a specific shop |
| `minTotal` | number | `100` | Minimum design total |
| `maxTotal` | number | `500` | Maximum design total |
| `minRevenue` | number | `10000` | Minimum projected revenue |
| `maxRevenue` | number | `100000` | Maximum projected revenue |
| `startDate` | string | `"2026-01-01"` | Order date range start (inclusive) |
| `endDate` | string | `"2026-03-31"` | Order date range end (inclusive) |
| `sortBy` | string | `"designTotal"` | Field to sort by |
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
      "costingId": {
        "_id": "663xyz...",
        "designNo": "1001",
        "description": "LEGGING",
        "sellingPrice": 275.00,
        "totalCost": 219.00,
        "profitPercentage": 25.57
      },
      "description": "LEGGING",
      "shop1": { "qty": 360, "sizes": ["M", "L", "XL"] },
      "shop2": { "qty": 120, "sizes": ["L", "XL", "2XL"] },
      "shop3": { "qty": 0, "sizes": [] },
      "designTotal": 480,
      "projectedRevenue": 132000.00,
      "projectedProfit": 26880.00,
      "sellingPrice": 275.00,
      "totalCost": 219.00,
      "profitPercentage": 25.57,
      "orderDate": "2026-03-29T00:00:00.000Z",
      "status": "PENDING",
      "notes": "",
      "createdAt": "2026-03-29T...",
      "updatedAt": "2026-03-29T..."
    }
  ]
}
```

**Implementation Pattern (follows `src/app/api/purchasing/route.ts` and `src/app/api/costing/route.ts`):**

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrderRecord from '@/models/OrderRecord';

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
      ];
    }

    // Exact filters
    const status = searchParams.get('status');
    if (status) query.status = status;

    const designNo = searchParams.get('designNo');
    if (designNo) query.designNo = designNo;

    // Shop filter — orders with qty > 0 for a given shop
    const shop = searchParams.get('shop');
    if (shop === 'shop1') query['shop1.qty'] = { $gt: 0 };
    if (shop === 'shop2') query['shop2.qty'] = { $gt: 0 };
    if (shop === 'shop3') query['shop3.qty'] = { $gt: 0 };

    // Range filters — design total
    const minTotal = searchParams.get('minTotal');
    const maxTotal = searchParams.get('maxTotal');
    if (minTotal || maxTotal) {
      query.designTotal = {};
      if (minTotal) query.designTotal.$gte = Number(minTotal);
      if (maxTotal) query.designTotal.$lte = Number(maxTotal);
    }

    // Range filters — projected revenue
    const minRevenue = searchParams.get('minRevenue');
    const maxRevenue = searchParams.get('maxRevenue');
    if (minRevenue || maxRevenue) {
      query.projectedRevenue = {};
      if (minRevenue) query.projectedRevenue.$gte = Number(minRevenue);
      if (maxRevenue) query.projectedRevenue.$lte = Number(maxRevenue);
    }

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        const d = new Date(`${endDate}T00:00:00.000Z`);
        d.setUTCDate(d.getUTCDate() + 1); // Inclusive end date
        query.orderDate.$lt = d;
      }
    }

    // ─── Sort ───
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // ─── Limit ───
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.floor(Number(limitParam)) : null;

    // ─── Execute query with populate ───
    let recordsQuery = OrderRecord.find(query)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric')
      .sort({ [sortBy]: sortOrder });

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

### POST `/api/orders`

Creates a new order record. Must fetch the CostingRecord to snapshot pricing data.

```typescript
import CostingRecord from '@/models/CostingRecord';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // ─── Validate CostingRecord exists ───
    const costing = await CostingRecord.findById(body.costingId);
    if (!costing) {
      return NextResponse.json(
        { success: false, error: 'Invalid design — costing record not found.' },
        { status: 404 }
      );
    }

    // ─── Build payload with costing snapshot ───
    const payload = {
      ...body,
      designNo: costing.designNo,
      description: costing.description,
      sellingPrice: costing.sellingPrice,
      totalCost: costing.totalCost,
      profitPercentage: costing.profitPercentage,
    };

    // ─── Calculate derived fields ───
    const shop1Qty = payload.shop1?.qty || 0;
    const shop2Qty = payload.shop2?.qty || 0;
    const shop3Qty = payload.shop3?.qty || 0;
    payload.designTotal = shop1Qty + shop2Qty + shop3Qty;
    payload.projectedRevenue = Number((costing.sellingPrice * payload.designTotal).toFixed(2));
    payload.projectedProfit = Number(
      ((costing.sellingPrice - costing.totalCost) * payload.designTotal).toFixed(2)
    );

    // ─── Set default status ───
    if (!payload.status) {
      payload.status = 'PENDING';
    }

    const record = await OrderRecord.create(payload);

    // Return populated doc
    const populatedRecord = await OrderRecord.findById(record._id)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric');

    return NextResponse.json(
      { success: true, data: populatedRecord },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## 2. Single Record CRUD: `/api/orders/[id]/route.ts`

### GET `/api/orders/:id`

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrderRecord from '@/models/OrderRecord';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const record = await OrderRecord.findById(id)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric fabricPrice');

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
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

### PUT `/api/orders/:id`

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

    const shop1Qty = payload.shop1?.qty || 0;
    const shop2Qty = payload.shop2?.qty || 0;
    const shop3Qty = payload.shop3?.qty || 0;
    payload.designTotal = shop1Qty + shop2Qty + shop3Qty;

    // If costing snapshot values are present, recalculate projections
    if (payload.sellingPrice !== undefined) {
      payload.projectedRevenue = Number(
        (payload.sellingPrice * payload.designTotal).toFixed(2)
      );
    }
    if (payload.sellingPrice !== undefined && payload.totalCost !== undefined) {
      payload.projectedProfit = Number(
        ((payload.sellingPrice - payload.totalCost) * payload.designTotal).toFixed(2)
      );
    }

    const record = await OrderRecord.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate('costingId', 'designNo description sellingPrice totalCost profitPercentage size fabric');

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
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

### DELETE `/api/orders/:id`

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await OrderRecord.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
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

## 3. Available Designs Endpoint: `/api/orders/designs/route.ts`

This is the **critical endpoint** that powers the design number dropdown in the order form. It queries the `CostingRecord` collection for all available designs.

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET() {
  try {
    await dbConnect();

    // Get all costing records with essential fields for the dropdown
    const designs = await CostingRecord.find({})
      .select('designNo description sellingPrice totalCost profitPercentage size')
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

**Response Shape:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "663xyz...",
      "designNo": "1001",
      "description": "LEGGING",
      "sellingPrice": 275.00,
      "totalCost": 219.00,
      "profitPercentage": 25.57,
      "size": "S"
    },
    {
      "_id": "663abc...",
      "designNo": "1002",
      "description": "SHORT FROCK",
      "sellingPrice": 750.00,
      "totalCost": 351.50,
      "profitPercentage": 35.99,
      "size": "M"
    }
  ]
}
```

---

## 4. Stats Endpoint: `/api/orders/stats/route.ts`

Provides aggregated statistics for the orders page stats strip.

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrderRecord from '@/models/OrderRecord';

export async function GET() {
  try {
    await dbConnect();

    const stats = await OrderRecord.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalUnits: { $sum: '$designTotal' },
          totalRevenue: { $sum: '$projectedRevenue' },
          totalProfit: { $sum: '$projectedProfit' },
          avgDesignTotal: { $avg: '$designTotal' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
          },
          inProductionOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PRODUCTION'] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalUnits: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgDesignTotal: 0,
      pendingOrders: 0,
      inProductionOrders: 0,
      deliveredOrders: 0,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## Important Notes

1. **`params` is a Promise** in Next.js 16 — you must `await params` before accessing `id`. This follows the existing pattern in `src/app/api/purchasing/[id]/route.ts` and `src/app/api/costing/[id]/route.ts`.

2. **`populate()` is used** for the `costingId` field — unlike CostingRecord which stores `description` as a plain string, OrderRecord references CostingRecord by ObjectId.

3. **Costing snapshot** — the POST endpoint snapshots `sellingPrice`, `totalCost`, and `profitPercentage` from the CostingRecord at creation time. This preserves historical pricing even if the costing record is updated later.

4. **Calculation sync** — derived fields (`designTotal`, `projectedRevenue`, `projectedProfit`) are calculated both in the API route (for `findByIdAndUpdate` which skips pre-save hooks) and in the Mongoose pre-save hook (for `create` / `save`).

5. **Date range filtering** follows the purchasing module pattern — `startDate` inclusive, `endDate` inclusive (by adding +1 day and using `$lt`).

6. **Shop filter** uses dot notation (`shop1.qty`, `shop2.qty`, `shop3.qty`) to query nested sub-documents.

---

> **Next:** [03-sidebar-navigation.md](./03-sidebar-navigation.md)
