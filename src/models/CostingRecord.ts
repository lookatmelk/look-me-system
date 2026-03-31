import mongoose, { Schema, Document } from 'mongoose';

export interface ICostingRecord extends Document {
  // ─── Identity ───
  designNo: string;
  description: string;
  size: string;
  
  // ─── Fabric ───
  fabric: string;
  fabricPrice: number;
  fabricConsumption: number;
  
  // ─── Additional Costs (Input Fields) ───
  printBelt: number;
  threadLabelsPollyBags: number;
  fusingElasticButtonZip: number;
  standardMinutesValue: number;
  
  // ─── Calculated Cost Breakdown ───
  fabricCost: number;
  sewingCost: number;
  accessoriesCost: number;
  
  // ─── Totals (Auto-calculated) ───
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
    fabric: {
      type: String,
      required: [true, 'Fabric is required'],
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

// Compound index for common queries
CostingRecordSchema.index({ designNo: 1 });
CostingRecordSchema.index({ description: 1 });
CostingRecordSchema.index({ size: 1 });
CostingRecordSchema.index({ createdAt: -1 });

// Auto-Calculations
CostingRecordSchema.pre<ICostingRecord>('save', function () {
  // 1. Fabric Cost = fabricPrice × fabricConsumption
  if (this.fabricPrice !== undefined && this.fabricConsumption !== undefined) {
    this.fabricCost = Number((this.fabricPrice * this.fabricConsumption).toFixed(2));
  }

  // 2. Total Cost
  this.totalCost = Number((
    (this.fabricCost || 0) +
    (this.sewingCost || 0) +
    (this.accessoriesCost || 0) +
    (this.printBelt || 0) +
    (this.threadLabelsPollyBags || 0) +
    (this.fusingElasticButtonZip || 0)
  ).toFixed(2));

  // 3. Gross Profit
  if (this.sellingPrice !== undefined) {
    this.grossProfit = Number((this.sellingPrice - this.totalCost).toFixed(2));
  }

  // 4. Profit Percentage
  if (this.sellingPrice && this.sellingPrice > 0) {
    this.profitPercentage = Number(((this.grossProfit / this.sellingPrice) * 100).toFixed(2));
  } else {
    this.profitPercentage = 0;
  }
});

// Force model recompilation on Next.js hot-reloads
delete mongoose.models.CostingRecord;

export default mongoose.models.CostingRecord ||
  mongoose.model<ICostingRecord>('CostingRecord', CostingRecordSchema);
