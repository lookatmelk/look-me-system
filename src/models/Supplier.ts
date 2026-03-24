import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
