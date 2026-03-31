# 01 — Data Model (Mongoose Schema)

> **File to create:** `src/models/CostingRecord.ts`

---

## TypeScript Interface

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ICostingRecord extends Document {
  // ─── Identity ───
  designNo: string;          // e.g. "1001", "1002" — unique design number
  description: string;       // SELECTED from Purchasing descriptions dropdown
  size: string;              // S, M, L, XL, 2XL, FREE
  
  // ─── Fabric ───
  fabricName: string;        // e.g. "VISCOSE LYCRA", "CM 40", "ROSE CRAPE"
  fabricPrice: number;       // price per unit of fabric
  fabricConsumption: number; // consumption quantity (e.g. 16, 42, 66)
  
  // ─── Additional Costs (Input Fields) ───
  printBelt: number;         // print / belt cost
  threadLabelsPollyBags: number;  // thread, labels, polly bags combined
  fusingElasticButtonZip: number; // fusing, elastic, button, zip combined
  standardMinutesValue: number;   // SMV for production
  
  // ─── Calculated Cost Breakdown ───
  fabricCost: number;        // AUTO: fabricPrice × fabricConsumption
  sewingCost: number;        // Manual input: sewing labour cost
  accessoriesCost: number;   // Manual input: total accessories
  
  // ─── Totals (Auto-calculated) ───
  totalCost: number;         // AUTO: fabricCost + sewingCost + accessoriesCost + printBelt + threadLabelsPollyBags + fusingElasticButtonZip
  sellingPrice: number;      // Manual input: user sets the selling price
  grossProfit: number;       // AUTO: sellingPrice - totalCost
  profitPercentage: number;  // AUTO: (grossProfit / sellingPrice) × 100
  
  // ─── Metadata ───
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Mongoose Schema

```typescript
const CostingRecordSchema: Schema = new Schema(
  {
    // ─── Identity ───
    designNo: {
      type: String,
      required: [true, 'Design number is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      enum: {
        values: ['S', 'M', 'L', 'XL', '2XL', 'FREE'],
        message: '{VALUE} is not a valid size',
      },
    },

    // ─── Fabric ───
    fabricName: {
      type: String,
      required: [true, 'Fabric name is required'],
      trim: true,
    },
    fabricPrice: {
      type: Number,
      required: [true, 'Fabric price is required'],
      min: [0, 'Fabric price cannot be negative'],
    },
    fabricConsumption: {
      type: Number,
      required: [true, 'Fabric consumption is required'],
      min: [0, 'Fabric consumption cannot be negative'],
    },

    // ─── Additional Cost Inputs ───
    printBelt: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    threadLabelsPollyBags: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    fusingElasticButtonZip: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    standardMinutesValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // ─── Costs ───
    fabricCost: {
      type: Number,
      required: true,
      default: 0,
    },
    sewingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    accessoriesCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // ─── Totals ───
    totalCost: {
      type: Number,
      required: true,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: [0, 'Selling price cannot be negative'],
    },
    grossProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    profitPercentage: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);
```

---

## Indexes

```typescript
// Compound index for common queries
CostingRecordSchema.index({ designNo: 1 });
CostingRecordSchema.index({ description: 1 });
CostingRecordSchema.index({ size: 1 });
CostingRecordSchema.index({ createdAt: -1 });
```

---

## Pre-Save Hook (Auto-Calculations)

```typescript
CostingRecordSchema.pre<ICostingRecord>('save', function () {
  // 1. Fabric Cost = fabricPrice × fabricConsumption
  if (this.fabricPrice !== undefined && this.fabricConsumption !== undefined) {
    this.fabricCost = Number((this.fabricPrice * this.fabricConsumption).toFixed(2));
  }

  // 2. Total Cost = fabricCost + sewingCost + accessoriesCost + printBelt + threadLabelsPollyBags + fusingElasticButtonZip
  this.totalCost = Number((
    (this.fabricCost || 0) +
    (this.sewingCost || 0) +
    (this.accessoriesCost || 0) +
    (this.printBelt || 0) +
    (this.threadLabelsPollyBags || 0) +
    (this.fusingElasticButtonZip || 0)
  ).toFixed(2));

  // 3. Gross Profit = sellingPrice - totalCost
  if (this.sellingPrice !== undefined) {
    this.grossProfit = Number((this.sellingPrice - this.totalCost).toFixed(2));
  }

  // 4. Profit Percentage = (grossProfit / sellingPrice) × 100
  if (this.sellingPrice && this.sellingPrice > 0) {
    this.profitPercentage = Number(((this.grossProfit / this.sellingPrice) * 100).toFixed(2));
  } else {
    this.profitPercentage = 0;
  }
});
```

---

## Export

```typescript
export default mongoose.models.CostingRecord ||
  mongoose.model<ICostingRecord>('CostingRecord', CostingRecordSchema);
```

---

## Complete File

Combine all sections above into a single file at `src/models/CostingRecord.ts`. The pattern follows the existing `src/models/PurchaseRecord.ts` exactly.

---

## Key Design Decisions

1. **`description` is a plain `String`**, not an ObjectId reference — it stores the text value selected from the purchasing descriptions dropdown. This keeps the costing module loosely coupled to purchasing.

2. **All calculated fields are stored** (not virtual) — this matches the spreadsheet where calculated columns are persisted, and it allows efficient querying/sorting.

3. **`designNo` is unique** — each design can only have one costing entry.

4. **Size uses an enum** matching the Excel data: S, M, L, XL, 2XL, FREE.

5. **Pre-save hook** recalculates all derived fields on every save, ensuring consistency.

---

> **Next:** [02-api-routes.md](./02-api-routes.md)
