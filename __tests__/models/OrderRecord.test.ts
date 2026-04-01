import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import OrderRecord from '@/models/OrderRecord';
import CostingRecord from '@/models/CostingRecord';
import Shop from '@/models/Shop';

jest.setTimeout(60000);

describe('OrderRecord Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  let testShopId: any;
  let testCostingId: any;

  beforeEach(async () => {
    const shop = new Shop({
      name: 'Central Hub',
      color: 'blue'
    });
    const savedShop = await shop.save();
    testShopId = savedShop._id;

    const costing = new CostingRecord({
      designNo: 'ORD-TEST-1',
      description: 'Test Design',
      purchasingDescription: 'Cotton',
      size: 'M',
      fabric: 'Cotton',
      fabricPrice: 100,
      fabricConsumption: 1,
      sellingPrice: 1000
    });
    const savedCosting = await costing.save();
    testCostingId = savedCosting._id;
  });

  it('calculates totals based on dynamic shop allocations correctly', async () => {
    const orderData = {
      designNo: 'ORD-TEST-1',
      costingId: testCostingId,
      description: 'First order run',
      sellingPrice: 1000,
      totalCost: 100, // Denormalized from costing
      profitPercentage: 90,
      shopAllocations: [
        { shopId: testShopId, shopName: 'Central Hub', qty: 50, sizes: ['M', 'L'] },
        { shopId: testShopId, shopName: 'Another Hub', qty: 25, sizes: ['S'] }
      ]
    };
    
    const order = new OrderRecord(orderData);
    const savedOrder = await order.save();

    expect(savedOrder._id).toBeDefined();
    // 50 + 25
    expect(savedOrder.designTotal).toBe(75);
    // 1000 * 75
    expect(savedOrder.projectedRevenue).toBe(75000);
    // (1000 - 100) * 75 = 900 * 75 = 67500
    expect(savedOrder.projectedProfit).toBe(67500);
  });

  it('fails if no shop has quantity greater than zero', async () => {
    const invalidOrder = new OrderRecord({
      designNo: 'ORD-TEST-2',
      costingId: testCostingId,
      description: 'Invalid order run',
      sellingPrice: 1000,
      totalCost: 100,
      shopAllocations: [
        { shopId: testShopId, shopName: 'Zero Qty Hub', qty: 0, sizes: [] }
      ]
    });

    let error;
    try {
      await invalidOrder.save();
    } catch (err) {
      error = err as any;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.shopAllocations).toBeDefined();
  });

  it('fails if an invalid size is passed to a shop allocation', async () => {
    const invalidOrder = new OrderRecord({
      designNo: 'ORD-TEST-3',
      costingId: testCostingId,
      description: 'Invalid size order',
      sellingPrice: 1000,
      totalCost: 100,
      shopAllocations: [
        { shopId: testShopId, shopName: 'Central Hub', qty: 10, sizes: ['INVALID_SIZE_XYZ'] }
      ]
    });

    let error;
    try {
      await invalidOrder.save();
    } catch (err) {
      error = err as any;
    }
    
    expect(error).toBeDefined();
    // Since it's inside an array, it'll throw a validation error
  });
});
