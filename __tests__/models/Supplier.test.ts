import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import Supplier from '@/models/Supplier';

jest.setTimeout(60000);

describe('Supplier Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  it('creates and saves a supplier successfully', async () => {
    const supplierData = {
      name: 'Test Supplier',
      phone: '+123456789',
      email: 'test@supplier.com',
      contactPerson: 'John Doe',
      address: '123 Test St',
    };
    const validSupplier = new Supplier(supplierData);
    const savedSupplier = await validSupplier.save();

    expect(savedSupplier._id).toBeDefined();
    expect(savedSupplier.name).toBe(supplierData.name);
    expect(savedSupplier.email).toBe(supplierData.email);
  });

  it('fails to save a supplier without required fields', async () => {
    const supplierWithoutRequiredFields = new Supplier({ name: 'Incomplete' });
    let error;
    try {
      await supplierWithoutRequiredFields.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.errors.phone).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it('fails to save a supplier with a duplicate unique field', async () => {
    const supplierData = { name: 'Unique', phone: '123', email: 'u@test.com' };
    await new Supplier(supplierData).save();
    
    const duplicateSupplier = new Supplier(supplierData);
    let error;
    try {
      await duplicateSupplier.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error code
  });
});
