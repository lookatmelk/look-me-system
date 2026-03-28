import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  purchaseRecordId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  amount: number;
  paymentDate: Date;
  daysBefore: number;
  status: string;
  reminderKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    purchaseRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseRecord',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['CHEQUE_REMINDER'],
      default: 'CHEQUE_REMINDER',
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    daysBefore: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['UNREAD', 'ACKNOWLEDGED', 'READ'],
      default: 'UNREAD',
    },
    reminderKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ status: 1 });
NotificationSchema.index({ purchaseRecordId: 1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
