import mongoose, { Schema, Document } from 'mongoose';

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

  // ─── DYNAMIC SHOP ALLOCATIONS ───
  shopAllocations: IShopAllocation[];

  // ─── Auto-Calculated Totals ───
  designTotal: number;
  projectedRevenue: number;
  projectedProfit: number;

  // ─── Costing Snapshot (Denormalized) ───
  sellingPrice: number;
  totalCost: number;
  profitPercentage: number;

  orderDate: Date;
  status: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

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
        message: 'Invalid size value found in sizes array',
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

    // ─── Auto-Calculated Totals ───
    designTotal: { type: Number, required: true, default: 0, min: 0 },
    projectedRevenue: { type: Number, required: true, default: 0 },
    projectedProfit: { type: Number, required: true, default: 0 },

    // ─── Costing Snapshot ───
    sellingPrice: { type: Number, required: true, default: 0, min: 0 },
    totalCost: { type: Number, required: true, default: 0, min: 0 },
    profitPercentage: { type: Number, required: true, default: 0 },

    // ─── Order Meta ───
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
OrderRecordSchema.index({ createdAt: -1 });
OrderRecordSchema.index({ designTotal: -1 });
OrderRecordSchema.index({ status: 1, orderDate: -1 });
OrderRecordSchema.index({ 'shopAllocations.shopId': 1 });

// ─── Pre-Save Hook (Auto-Calculations) ───
OrderRecordSchema.pre<IOrderRecord>('save', function () {
  // designTotal = sum of all shop allocation quantities
  this.designTotal = this.shopAllocations.reduce(
    (sum, alloc) => sum + (alloc.qty || 0), 0
  );

  // Projected Revenue = sellingPrice × designTotal
  if (this.sellingPrice !== undefined) {
    this.projectedRevenue = Number((this.sellingPrice * this.designTotal).toFixed(2));
  }

  // Projected Profit = (sellingPrice - totalCost) × designTotal
  if (this.sellingPrice !== undefined && this.totalCost !== undefined) {
    this.projectedProfit = Number(
      ((this.sellingPrice - this.totalCost) * this.designTotal).toFixed(2)
    );
  }
});

// Force model recompilation on Next.js hot-reloads
delete mongoose.models.OrderRecord;

export default mongoose.models.OrderRecord ||
  mongoose.model<IOrderRecord>('OrderRecord', OrderRecordSchema);
