import mongoose from 'mongoose';
import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import Notification from '@/models/Notification';

jest.setTimeout(60000);

describe('Notification Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  it('creates and saves a notification successfully', async () => {
    const notificationData = {
      purchaseRecordId: new mongoose.Types.ObjectId(),
      type: 'CHEQUE_REMINDER',
      title: 'Cheque Payment Due',
      message: 'Payment due in 3 days',
      amount: 5000,
      paymentDate: new Date(),
      daysBefore: 3,
      reminderKey: `rem_${Date.now()}`
    };
    
    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();

    expect(savedNotification._id).toBeDefined();
    expect(savedNotification.status).toBe('UNREAD'); // Database default
    expect(savedNotification.title).toBe(notificationData.title);
  });

  it('fails to save a notification without required fields', async () => {
    const incompleteData = new Notification({
      type: 'CHEQUE_REMINDER'
    });
    
    let error;
    try {
      await incompleteData.save();
    } catch (err) {
      error = err as any;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.amount).toBeDefined();
  });

  it('fails to save a duplicate reminderKey', async () => {
    const purchaseId = new mongoose.Types.ObjectId();
    const data = {
      purchaseRecordId: purchaseId,
      type: 'CHEQUE_REMINDER',
      title: 'Cheque Payment Due',
      message: 'Payment due in 3 days',
      amount: 5000,
      paymentDate: new Date(),
      daysBefore: 3,
      reminderKey: 'same_key'
    };
    
    await new Notification(data).save();
    
    const duplicateData = new Notification(data);
    let error;
    try {
      await duplicateData.save();
    } catch (err) {
      error = err as any;
    }
    
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // duplicate key error
  });
});
