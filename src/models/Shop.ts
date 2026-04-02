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
ShopSchema.index({ status: 1 });

// Auto-generate slug from name (pre-validate)
ShopSchema.pre<IShop>('validate', function () {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Force recompilation on hot-reload
delete mongoose.models.Shop;

export default mongoose.models.Shop ||
  mongoose.model<IShop>('Shop', ShopSchema);
