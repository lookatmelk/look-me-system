import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import Shop from '@/models/Shop';

jest.setTimeout(60000);

describe('Shop Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  it('creates and saves a shop successfully with auto-generated slug', async () => {
    const shopData = {
      name: 'LOOK@ME Colombo',
      location: 'Colombo 03',
      manager: 'Jane Doe',
      phone: '+94 77 000 0000',
      email: 'colombo@lookatme.lk',
      color: 'blue'
    };
    
    // We expect slug to be generated prior to validation
    const shop = new Shop(shopData);
    const savedShop = await shop.save();

    expect(savedShop._id).toBeDefined();
    expect(savedShop.name).toBe(shopData.name);
    expect(savedShop.slug).toBe('look-me-colombo');
    expect(savedShop.status).toBe('ACTIVE'); // Default value
  });

  it('fails to save a shop without a name', async () => {
    const shopWithoutName = new Shop({ location: 'Kandy' });
    let error;
    try {
      await shopWithoutName.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it('fails to save a shop with an invalid color', async () => {
    const shopWithInvalidColor = new Shop({ name: 'Test Shop', color: 'invalid-color' });
    let error;
    try {
      await shopWithInvalidColor.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.errors.color).toBeDefined();
  });

  it('fails to save a shop with a duplicate slug (or duplicate name causing duplicate slug)', async () => {
    const shopData = { name: 'LOOK@ME Kandy' };
    await new Shop(shopData).save();
    
    const duplicateShop = new Shop(shopData);
    let error;
    try {
      await duplicateShop.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error code
  });
});
