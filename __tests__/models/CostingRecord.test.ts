import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import CostingRecord from '@/models/CostingRecord';

jest.setTimeout(60000);

describe('CostingRecord Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  const validData = {
    designNo: 'D-001',
    description: 'Summer Dress',
    purchasingDescription: 'Cotton Fabric',
    size: 'M',
    fabric: 'Cotton',
    fabricPrice: 500,
    fabricConsumption: 2, // 500 * 2 = 1000 fabric Cost
    printBelt: 100,
    threadLabelsPollyBags: 50,
    fusingElasticButtonZip: 50,
    standardMinutesValue: 10,
    sewingCost: 200,
    accessoriesCost: 100, // Total cost = 1000 + 100 + 50 + 50 + 200 + 100 = 1500
    sellingPrice: 3000 // Gross profit = 1500 -> 50%
  };

  it('calculates computed fields properly on save', async () => {
    const costing = new CostingRecord(validData);
    const savedCosting = await costing.save();

    expect(savedCosting._id).toBeDefined();
    expect(savedCosting.fabricCost).toBe(1000);
    expect(savedCosting.totalCost).toBe(1500);
    expect(savedCosting.grossProfit).toBe(1500);
    expect(savedCosting.profitPercentage).toBe(50);
  });

  it('fails to save without required fields', async () => {
    const incompleteCosting = new CostingRecord({ description: 'No design no' });
    let error;
    try {
      await incompleteCosting.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.errors.designNo).toBeDefined();
    expect(error.errors.purchasingDescription).toBeDefined();
  });

  it('validates enum values for size', async () => {
    const invalidSizeCosting = new CostingRecord({ ...validData, designNo: 'D-002', size: 'INVALID_SIZE' });
    let error;
    try {
      await invalidSizeCosting.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.errors.size).toBeDefined();
  });

  it('fails to save duplicate design numbers', async () => {
    await new CostingRecord(validData).save();
    
    // Attempt to save again with the exact same valid data (which includes the same designNo)
    const duplicateCosting = new CostingRecord({ ...validData, description: 'New description' });
    let error;
    try {
      await duplicateCosting.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });
});
