# Guide 01 — Data Model Changes (CostingRecord.ts)

## File to Modify

`src/models/CostingRecord.ts`

## Current State Summary

The model currently has these fields:
- **Identity**: `designNo` (String, unique), `description` (String), `purchasingDescription` (String), `size` (enum: S/M/L/XL/2XL/FREE)
- **Fabric (flat)**: `fabric` (String), `fabricPrice` (Number), `fabricConsumption` (Number)
- **Additional Costs (flat)**: `printBelt`, `threadLabelsPollyBags`, `fusingElasticButtonZip`, `standardMinutesValue`
- **Calculated Totals**: `fabricCost`, `sewingCost`, `accessoriesCost`, `totalCost`, `sellingPrice`, `grossProfit`, `profitPercentage`

## Required Changes

### Step 1: Remove Purchasing-Linked Fields

Remove these fields entirely:
- `purchasingDescription` — was linked to PurchaseRecord descriptions
- `fabric` — was auto-mapped from purchasing description
- `fabricPrice` — replaced by fabric line items
- `fabricConsumption` — replaced by fabric line items

### Step 2: Remove Flat Additional Cost Fields

Remove these fields entirely (replaced by dynamic line items):
- `printBelt`
- `threadLabelsPollyBags`
- `fusingElasticButtonZip`
- `standardMinutesValue`
- `fabricCost` (will be auto-summed from fabric items)

### Step 3: Change `size` From Single Enum to Array of Strings

**Before:**
```typescript
size: {
  type: String,
  required: [true, 'Size is required'],
  enum: { values: ['S', 'M', 'L', 'XL', '2XL', 'FREE'], message: '...' },
}
```

**After:**
```typescript
sizes: {
  type: [String],
  required: [true, 'At least one size is required'],
  validate: {
    validator: function (v: string[]) {
      return v.length > 0;
    },
    message: 'At least one size must be specified',
  },
}
```

> **Important**: The field name changes from `size` (singular) to `sizes` (plural). This is a breaking change that must be reflected in all consuming components.

The `sizes` array allows free-text entries typed by the user. No enum restriction — users may type any size string (e.g., "S", "M", "L", "XL", "2XL", "FREE", "28", "30", etc.).

### Step 4: Define Line Item Sub-Schema

Create a sub-schema for cost line items. Each line item represents one row in the costing spreadsheet:

```typescript
export interface ICostLineItem {
  type: string;         // e.g. "SEWING", "FABRIC", "LILING", "FUSING", "THREADS", "ELASTIC", "EMB/PRINT", etc.
  description: string;  // e.g. "CUTTING, SEWING, PACKING", "VISCOSE PRINTED", "COTTON AND YARN"
  unit: string;         // e.g. "SMV", "YADS", "CONN", "ROLL", "NOS", "ANY"
  rate: number;         // price per unit
  consumption: number;  // quantity consumed (CON column)
  amount: number;       // auto-calculated based on category formula
}

const CostLineItemSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: [true, 'Item type is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Rate cannot be negative'],
    },
    consumption: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Consumption cannot be negative'],
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);
```

### Step 5: Add Category Arrays to the Main Schema

Replace the flat cost fields with four arrays:

```typescript
// ─── Sewing Items ───
sewingItems: {
  type: [CostLineItemSchema],
  default: [],
},

// ─── Fabric Items ───
fabricItems: {
  type: [CostLineItemSchema],
  default: [],
},

// ─── Accessories Items ───
accessoriesItems: {
  type: [CostLineItemSchema],
  default: [],
},

// ─── Special Items ───
specialItems: {
  type: [CostLineItemSchema],
  default: [],
},
```

### Step 6: Keep These Summary Fields (Auto-Calculated)

```typescript
// ─── Category Totals (auto-calculated from line items) ───
sewingCost: { type: Number, required: true, default: 0 },
fabricCost: { type: Number, required: true, default: 0 },
accessoriesCost: { type: Number, required: true, default: 0 },
specialCost: { type: Number, required: true, default: 0 },

// ─── Overall Totals (auto-calculated) ───
totalCost: { type: Number, required: true, default: 0 },
sellingPrice: { type: Number, required: true, min: [0, 'Selling price cannot be negative'] },
grossProfit: { type: Number, required: true, default: 0 },
profitPercentage: { type: Number, required: true, default: 0 },
```

### Step 7: Update the Pre-Save Hook

The pre-save hook must:

1. **Calculate each line item's `amount`** based on its parent category:
   - **Sewing items**: `amount = rate × consumption`
   - **Fabric items**: `amount = (rate × consumption) + ((rate × consumption) / 100 × 5)` — this adds 5% wastage
   - **Accessories items**: `amount = rate × consumption`
   - **Special items**: `amount = rate × consumption`

2. **Sum category totals**:
   - `sewingCost = sum of sewingItems[].amount`
   - `fabricCost = sum of fabricItems[].amount`
   - `accessoriesCost = sum of accessoriesItems[].amount`
   - `specialCost = sum of specialItems[].amount`

3. **Calculate grand totals**:
   - `totalCost = sewingCost + fabricCost + accessoriesCost + specialCost`
   - `grossProfit = sellingPrice - totalCost`
   - `profitPercentage = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0`

```typescript
CostingRecordSchema.pre<ICostingRecord>('save', function () {
  // ─── 1. Calculate each line item amount ───

  // Sewing: amount = rate × consumption
  if (this.sewingItems) {
    this.sewingItems.forEach(item => {
      item.amount = Number((item.rate * item.consumption).toFixed(2));
    });
  }

  // Fabric: amount = rate × consumption + (rate × consumption) / 100 × 5
  // This adds a 5% wastage factor
  if (this.fabricItems) {
    this.fabricItems.forEach(item => {
      const base = item.rate * item.consumption;
      item.amount = Number((base + (base / 100) * 5).toFixed(2));
    });
  }

  // Accessories: amount = rate × consumption
  if (this.accessoriesItems) {
    this.accessoriesItems.forEach(item => {
      item.amount = Number((item.rate * item.consumption).toFixed(2));
    });
  }

  // Special: amount = rate × consumption
  if (this.specialItems) {
    this.specialItems.forEach(item => {
      item.amount = Number((item.rate * item.consumption).toFixed(2));
    });
  }

  // ─── 2. Sum category totals ───
  this.sewingCost = Number(
    (this.sewingItems || []).reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
  );
  this.fabricCost = Number(
    (this.fabricItems || []).reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
  );
  this.accessoriesCost = Number(
    (this.accessoriesItems || []).reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
  );
  this.specialCost = Number(
    (this.specialItems || []).reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
  );

  // ─── 3. Grand totals ───
  this.totalCost = Number(
    (this.sewingCost + this.fabricCost + this.accessoriesCost + this.specialCost).toFixed(2)
  );

  if (this.sellingPrice !== undefined) {
    this.grossProfit = Number((this.sellingPrice - this.totalCost).toFixed(2));
  }

  if (this.sellingPrice && this.sellingPrice > 0) {
    this.profitPercentage = Number(((this.grossProfit / this.sellingPrice) * 100).toFixed(2));
  } else {
    this.profitPercentage = 0;
  }
});
```

### Step 8: Update the Interface

```typescript
export interface ICostingRecord extends Document {
  // ─── Identity ───
  designNo: string;
  description: string;
  sizes: string[];

  // ─── Line Items (arrays of sub-documents) ───
  sewingItems: ICostLineItem[];
  fabricItems: ICostLineItem[];
  accessoriesItems: ICostLineItem[];
  specialItems: ICostLineItem[];

  // ─── Category Totals (auto-calculated) ───
  sewingCost: number;
  fabricCost: number;
  accessoriesCost: number;
  specialCost: number;

  // ─── Overall Totals (auto-calculated) ───
  totalCost: number;
  sellingPrice: number;
  grossProfit: number;
  profitPercentage: number;

  // ─── Metadata ───
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 9: Update Indexes

Remove:
```typescript
CostingRecordSchema.index({ purchasingDescription: 1 });
CostingRecordSchema.index({ size: 1 });
```

Keep:
```typescript
CostingRecordSchema.index({ designNo: 1 });
CostingRecordSchema.index({ description: 1 });
CostingRecordSchema.index({ createdAt: -1 });
```

---

## Summary of Removed Fields

| Field                      | Reason                                       |
|----------------------------|----------------------------------------------|
| `purchasingDescription`    | Purchasing relationship removed              |
| `fabric`                   | Purchasing relationship removed              |
| `fabricPrice`              | Replaced by `fabricItems[].rate`             |
| `fabricConsumption`        | Replaced by `fabricItems[].consumption`      |
| `printBelt`                | Merged into `specialItems` or `accessoriesItems` |
| `threadLabelsPollyBags`    | Merged into `accessoriesItems`               |
| `fusingElasticButtonZip`   | Merged into `accessoriesItems`               |
| `standardMinutesValue`     | Part of sewing item's `consumption` field    |
| `size` (singular)          | Replaced by `sizes` (array)                  |

## Summary of New Fields

| Field              | Type                   | Description                                      |
|--------------------|------------------------|--------------------------------------------------|
| `sizes`            | `String[]`             | Multiple sizes per design (free-text)            |
| `sewingItems`      | `CostLineItem[]`       | Multiple sewing cost entries                     |
| `fabricItems`      | `CostLineItem[]`       | Multiple fabric cost entries (with 5% wastage)   |
| `accessoriesItems` | `CostLineItem[]`       | Multiple accessories cost entries                |
| `specialItems`     | `CostLineItem[]`       | Multiple special cost entries                    |
| `specialCost`      | `Number`               | Sum of special items (new total)                 |

---

## Migration Note

If existing records exist in the database, they will have the old field structure. The implementing agent should handle backward compatibility:
- Old records with `size` (string) can be queried but won't match `sizes` (array).
- Consider a migration script or handling both formats gracefully in the API layer.
- If the database is in development mode without production data, it's acceptable to drop existing costing records.
