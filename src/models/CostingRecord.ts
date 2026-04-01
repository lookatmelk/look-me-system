import mongoose, { Schema, Document } from 'mongoose';

export interface ICostLineItem {
  type: string;
  description: string;
  unit: string;
  rate: number;
  consumption: number;
  amount: number;
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
      required: [true, 'Design description is required'],
      trim: true,
    },
    sizes: {
      type: [String],
      required: [true, 'At least one size is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one size must be specified',
      },
    },

    // ─── Line Items ───
    sewingItems: {
      type: [CostLineItemSchema],
      default: [],
    },
    fabricItems: {
      type: [CostLineItemSchema],
      default: [],
    },
    accessoriesItems: {
      type: [CostLineItemSchema],
      default: [],
    },
    specialItems: {
      type: [CostLineItemSchema],
      default: [],
    },

    // ─── Costs ───
    sewingCost: { type: Number, required: true, default: 0 },
    fabricCost: { type: Number, required: true, default: 0 },
    accessoriesCost: { type: Number, required: true, default: 0 },
    specialCost: { type: Number, required: true, default: 0 },

    // ─── Totals ───
    totalCost: { type: Number, required: true, default: 0 },
    sellingPrice: {
      type: Number,
      required: true,
      min: [0, 'Selling price cannot be negative'],
    },
    grossProfit: { type: Number, required: true, default: 0 },
    profitPercentage: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Compound index for common queries
CostingRecordSchema.index({ description: 1 });
CostingRecordSchema.index({ createdAt: -1 });

// Auto-Calculations
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

// Force model recompilation on Next.js hot-reloads
const globalAny: any = global;
if (globalAny.mongoose?.models) {
  delete globalAny.mongoose.models.CostingRecord;
} else if (mongoose.models) {
  delete mongoose.models.CostingRecord;
}

export default mongoose.models.CostingRecord ||
  mongoose.model<ICostingRecord>('CostingRecord', CostingRecordSchema);
