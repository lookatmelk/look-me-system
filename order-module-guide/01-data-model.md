# 01 — Data Model (Mongoose Schema)

> **File to create:** `src/models/OrderRecord.ts`

---

## TypeScript Interface

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IShopAllocation {
  qty: number;                    // Quantity allocated to this shop
  sizes: string[];                // Available sizes, e.g. ["M", "L", "XL"]
}

export interface IOrderRecord extends Document {
  // ─── Identity ───
  designNo: string;               // e.g. "1001" — links to CostingRecord.designNo
  costingId: mongoose.Types.ObjectId;  // Reference to CostingRecord._id
  description: string;            // Auto-filled from CostingRecord.description

  // ─── Shop Allocations ───
  shop1: IShopAllocation;         // Quantity + sizes for Shop 1
  shop2: IShopAllocation;         // Quantity + sizes for Shop 2
  shop3: IShopAllocation;         // Quantity + sizes for Shop 3

  // ─── Auto-Calculated Totals ───
  designTotal: number;            // AUTO: shop1.qty + shop2.qty + shop3.qty
  projectedRevenue: number;       // AUTO: sellingPrice × designTotal
  projectedProfit: number;        // AUTO: (sellingPrice - totalCost) × designTotal

  // ─── Costing Snapshot (Denormalized for Display) ───
  sellingPrice: number;           // Snapshot from CostingRecord at time of order
  totalCost: number;              // Snapshot from CostingRecord at time of order
  profitPercentage: number;       // Snapshot from CostingRecord at time of order

  // ─── Order Meta ───
  orderDate: Date;                // When the order was placed
  status: string;                 // PENDING | IN_PRODUCTION | DISPATCHED | DELIVERED | CANCELLED
  notes?: string;                 // Optional notes about the order

  // ─── Metadata ───
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Mongoose Schema

```typescript
const ShopAllocationSchema: Schema = new Schema(
  {
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
          const validSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'FREE',
            'FREE SIZE', 'FREE SIZE (1 INCH SHORT)',
            '28', '30', '32', '34', '36', '38', '40'];
          return v.every(size => validSizes.includes(size.toUpperCase()));
        },
        message: 'Invalid size value found in sizes array',
      },
    },
  },
  { _id: false }  // No separate _id for sub-documents
);

const OrderRecordSchema: Schema = new Schema(
  {
    // ─── Identity ───
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

    // ─── Shop Allocations ───
    shop1: {
      type: ShopAllocationSchema,
      required: true,
      default: { qty: 0, sizes: [] },
    },
    shop2: {
      type: ShopAllocationSchema,
      required: true,
      default: { qty: 0, sizes: [] },
    },
    shop3: {
      type: ShopAllocationSchema,
      required: true,
      default: { qty: 0, sizes: [] },
    },

    // ─── Auto-Calculated Totals ───
    designTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    projectedRevenue: {
      type: Number,
      required: true,
      default: 0,
    },
    projectedProfit: {
      type: Number,
      required: true,
      default: 0,
    },

    // ─── Costing Snapshot ───
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    profitPercentage: {
      type: Number,
      required: true,
      default: 0,
    },

    // ─── Order Meta ───
    orderDate: {
      type: Date,
      required: [true, 'Order date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'PENDING',
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);
```

---

## Indexes

```typescript
// Performance indexes for common queries
OrderRecordSchema.index({ designNo: 1 });
OrderRecordSchema.index({ costingId: 1 });
OrderRecordSchema.index({ status: 1 });
OrderRecordSchema.index({ orderDate: -1 });
OrderRecordSchema.index({ createdAt: -1 });
OrderRecordSchema.index({ designTotal: -1 });

// Compound index for filtered listing
OrderRecordSchema.index({ status: 1, orderDate: -1 });
```

---

## Pre-Save Hook (Auto-Calculations)

```typescript
OrderRecordSchema.pre<IOrderRecord>('save', function () {
  // 1. Design Total = shop1.qty + shop2.qty + shop3.qty
  this.designTotal = (this.shop1?.qty || 0) + (this.shop2?.qty || 0) + (this.shop3?.qty || 0);

  // 2. Projected Revenue = sellingPrice × designTotal
  if (this.sellingPrice !== undefined) {
    this.projectedRevenue = Number((this.sellingPrice * this.designTotal).toFixed(2));
  }

  // 3. Projected Profit = (sellingPrice - totalCost) × designTotal
  if (this.sellingPrice !== undefined && this.totalCost !== undefined) {
    this.projectedProfit = Number(
      ((this.sellingPrice - this.totalCost) * this.designTotal).toFixed(2)
    );
  }
});
```

---

## Export

```typescript
// Force model recompilation on Next.js hot-reloads
delete mongoose.models.OrderRecord;

export default mongoose.models.OrderRecord ||
  mongoose.model<IOrderRecord>('OrderRecord', OrderRecordSchema);
```

---

## Complete File

Combine all sections above into a single file at `src/models/OrderRecord.ts`. The pattern follows the existing `src/models/CostingRecord.ts` and `src/models/PurchaseRecord.ts`.

---

## Key Design Decisions

1. **`costingId` is an ObjectId reference** to CostingRecord — enables `populate()` calls and ensures referential integrity. The `designNo` is stored as a plain string for quick display.

2. **Shop allocations use a sub-document schema** (`ShopAllocationSchema`) — each shop has its own `qty` and `sizes` array. This cleanly mirrors the Excel structure where each shop column has two rows (quantity + sizes).

3. **Sizes are stored as `String[]`** — supports arbitrary size labels including numeric sizes (28, 30, 32) and text sizes (M, L, XL, FREE SIZE). This accommodates the flexibility shown in the Excel sheet.

4. **Costing fields are denormalized (snapshotted)** — `sellingPrice`, `totalCost`, and `profitPercentage` are copied from CostingRecord at order-creation time. This ensures historical accuracy: if the costing record changes later, the order retains the original pricing.

5. **`designNo` is NOT unique on OrderRecord** — unlike CostingRecord where each design has one entry, a design can have **multiple orders** over time (e.g., reorders). To prevent duplicate orders on the same date, consider a compound unique index: `{ designNo: 1, orderDate: 1 }`.

6. **Status enum** includes the full order lifecycle: PENDING → IN_PRODUCTION → DISPATCHED → DELIVERED, plus CANCELLED for voided orders.

7. **Pre-save hook** recalculates all derived fields on every save, ensuring consistency. This matches the CostingRecord pattern.

8. **Numeric sizes supported** — The sizes validator accepts both text sizes ("M", "L", "XL", "2XL", "FREE") and numeric sizes ("28", "30", "32", "34") as seen in the Excel "Orders" sheet for Office Pant.

---

> **Next:** [02-api-routes.md](./02-api-routes.md)
