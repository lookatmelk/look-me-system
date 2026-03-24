import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  imageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
