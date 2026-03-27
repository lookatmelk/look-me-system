import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseRecord extends Document {
  buyDate: Date;
  supplierId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  description: string;
  units: string;
  qty: number;
  rate: number;
  amount: number;
  paymentMode: string;
  paymentDate?: Date;
  status: string;
  linkedOrderId?: mongoose.Types.ObjectId;
  emailReminderKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRecordSchema: Schema = new Schema(
  {
    buyDate: { type: Date, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, required: true, trim: true },
    units: { 
      type: String, 
      required: true, 
      enum: ['YARDS', 'UNITS', 'CONS', 'SETS', 'OTHER']
    },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, default: 0 },
    paymentMode: { 
      type: String, 
      required: true,
      enum: ['CHEQUE', 'CASH', 'BANK TRANSFER', 'CARD', 'CREDIT', 'OTHER']
    },
    paymentDate: { type: Date },
    status: { 
      type: String, 
      required: true,
      enum: ['PENDING', 'DONE', 'CANCELLED', 'RETURNED'],
      default: 'PENDING'
    },
    linkedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    emailReminderKeys: { type: [String], default: [] },
  },
  { timestamps: true }
);

PurchaseRecordSchema.index({ paymentMode: 1, paymentDate: 1, status: 1 });

// Auto calculate amount
PurchaseRecordSchema.pre<IPurchaseRecord>('save', async function() {
  if (this.qty !== undefined && this.rate !== undefined) {
    this.amount = Number((this.qty * this.rate).toFixed(2));
  }
});

export default mongoose.models.PurchaseRecord || mongoose.model<IPurchaseRecord>('PurchaseRecord', PurchaseRecordSchema);
