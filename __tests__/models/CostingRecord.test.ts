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
    sizes: ['M', 'L'],
    sewingItems: [{ type: 'Sewing', unit: 'SMV', rate: 10, consumption: 20 }], // amount: 200
    fabricItems: [{ type: 'Cotton', unit: 'YADS', rate: 500, consumption: 2 }], // amount: 1050 (incl 5% wastage)
    accessoriesItems: [{ type: 'Button', unit: 'NOS', rate: 50, consumption: 2 }], // amount: 100
    specialItems: [], // amount: 0
    sellingPrice: 3000 // Total cost = 1350. Gross profit = 1650, Profit % = 55
  };

  it('calculates computed fields properly on save', async () => {
    const costing = new CostingRecord(validData);
    const savedCosting = await costing.save();

    expect(savedCosting._id).toBeDefined();

    // Line items amounts
    expect(savedCosting.sewingItems[0].amount).toBe(200);
    expect(savedCosting.fabricItems[0].amount).toBe(1050);
    expect(savedCosting.accessoriesItems[0].amount).toBe(100);

    // Category totals
    expect(savedCosting.sewingCost).toBe(200);
    expect(savedCosting.fabricCost).toBe(1050);
    expect(savedCosting.accessoriesCost).toBe(100);
    expect(savedCosting.specialCost).toBe(0);

    // Grand totals
    expect(savedCosting.totalCost).toBe(1350);
    expect(savedCosting.grossProfit).toBe(1650);
    expect(savedCosting.profitPercentage).toBe(55);
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
    expect(error.errors.sizes).toBeDefined();
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
