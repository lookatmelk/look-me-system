import mongoose from 'mongoose';
import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import PurchaseRecord from '@/models/PurchaseRecord';

jest.setTimeout(60000);

describe('PurchaseRecord Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  const mockSupplierId = new mongoose.Types.ObjectId();
  const mockCategoryId = new mongoose.Types.ObjectId();

  it('creates and saves a purchase record, auto-calculating the amount', async () => {
    const recordData = {
      buyDate: new Date(),
      supplierId: mockSupplierId,
      categoryId: mockCategoryId,
      description: 'Test Purchase',
      units: 'UNITS',
      qty: 10,
      rate: 15.5,
      paymentMode: 'CASH',
      status: 'PENDING',
    };
    
    const validRecord = new PurchaseRecord(recordData);
    const savedRecord = await validRecord.save();

    expect(savedRecord._id).toBeDefined();
    expect(savedRecord.qty).toBe(10);
    expect(savedRecord.rate).toBe(15.5);
    expect(savedRecord.amount).toBe(155);
    expect(savedRecord.status).toBe('PENDING');
  });

  it('fails to save a purchase record without required supplierId', async () => {
    const recordData = {
      buyDate: new Date(),
      categoryId: mockCategoryId,
      description: 'Test Purchase missing Supplier',
      units: 'YARDS',
      qty: 5,
      rate: 10,
      paymentMode: 'CASH',
    };
    
    let error;
    try {
      await new PurchaseRecord(recordData).save();
    } catch (err) {
      error = err as any;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.supplierId).toBeDefined();
  });

  it('fails to save if qty or rate is negative', async () => {
    const recordData = {
      buyDate: new Date(),
      supplierId: mockSupplierId,
      categoryId: mockCategoryId,
      description: 'Test Purchase negative qty',
      units: 'UNITS',
      qty: -5,
      rate: 10,
      paymentMode: 'CASH',
    };
    
    let error;
    try {
      await new PurchaseRecord(recordData).save();
    } catch (err) {
      error = err as any;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.qty).toBeDefined();
  });
});
