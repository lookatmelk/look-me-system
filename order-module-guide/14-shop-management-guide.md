# Shop Management Guide (Dynamic — Unlimited Shops)

> **Module:** Shop Management  
> **Status:** Implementation Guide (Documentation Only)  
> **Relations:** Orders Module ↔ Shop Management  
> **Project:** LOOK@ME Garment Management System  
> **Key Requirement:** Users can create **unlimited shops** and allocate orders to **any number** of them.

---

## Table of Contents

| Section | Topic |
|---------|-------|
| [1. Overview](#1-overview) | Architecture, dynamic shop concept |
| [2. Shop Data Model](#2-shop-data-model) | Shop Mongoose schema (CRUD for unlimited shops) |
| [3. OrderRecord Migration](#3-orderrecord-migration) | Replace `shop1`/`shop2`/`shop3` with dynamic `shopAllocations[]` |
| [4. Shop API Routes](#4-shop-api-routes) | Full CRUD: Create, Read, Update, Delete shops |
| [5. Order API Changes](#5-order-api-changes) | Updated order routes for dynamic shop allocations |
| [6. Sidebar Navigation](#6-sidebar-navigation) | Dynamic shop links from database |
| [7. Shop Management Page](#7-shop-management-page) | Admin page to manage all shops (unlimited CRUD) |
| [8. Shop Form (Add/Edit)](#8-shop-form) | Drawer form to add/edit shops |
| [9. Individual Shop Page](#9-individual-shop-page) | Per-shop order view with stats |
| [10. Order Form Changes](#10-order-form-changes) | Dynamic shop selection + allocation in order form |
| [11. Order Page & Detail Modal Changes](#11-order-page-changes) | Dynamic columns and modal sections |
| [12. Validation](#12-validation) | Zod + API + Mongoose for shops and orders |
| [13. Design Theme](#13-design-theme) | Colors, styling |
| [14. File Structure](#14-file-structure) | All files to create/modify |
| [15. Testing](#15-testing) | Unit, API, E2E tests |

---

## 1. Overview

### Core Concept

Shops are **fully dynamic entities** managed via CRUD. There is **no limit** to the number of shops. When creating an order, the user can select **any number** of active shops to allocate quantities and sizes to.

### Current State (Hardcoded — TO BE REPLACED)

```typescript
// OrderRecord.ts — CURRENT (hardcoded, limited to 3)
shop1: { type: ShopAllocationSchema }  // Fixed to exactly 3 shops
shop2: { type: ShopAllocationSchema }
shop3: { type: ShopAllocationSchema }
```

### Target State (Dynamic — Unlimited)

```typescript
// OrderRecord.ts — NEW (dynamic, unlimited shops)
shopAllocations: [
  { shopId: ObjectId, shopName: String, qty: Number, sizes: [String] },
  { shopId: ObjectId, shopName: String, qty: Number, sizes: [String] },
  // ... any number of shops
]
```

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                          LOOK@ME System                        │
├──────────────────┬────────────────────────────────────────────┤
│                  │                                            │
│   SHOP MODEL     │   ORDER RECORD (refactored)                │
│   (unlimited)    │                                            │
│                  │   shopAllocations: [                        │
│  ┌─ Shop A ──┐   │     { shopId → Shop A, qty: 360, sizes }   │
│  ├─ Shop B ──┫   │     { shopId → Shop B, qty: 120, sizes }   │
│  ├─ Shop C ──┫   │     { shopId → Shop D, qty: 200, sizes }   │
│  ├─ Shop D ──┫   │   ]                                        │
│  ├─ Shop E ──┤   │                                            │
│  └─ Shop ... ┘   │   designTotal = sum of all shopAlloc qtys   │
│                  │                                            │
└──────────────────┴────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Shops are a separate MongoDB collection | Full CRUD, each shop has metadata (name, location, manager, etc.) |
| `shopAllocations` is an array of sub-documents | Supports any number of shops per order |
| Each allocation stores `shopName` (denormalized) | Quick display without `populate()` for every query |
| Each allocation references `shopId` (ObjectId) | Enables `populate()` for full shop details when needed |
| `designTotal` = sum of all `shopAllocations[].qty` | Auto-calculated, just like before |
| Old `shop1`/`shop2`/`shop3` fields are **removed** | Clean break — migration script converts existing data |

---

## 2. Shop Data Model

### File: `src/models/Shop.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
  name: string;               // e.g. "LOOK@ME Kandy", "LOOK@ME Colombo"
  slug: string;               // URL-friendly: "look-me-kandy"
  location: string;           // e.g. "No. 42, Kandy Rd, Kandy"
  manager: string;            // e.g. "Samantha Perera"
  phone: string;              // e.g. "+94 77 123 4567"
  email: string;              // e.g. "kandy@lookatme.lk"
  color: string;              // UI accent: "blue", "violet", "emerald", etc.
  status: string;             // "ACTIVE" | "INACTIVE"
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      unique: true,
      maxLength: [100, 'Shop name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    location: {
      type: String,
      trim: true,
      maxLength: [200, 'Location cannot exceed 200 characters'],
      default: '',
    },
    manager: {
      type: String,
      trim: true,
      maxLength: [100, 'Manager name cannot exceed 100 characters'],
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxLength: [20, 'Phone number cannot exceed 20 characters'],
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    color: {
      type: String,
      required: true,
      enum: {
        values: [
          'blue', 'violet', 'emerald', 'amber', 'rose', 'cyan',
          'indigo', 'teal', 'orange', 'pink', 'lime', 'sky',
        ],
        message: '{VALUE} is not a valid color',
      },
      default: 'blue',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a valid status',
      },
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

// Indexes
ShopSchema.index({ slug: 1 }, { unique: true });
ShopSchema.index({ status: 1 });
ShopSchema.index({ name: 1 });

// Auto-generate slug from name (pre-validate)
ShopSchema.pre<IShop>('validate', function () {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

delete mongoose.models.Shop;

export default mongoose.models.Shop ||
  mongoose.model<IShop>('Shop', ShopSchema);
```

---

## 3. OrderRecord Migration

### Updated Interface

```typescript
export interface IShopAllocation {
  shopId: mongoose.Types.ObjectId;   // Reference to Shop document
  shopName: string;                   // Denormalized for quick display
  qty: number;                        // Quantity allocated to this shop
  sizes: string[];                    // Sizes allocated, e.g. ["M", "L", "XL"]
}

export interface IOrderRecord extends Document {
  designNo: string;
  costingId: mongoose.Types.ObjectId;
  description: string;

  // ─── CHANGED: Dynamic shop allocations (replaces shop1/shop2/shop3) ───
  shopAllocations: IShopAllocation[];

  // ─── Auto-Calculated (unchanged logic, different source) ───
  designTotal: number;            // sum of all shopAllocations[].qty
  projectedRevenue: number;
  projectedProfit: number;

  // ─── Costing Snapshot (unchanged) ───
  sellingPrice: number;
  totalCost: number;
  profitPercentage: number;

  // ─── Meta (unchanged) ───
  orderDate: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Updated Schema

```typescript
const ShopAllocationSchema: Schema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop reference is required'],
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    sizes: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          const validSizes = [
            'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'FREE',
            'FREE SIZE', 'FREE SIZE (1 INCH SHORT)',
            '28', '30', '32', '34', '36', '38', '40',
          ];
          return v.every(size => validSizes.includes(size.toUpperCase()));
        },
        message: 'Invalid size value found',
      },
    },
  },
  { _id: false }
);

const OrderRecordSchema: Schema = new Schema(
  {
    designNo: {
      type: String,
      required: [true, 'Design number is required'],
      trim: true,
    },
    costingId: {
      type: Schema.Types.ObjectId,
      ref: 'CostingRecord',
      required: [true, 'Costing reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    // ─── DYNAMIC SHOP ALLOCATIONS ───
    shopAllocations: {
      type: [ShopAllocationSchema],
      default: [],
      validate: {
        validator: function (v: any[]) {
          // At least one allocation with qty > 0
          return v.some(alloc => alloc.qty > 0);
        },
        message: 'At least one shop must have a quantity greater than 0',
      },
    },

    // Auto-calculated
    designTotal: { type: Number, required: true, default: 0, min: 0 },
    projectedRevenue: { type: Number, required: true, default: 0 },
    projectedProfit: { type: Number, required: true, default: 0 },

    // Costing snapshot
    sellingPrice: { type: Number, required: true, default: 0, min: 0 },
    totalCost: { type: Number, required: true, default: 0, min: 0 },
    profitPercentage: { type: Number, required: true, default: 0 },

    // Order meta
    orderDate: { type: Date, required: [true, 'Order date is required'], default: Date.now },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'PENDING',
    },
    notes: { type: String, trim: true, maxLength: [500, 'Notes cannot exceed 500 characters'] },
  },
  { timestamps: true }
);

// ─── Indexes ───
OrderRecordSchema.index({ designNo: 1 });
OrderRecordSchema.index({ costingId: 1 });
OrderRecordSchema.index({ status: 1 });
OrderRecordSchema.index({ orderDate: -1 });
OrderRecordSchema.index({ 'shopAllocations.shopId': 1 });    // Query orders by shop

// ─── Pre-Save Hook ───
OrderRecordSchema.pre<IOrderRecord>('save', function () {
  // designTotal = sum of all shop allocation quantities
  this.designTotal = this.shopAllocations.reduce(
    (sum, alloc) => sum + (alloc.qty || 0), 0
  );

  if (this.sellingPrice !== undefined) {
    this.projectedRevenue = Number((this.sellingPrice * this.designTotal).toFixed(2));
  }

  if (this.sellingPrice !== undefined && this.totalCost !== undefined) {
    this.projectedProfit = Number(
      ((this.sellingPrice - this.totalCost) * this.designTotal).toFixed(2)
    );
  }
});
```

### Migration Script

For existing orders with `shop1`/`shop2`/`shop3`, run a one-time migration:

**File:** `scripts/migrate-orders-to-dynamic-shops.ts`

```typescript
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

async function migrate() {
  await dbConnect();
  const db = mongoose.connection.db;
  const ordersCol = db.collection('orderrecords');
  const shopsCol = db.collection('shops');

  // 1. Ensure shops exist
  const existingShops = await shopsCol.find({}).toArray();
  let shopMap: Record<string, { _id: any; name: string }> = {};

  if (existingShops.length === 0) {
    // Create default shops
    const defaults = [
      { name: 'Shop 1', slug: 'shop-1', color: 'blue', status: 'ACTIVE', location: '', manager: '', phone: '', email: '' },
      { name: 'Shop 2', slug: 'shop-2', color: 'violet', status: 'ACTIVE', location: '', manager: '', phone: '', email: '' },
      { name: 'Shop 3', slug: 'shop-3', color: 'emerald', status: 'ACTIVE', location: '', manager: '', phone: '', email: '' },
    ];
    const result = await shopsCol.insertMany(defaults);
    defaults.forEach((d, i) => {
      shopMap[`shop${i + 1}`] = { _id: result.insertedIds[i], name: d.name };
    });
  } else {
    // Match by name pattern
    existingShops.forEach(s => {
      if (s.name === 'Shop 1') shopMap['shop1'] = { _id: s._id, name: s.name };
      if (s.name === 'Shop 2') shopMap['shop2'] = { _id: s._id, name: s.name };
      if (s.name === 'Shop 3') shopMap['shop3'] = { _id: s._id, name: s.name };
    });
  }

  // 2. Migrate each order
  const orders = await ordersCol.find({ shop1: { $exists: true } }).toArray();
  console.log(`Migrating ${orders.length} orders...`);

  for (const order of orders) {
    const shopAllocations: any[] = [];

    for (const key of ['shop1', 'shop2', 'shop3'] as const) {
      const shopData = order[key];
      if (shopData && shopData.qty > 0 && shopMap[key]) {
        shopAllocations.push({
          shopId: shopMap[key]._id,
          shopName: shopMap[key].name,
          qty: shopData.qty,
          sizes: shopData.sizes || [],
        });
      }
    }

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set: { shopAllocations },
        $unset: { shop1: '', shop2: '', shop3: '' },
      }
    );
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
```

**Run with:** `npx ts-node scripts/migrate-orders-to-dynamic-shops.ts`

---

## 4. Shop API Routes

### 4.1 `src/app/api/shops/route.ts` — List + Create

#### GET `/api/shops`

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shop from '@/models/Shop';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { location: regex }, { manager: regex }];
    }

    const shops = await Shop.find(query).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: shops });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

#### POST `/api/shops` — Create New Shop

```typescript
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Auto-generate slug from name
    if (body.name && !body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const shop = await Shop.create(body);
    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error: any) {
    // Handle duplicate name
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A shop with this name already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

### 4.2 `src/app/api/shops/[id]/route.ts` — Get, Update, Delete

```typescript
// GET — single shop
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await Shop.findById(id);
  if (!shop) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: shop });
}

// PUT — update shop
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // Re-generate slug if name changed
  if (body.name) {
    body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  const shop = await Shop.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!shop) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: shop });
}

// DELETE — delete shop (only if no orders reference it)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if any orders reference this shop
  const orderCount = await OrderRecord.countDocuments({
    'shopAllocations.shopId': id,
  });

  if (orderCount > 0) {
    return NextResponse.json({
      success: false,
      error: `Cannot delete shop — ${orderCount} order(s) are allocated to it. Deactivate instead.`,
    }, { status: 409 });
  }

  const deleted = await Shop.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: {} });
}
```

### 4.3 `src/app/api/shops/[id]/orders/route.ts` — Orders for a Specific Shop

```typescript
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  const shop = await Shop.findById(id);
  if (!shop) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Query orders that have an allocation for this shop with qty > 0
  const query: any = {
    'shopAllocations': {
      $elemMatch: {
        shopId: new mongoose.Types.ObjectId(id),
        qty: { $gt: 0 },
      },
    },
  };

  if (status) query.status = status;
  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) {
      const d = new Date(`${endDate}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      query.orderDate.$lt = d;
    }
  }

  const orders = await OrderRecord.find(query)
    .populate('costingId', 'designNo description sellingPrice totalCost')
    .sort({ orderDate: -1 });

  // Calculate shop-specific stats
  const stats = orders.reduce(
    (acc, order) => {
      // Find this shop's allocation in the order
      const alloc = order.shopAllocations.find(
        (a: any) => a.shopId.toString() === id
      );
      if (alloc) {
        acc.totalQty += alloc.qty;
        acc.totalRevenue += alloc.qty * (order.sellingPrice || 0);
        acc.totalProfit += alloc.qty * ((order.sellingPrice || 0) - (order.totalCost || 0));
      }
      return acc;
    },
    { totalOrders: orders.length, totalQty: 0, totalRevenue: 0, totalProfit: 0 }
  );

  return NextResponse.json({
    success: true,
    data: { shop, orders, stats },
  });
}
```

---

## 5. Order API Changes

### Updated POST `/api/orders`

```typescript
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate costing record
    const costing = await CostingRecord.findById(body.costingId);
    if (!costing) {
      return NextResponse.json({ success: false, error: 'Design not found.' }, { status: 404 });
    }

    // Validate shop allocations
    if (!body.shopAllocations || !Array.isArray(body.shopAllocations) || body.shopAllocations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one shop allocation is required.',
      }, { status: 400 });
    }

    const totalQty = body.shopAllocations.reduce((sum: number, a: any) => sum + (a.qty || 0), 0);
    if (totalQty <= 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one shop must have a quantity greater than 0.',
      }, { status: 400 });
    }

    // Validate each allocation's shopId exists
    for (const alloc of body.shopAllocations) {
      if (alloc.qty > 0) {
        const shop = await Shop.findById(alloc.shopId);
        if (!shop) {
          return NextResponse.json({
            success: false,
            error: `Shop not found: ${alloc.shopId}`,
          }, { status: 404 });
        }
        // Denormalize shop name
        alloc.shopName = shop.name;

        // Validate sizes
        if (!alloc.sizes || alloc.sizes.length === 0) {
          return NextResponse.json({
            success: false,
            error: `${shop.name} has a quantity but no sizes selected.`,
          }, { status: 400 });
        }
      }
    }

    // Filter out zero-qty allocations
    const filteredAllocations = body.shopAllocations.filter((a: any) => a.qty > 0);

    const payload = {
      ...body,
      shopAllocations: filteredAllocations,
      designNo: costing.designNo,
      description: costing.description,
      sellingPrice: costing.sellingPrice,
      totalCost: costing.totalCost,
      profitPercentage: costing.profitPercentage,
      designTotal: filteredAllocations.reduce((s: number, a: any) => s + (a.qty || 0), 0),
    };

    payload.projectedRevenue = Number((costing.sellingPrice * payload.designTotal).toFixed(2));
    payload.projectedProfit = Number(
      ((costing.sellingPrice - costing.totalCost) * payload.designTotal).toFixed(2)
    );

    if (!payload.status) payload.status = 'PENDING';

    const record = await OrderRecord.create(payload);
    const populated = await OrderRecord.findById(record._id)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage')
      .populate('shopAllocations.shopId', 'name slug color');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

### Updated GET `/api/orders`

Add a `shopId` query parameter to filter orders by a specific shop:

```typescript
// New filter parameter
const shopId = searchParams.get('shopId');
if (shopId) {
  query['shopAllocations'] = {
    $elemMatch: {
      shopId: new mongoose.Types.ObjectId(shopId),
      qty: { $gt: 0 },
    },
  };
}
```

---

## 6. Sidebar Navigation

### Dynamic Shop Loading

```typescript
// In Sidebar.tsx
const [shops, setShops] = useState<any[]>([]);

useEffect(() => {
  const fetchShops = async () => {
    try {
      const res = await fetch('/api/shops?status=ACTIVE');
      const data = await res.json();
      if (data.success) setShops(data.data);
    } catch {}
  };
  fetchShops();
}, []);
```

### Remove from `inactiveTabs`

```diff
 const inactiveTabs = [
-  { name: "Shop 1", icon: Store },
-  { name: "Shop 2", icon: Store },
-  { name: "Shop 3", icon: Store },
   { name: "Summary", icon: BarChart3 },
 ];
```

### Add Expandable Shops Section

Place between "Orders" and "Coming Soon". Uses the **same pattern as Purchasing** with expandable sub-nav:

```tsx
{/* ── SHOPS SECTION ── */}
{/* Parent: "Shops" link → /admin/shops (management page) */}
{/* Children: Each active shop → /admin/shops/{slug} (individual view) */}

<div className="space-y-1">
  <Link href="/admin/shops" /* ... same styling as Purchasing parent ... */ >
    <Store /> Shops
    <ChevronDown /* toggle expand */ />
  </Link>

  {!collapsed && isShopsExpanded && (
    <div className="ml-5 pl-3 border-l border-white/10 space-y-1.5 animate-fade-in">
      {shops.map(shop => (
        <Link key={shop._id} href={`/admin/shops/${shop.slug}`}>
          <Store /> {shop.name}
        </Link>
      ))}
    </div>
  )}
</div>
```

### Expected Sidebar (Example with 5 shops)

```
╔══════════════════════════════╗
║  NAVIGATION                  ║
║  🏠 Dashboard                ║
║  🛒 Purchasing            ▼  ║
║     ├── Category              ║
║     └── Supplier              ║
║  💰 Costing                  ║
║  📄 Orders                   ║
║  🏪 Shops                 ▼  ║
║     ├── LOOK@ME Kandy         ║
║     ├── LOOK@ME Colombo       ║
║     ├── LOOK@ME Galle         ║
║     ├── LOOK@ME Matara        ║
║     └── LOOK@ME Negombo       ║
║                              ║
║  COMING SOON                 ║
║  🔒 Summary                  ║
╚══════════════════════════════╝
```

---

## 7. Shop Management Page

### Route: `/admin/shops/page.tsx`

Card-grid with **"Add Shop" button** at the top. Each shop is a card.

```
┌──────────────────────────────────────────────────────────────┐
│  Shops                                   [ + Add Shop ]      │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│  │ 🏪 LOOK@ME    │ │ 🏪 LOOK@ME    │ │ 🏪 LOOK@ME    │      │
│  │    Kandy       │ │    Colombo    │ │    Galle       │      │
│  │ 📍 Peradeniya  │ │ 📍 Fort       │ │ 📍 Light St    │      │
│  │ 👤 Samantha P. │ │ 👤 Kumara S.  │ │ 👤 Nimal K.    │      │
│  │ 📞 077 123...  │ │ 📞 077 234... │ │ 📞 077 345...  │      │
│  │ ● ACTIVE       │ │ ● ACTIVE      │ │ ● ACTIVE       │      │
│  │ [Edit] [View]  │ │ [Edit] [View] │ │ [Edit] [View]  │      │
│  └───────────────┘ └───────────────┘ └───────────────┘      │
│  ┌───────────────┐ ┌───────────────┐                        │
│  │ 🏪 LOOK@ME    │ │ + Add Shop    │                        │
│  │    Matara      │ │ (dashed card) │                        │
│  │ ...            │ │               │                        │
│  └───────────────┘ └───────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

### "Add Shop" Card (Empty State Placeholder)

```tsx
{/* Add Shop Card — always shown at the end */}
<button
  onClick={() => setDrawerOpen({ open: true, shop: null })}
  className="rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50/30 transition-all min-h-[200px] cursor-pointer group"
>
  <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:border-green-400">
    <Plus className="h-6 w-6" />
  </div>
  <span className="font-semibold text-sm">Add New Shop</span>
</button>
```

### Delete Protection

When deleting a shop, check if any orders reference it:

```typescript
const handleDelete = async (shopId: string, shopName: string) => {
  try {
    const res = await axios.delete(`/api/shops/${shopId}`);
    if (res.data.success) {
      showToast('success', `${shopName} deleted successfully`);
      fetchShops();
    }
  } catch (err: any) {
    // API returns 409 if orders exist
    showToast('error', err.response?.data?.error || 'Failed to delete shop');
  }
};
```

---

## 8. Shop Form (Add / Edit)

### File: `src/components/shops/ShopDrawer.tsx`

Drawer form (same pattern as `CategoryDrawer.tsx`), used for **both creating and editing** shops.

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | text | ✅ | Unique, max 100. Slug auto-generated. |
| Location | text | ❌ | Address, max 200 |
| Manager | text | ❌ | Manager name |
| Phone | text | ❌ | Contact number |
| Email | email | ❌ | Contact email |
| Color | select/chips | ✅ | Visual accent color for UI |
| Status | toggle | ✅ | ACTIVE / INACTIVE |

### Zod Schema

```typescript
const shopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100),
  location: z.string().max(200).optional().or(z.literal('')),
  manager: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  color: z.enum(['blue','violet','emerald','amber','rose','cyan','indigo','teal','orange','pink','lime','sky']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
```

### Color Picker (Chip-Based)

```tsx
const COLORS = [
  { name: 'blue', bg: 'bg-blue-500' },
  { name: 'violet', bg: 'bg-violet-500' },
  { name: 'emerald', bg: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500' },
  { name: 'rose', bg: 'bg-rose-500' },
  { name: 'cyan', bg: 'bg-cyan-500' },
  { name: 'indigo', bg: 'bg-indigo-500' },
  { name: 'teal', bg: 'bg-teal-500' },
  { name: 'orange', bg: 'bg-orange-500' },
  { name: 'pink', bg: 'bg-pink-500' },
  { name: 'lime', bg: 'bg-lime-500' },
  { name: 'sky', bg: 'bg-sky-500' },
];

{/* Color chips */}
<div className="flex flex-wrap gap-2">
  {COLORS.map(c => (
    <button
      key={c.name}
      type="button"
      onClick={() => setValue('color', c.name)}
      className={clsx(
        'h-8 w-8 rounded-full transition-all',
        c.bg,
        selectedColor === c.name
          ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
          : 'opacity-60 hover:opacity-100 hover:scale-105'
      )}
    />
  ))}
</div>
```

---

## 9. Individual Shop Page

### Route: `/admin/shops/[slug]/page.tsx`

Shows all orders allocated to this specific shop with shop-specific statistics.

### Data Fetching

```typescript
// 1. Find shop by slug
const shopsRes = await axios.get('/api/shops');
const shop = shopsRes.data.data.find((s: any) => s.slug === slug);

// 2. Fetch orders for this shop
const ordersRes = await axios.get(`/api/shops/${shop._id}/orders`);
const { orders, stats } = ordersRes.data.data;
```

### Table Columns (Shop-Specific)

| Column | Source | Notes |
|--------|--------|-------|
| Design No | `order.designNo` | |
| Description | `order.description` | |
| **This Shop's Qty** | `order.shopAllocations.find(a => a.shopId === shopId).qty` | Highlighted |
| **This Shop's Sizes** | Same `.sizes` | Chip badges |
| **Shop Revenue** | `qty × sellingPrice` | Calculated per-row |
| Design Total | `order.designTotal` | All shops combined |
| Order Date | `order.orderDate` | |
| Status | `order.status` | Badge |

### Stats Cards (Shop-Specific)

```typescript
// stats from the API response
{ label: 'Orders', value: stats.totalOrders }
{ label: 'Units (this shop)', value: stats.totalQty }
{ label: 'Shop Revenue', value: `LKR ${stats.totalRevenue.toLocaleString()}` }
{ label: 'Shop Profit', value: `LKR ${stats.totalProfit.toLocaleString()}` }
```

---

## 10. Order Form Changes

### File: `src/components/orders/OrderForm.tsx`

The biggest change: Step 2 (Shop Allocations) is now **fully dynamic**.

### Fetching Active Shops

```typescript
const [activeShops, setActiveShops] = useState<any[]>([]);

useEffect(() => {
  const fetchShops = async () => {
    try {
      const res = await axios.get('/api/shops?status=ACTIVE');
      if (res.data.success) setActiveShops(res.data.data);
    } catch {}
  };
  fetchShops();
}, []);
```

### Dynamic Shop Allocations State

Instead of hardcoded `shop1`/`shop2`/`shop3` in the zod schema:

```typescript
const orderSchema = z.object({
  costingId: z.string().min(1, 'Please select a design'),
  orderDate: z.string().min(1, 'Order date is required'),
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  shopAllocations: z.array(z.object({
    shopId: z.string().min(1),
    shopName: z.string(),
    qty: z.number().int().min(0).max(99999),
    sizes: z.array(z.string()).default([]),
  })),
  notes: z.string().max(500).optional().or(z.literal('')),
}).refine(
  (data) => {
    const total = data.shopAllocations.reduce((s, a) => s + (a.qty || 0), 0);
    return total > 0;
  },
  { message: 'At least one shop must have a quantity greater than 0', path: ['shopAllocations'] }
).refine(
  (data) => {
    return data.shopAllocations.every(a => a.qty === 0 || a.sizes.length > 0);
  },
  { message: 'Shops with quantity must have at least one size selected', path: ['shopAllocations'] }
);
```

### Initializing Shop Allocations from Active Shops

```typescript
// When active shops are loaded, initialize the form with empty allocations for each
useEffect(() => {
  if (activeShops.length > 0 && !initialData) {
    const emptyAllocations = activeShops.map(shop => ({
      shopId: shop._id,
      shopName: shop.name,
      qty: 0,
      sizes: [],
    }));
    setValue('shopAllocations', emptyAllocations);
  }
}, [activeShops]);
```

### Step 2: Dynamic Shop Sections

```tsx
{step === 2 && (
  <div className="space-y-5">
    {activeShops.map((shop, index) => {
      const allocation = watch(`shopAllocations.${index}`);
      return (
        <ShopAllocationSection
          key={shop._id}
          shopName={shop.name}
          shopColor={shop.color}
          index={index}
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />
      );
    })}

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

### Updated ShopAllocationSection

```tsx
function ShopAllocationSection({
  shopName,
  shopColor,
  index,           // Index in the shopAllocations array
  register,
  watch,
  setValue,
  errors,
}: {
  shopName: string;
  shopColor: string;
  index: number;
  register: any;
  watch: any;
  setValue: any;
  errors: any;
}) {
  const currentSizes: string[] = watch(`shopAllocations.${index}.sizes`) || [];
  const currentQty = watch(`shopAllocations.${index}.qty`) || 0;

  const toggleSize = (size: string) => {
    const updated = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    setValue(`shopAllocations.${index}.sizes`, updated);
  };

  // ... same chip-based UI as before, but using `shopAllocations.${index}.qty`
  // and `shopAllocations.${index}.sizes` instead of `shop1.qty` etc.
}
```

### Live Calculation

```typescript
const allocations = watch('shopAllocations') || [];
const designTotalCalc = allocations.reduce(
  (sum: number, a: any) => sum + (Number(a?.qty) || 0), 0
);
```

---

## 11. Order Page & Detail Modal Changes

### Orders Page Table

Replace the 3 hardcoded shop columns with a **single "Shops" column** showing a summarized view:

```tsx
// Instead of separate Shop 1, Shop 2, Shop 3 columns:
columnHelper.accessor('shopAllocations', {
  header: () => <span className="...">Shops</span>,
  cell: info => {
    const allocations = info.getValue() || [];
    const activeAllocs = allocations.filter((a: any) => a.qty > 0);
    if (activeAllocs.length === 0) return <span className="text-slate-300">—</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {activeAllocs.map((a: any) => (
          <span key={a.shopId} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {a.shopName}: {a.qty}
          </span>
        ))}
      </div>
    );
  },
}),
```

### Detail Modal

Replace hardcoded ShopRow sections with dynamic mapping:

```tsx
{/* Shop Allocations */}
<div className="px-6 py-5 border-b border-slate-100">
  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shop Allocations</p>
  <div className="space-y-3">
    {record.shopAllocations
      .filter((a: any) => a.qty > 0)
      .map((alloc: any) => (
        <ShopRow
          key={alloc.shopId}
          shopName={alloc.shopName}
          shopColor={/* fetch from shop or use fallback */ 'blue'}
          qty={alloc.qty}
          sizes={alloc.sizes}
          sellingPrice={record.sellingPrice}
        />
      ))
    }
  </div>
</div>
```

### Filter Drawer — Shop Filter

Replace the hardcoded shop1/shop2/shop3 options with dynamic shops:

```tsx
{/* Shop Filter */}
<select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
  <option value="">All Shops</option>
  {allShops.map(shop => (
    <option key={shop._id} value={shop._id}>
      {shop.name} (has orders)
    </option>
  ))}
</select>
```

API maps: `?shopId=<ObjectId>` instead of `?shop=shop1`.

---

## 12. Validation

### Shop Validation Matrix

| Field | Client (Zod) | API | Mongoose |
|:---:|:---:|:---:|:---:|
| name required | ✅ | ✅ | ✅ |
| name unique | ❌ | ✅ (409) | ✅ |
| name max 100 | ✅ | ✅ | ✅ |
| slug auto-generated | ❌ | ✅ | ✅ |
| color enum | ✅ | ✅ | ✅ |
| status enum | ✅ | ✅ | ✅ |

### Order shopAllocations Validation

| Rule | Client (Zod) | API | Mongoose |
|:---:|:---:|:---:|:---:|
| Array not empty | ✅ | ✅ | ✅ |
| At least 1 qty > 0 | ✅ | ✅ | ✅ |
| shopId exists in DB | ❌ | ✅ | ❌ |
| Sizes required if qty > 0 | ✅ | ✅ | ❌ |
| Valid size values | ❌ | ❌ | ✅ |

---

## 13. Design Theme

### Color System (12 colors available)

| Color | `bg-{}-50` | `text-{}-700` | `bg-{}-500` | Usage |
|-------|:---:|:---:|:---:|-------|
| `blue` | Light bg | Text | Dot/ring | Default |
| `violet` | | | | |
| `emerald` | | | | |
| `amber` | | | | |
| `rose` | | | | |
| `cyan` | | | | |
| `indigo` | | | | |
| `teal` | | | | |
| `orange` | | | | |
| `pink` | | | | |
| `lime` | | | | |
| `sky` | | | | |

### Component Color Lookup Helper

```typescript
const getShopColors = (color: string) => ({
  bg: `bg-${color}-50`,
  text: `text-${color}-700`,
  border: `border-${color}-200`,
  dot: `bg-${color}-500`,
  chipActive: `bg-${color}-600 text-white border-${color}-600`,
  sectionBorder: `border-${color}-200 bg-${color}-50/50`,
});
```

---

## 14. File Structure

### New Files (9)

```
src/
├── models/
│   └── Shop.ts                                      [NEW]
├── app/
│   ├── api/shops/
│   │   ├── route.ts                                 [NEW] GET + POST
│   │   └── [id]/
│   │       ├── route.ts                             [NEW] GET + PUT + DELETE
│   │       └── orders/
│   │           └── route.ts                         [NEW] GET shop orders
│   └── admin/shops/
│       ├── page.tsx                                 [NEW] Management page
│       └── [slug]/
│           └── page.tsx                             [NEW] Individual shop view
├── components/shops/
│   └── ShopDrawer.tsx                               [NEW] Add/Edit drawer
scripts/
└── migrate-orders-to-dynamic-shops.ts               [NEW] One-time migration
```

### Modified Files (6)

```
src/
├── models/
│   └── OrderRecord.ts                               [MODIFY] shop1/2/3 → shopAllocations[]
├── app/api/orders/
│   └── route.ts                                     [MODIFY] shopAllocations in POST/GET
├── components/
│   ├── Sidebar.tsx                                  [MODIFY] Dynamic shops section
│   ├── TopHeader.tsx                                [MODIFY] Add "shops" to crumbMap
│   └── orders/
│       ├── OrderForm.tsx                            [MODIFY] Dynamic shop sections
│       └── OrderDetailModal.tsx                     [MODIFY] Dynamic shop rows
├── app/admin/orders/
│   └── page.tsx                                     [MODIFY] Dynamic shop columns + filter
```

### Implementation Order

1. `src/models/Shop.ts` — Shop model
2. `src/app/api/shops/route.ts` — Shop CRUD API
3. `src/app/api/shops/[id]/route.ts` — Single shop API
4. `src/models/OrderRecord.ts` — **Refactor to `shopAllocations[]`**
5. `scripts/migrate-orders-to-dynamic-shops.ts` — Run migration
6. `src/app/api/orders/route.ts` — Update order API
7. `src/app/api/shops/[id]/orders/route.ts` — Shop orders API
8. `src/components/shops/ShopDrawer.tsx` — Shop form drawer
9. `src/app/admin/shops/page.tsx` — Shop management page
10. `src/app/admin/shops/[slug]/page.tsx` — Individual shop page
11. `src/components/orders/OrderForm.tsx` — Dynamic shop allocations
12. `src/components/orders/OrderDetailModal.tsx` — Dynamic shop display
13. `src/app/admin/orders/page.tsx` — Updated table + filters
14. `src/components/Sidebar.tsx` — Dynamic sidebar
15. `src/components/TopHeader.tsx` — Breadcrumb entry

---

## 15. Testing

### Shop Model Tests

```typescript
test('should create a shop with valid data');
test('should reject duplicate shop names');
test('should auto-generate slug from name');
test('should reject invalid colors');
test('should default status to ACTIVE');
test('should enforce name max length');
```

### Shop API Tests

```typescript
test('GET /api/shops returns all shops');
test('POST /api/shops creates a new shop');
test('POST /api/shops rejects duplicate names (409)');
test('PUT /api/shops/:id updates shop metadata');
test('DELETE /api/shops/:id deletes shop with no orders');
test('DELETE /api/shops/:id rejects deletion when orders exist (409)');
test('GET /api/shops/:id/orders returns shop-specific orders and stats');
```

### Updated Order Tests

```typescript
test('POST /api/orders with shopAllocations creates order');
test('POST /api/orders rejects empty shopAllocations');
test('POST /api/orders rejects all-zero quantities');
test('POST /api/orders rejects shop with qty but no sizes');
test('POST /api/orders validates shopId exists');
test('POST /api/orders denormalizes shopName');
test('designTotal equals sum of all allocation quantities');
```

### E2E Tests

```typescript
test('should navigate to shops management page');
test('should show shop cards for each shop');
test('should open Add Shop drawer');
test('should create a new shop');
test('should edit existing shop name');
test('should navigate to individual shop page');
test('should show shop-specific order stats');
test('should prevent deleting shop with orders');
test('sidebar shows dynamic shop sub-navigation');
test('order form shows all active shops in Step 2');
test('order form hides inactive shops');
test('order form calculates total across all shops');
```

---

## Summary of Changes from Previous Guide

| Aspect | Previous (v1) | Current (v2) |
|--------|:---:|:---:|
| Max shops | 3 (hardcoded) | **Unlimited** |
| OrderRecord schema | `shop1`, `shop2`, `shop3` fields | **`shopAllocations[]` array** |
| Shop creation | Not possible | **Full CRUD** |
| Shop deletion | N/A | Protected (can't delete if orders exist) |
| Migration needed | No | **Yes (one-time script)** |
| Order form | 3 hardcoded sections | **Dynamic from active shops** |
| Sidebar | Hardcoded 3 links | **Dynamic from database** |
| Filter by shop | `?shop=shop1` | `?shopId=<ObjectId>` |

---

> **No new npm dependencies required.** All tools are already installed.
