import { connectDB, closeDB, clearDB } from '../../testUtils/db';
import Category from '@/models/Category';

jest.setTimeout(60000);

describe('Category Model', () => {
  beforeAll(async () => await connectDB());
  afterEach(async () => await clearDB());
  afterAll(async () => await closeDB());

  it('creates and saves a category successfully', async () => {
    const categoryData = {
      name: 'FABRIC',
      description: 'All kinds of fabrics',
      imageUrl: 'https://res.cloudinary.com/test'
    };
    const validCategory = new Category(categoryData);
    const savedCategory = await validCategory.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(categoryData.name);
  });

  it('fails to save a category without required fields', async () => {
    const categoryWithoutRequiredFields = new Category({ description: 'No name' });
    let error;
    try {
      await categoryWithoutRequiredFields.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it('fails to save a category with a duplicate name', async () => {
    const categoryData = { name: 'ACCESSORIES' };
    await new Category(categoryData).save();
    
    const duplicateCategory = new Category(categoryData);
    let error;
    try {
      await duplicateCategory.save();
    } catch (err) {
      error = err as any;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); 
  });
});
