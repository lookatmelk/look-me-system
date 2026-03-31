# 11 — Testing Guide

> Testing strategy for the Costing module covering unit tests, API integration tests, and E2E browser tests.

---

## Test Structure

```
__tests__/
└── costing/
    ├── CostingRecord.test.ts          Unit tests for Mongoose model
    ├── costing-api.test.ts            API route integration tests
    └── costing-descriptions.test.ts   Purchasing descriptions endpoint tests

e2e/
└── costing.spec.ts                    Playwright E2E tests
```

---

## 1. Model Unit Tests

**File:** `__tests__/costing/CostingRecord.test.ts`

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import the model after it's created
// import CostingRecord from '@/models/CostingRecord';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('CostingRecord Model', () => {
  const validData = {
    designNo: '1001',
    description: 'LEGGING',
    size: 'S',
    fabricName: 'VISCOSE LYCRA',
    fabricPrice: 360,
    fabricConsumption: 16,
    printBelt: 0,
    threadLabelsPollyBags: 10,
    fusingElasticButtonZip: 5,
    standardMinutesValue: 6,
    sewingCost: 36,
    accessoriesCost: 15,
    sellingPrice: 275,
  };

  test('should create a costing record with valid data', async () => {
    const record = await CostingRecord.create(validData);
    expect(record._id).toBeDefined();
    expect(record.designNo).toBe('1001');
    expect(record.description).toBe('LEGGING');
  });

  test('should auto-calculate fabricCost', async () => {
    const record = await CostingRecord.create(validData);
    // fabricCost = fabricPrice × fabricConsumption = 360 × 16 = 5760
    expect(record.fabricCost).toBe(5760);
  });

  test('should auto-calculate totalCost', async () => {
    const record = await CostingRecord.create(validData);
    // totalCost = fabricCost + sewingCost + accessoriesCost + printBelt + threadLabels + fusingElastic
    // = 5760 + 36 + 15 + 0 + 10 + 5 = 5826
    expect(record.totalCost).toBe(5826);
  });

  test('should auto-calculate grossProfit', async () => {
    const record = await CostingRecord.create(validData);
    // grossProfit = sellingPrice - totalCost = 275 - 5826 = -5551
    expect(record.grossProfit).toBe(275 - record.totalCost);
  });

  test('should auto-calculate profitPercentage', async () => {
    const record = await CostingRecord.create(validData);
    const expectedPct = ((record.grossProfit / record.sellingPrice) * 100);
    expect(record.profitPercentage).toBeCloseTo(expectedPct, 1);
  });

  test('should reject duplicate designNo', async () => {
    await CostingRecord.create(validData);
    await expect(CostingRecord.create(validData))
      .rejects.toThrow();
  });

  test('should reject missing required fields', async () => {
    await expect(CostingRecord.create({}))
      .rejects.toThrow();
  });

  test('should reject invalid size', async () => {
    await expect(CostingRecord.create({ ...validData, size: 'XXXL' }))
      .rejects.toThrow();
  });

  test('should accept all valid sizes', async () => {
    for (const size of ['S', 'M', 'L', 'XL', '2XL', 'FREE']) {
      const record = await CostingRecord.create({
        ...validData,
        designNo: `TEST_${size}`,
        size,
      });
      expect(record.size).toBe(size);
    }
  });

  test('should reject negative fabricPrice', async () => {
    await expect(CostingRecord.create({ ...validData, designNo: 'NEG', fabricPrice: -10 }))
      .rejects.toThrow();
  });
});
```

---

## 2. API Integration Tests

**File:** `__tests__/costing/costing-api.test.ts`

```typescript
describe('GET /api/costing', () => {
  test('should return all costing records', async () => {
    const res = await fetch('/api/costing');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should filter by size', async () => {
    const res = await fetch('/api/costing?size=M');
    const data = await res.json();
    expect(data.success).toBe(true);
    data.data.forEach((record: any) => {
      expect(record.size).toBe('M');
    });
  });

  test('should filter by description', async () => {
    const res = await fetch('/api/costing?description=LEGGING');
    const data = await res.json();
    data.data.forEach((record: any) => {
      expect(record.description).toBe('LEGGING');
    });
  });

  test('should filter by profit range', async () => {
    const res = await fetch('/api/costing?minProfit=20&maxProfit=40');
    const data = await res.json();
    data.data.forEach((record: any) => {
      expect(record.profitPercentage).toBeGreaterThanOrEqual(20);
      expect(record.profitPercentage).toBeLessThanOrEqual(40);
    });
  });
});

describe('POST /api/costing', () => {
  test('should create a new costing record', async () => {
    const payload = {
      designNo: 'TEST001',
      description: 'Test Garment',
      size: 'M',
      fabricName: 'Test Fabric',
      fabricPrice: 100,
      fabricConsumption: 10,
      printBelt: 5,
      threadLabelsPollyBags: 3,
      fusingElasticButtonZip: 2,
      standardMinutesValue: 8,
      sewingCost: 20,
      accessoriesCost: 10,
      sellingPrice: 200,
    };

    const res = await fetch('/api/costing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.designNo).toBe('TEST001');
    expect(data.data.fabricCost).toBe(1000); // 100 × 10
  });

  test('should reject duplicate designNo', async () => {
    // Create first
    await fetch('/api/costing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designNo: 'DUP001', /* ...rest */ }),
    });

    // Try duplicate
    const res = await fetch('/api/costing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designNo: 'DUP001', /* ...rest */ }),
    });

    expect(res.status).toBe(409);
  });
});

describe('PUT /api/costing/:id', () => {
  test('should update and recalculate fields', async () => {
    // Create a record first, then update the selling price
    // Verify that grossProfit and profitPercentage are recalculated
  });
});

describe('DELETE /api/costing/:id', () => {
  test('should delete a costing record', async () => {
    // Create, then delete, then verify 404 on GET
  });
});
```

---

## 3. Purchasing Descriptions Tests

**File:** `__tests__/costing/costing-descriptions.test.ts`

```typescript
describe('GET /api/costing/descriptions', () => {
  test('should return unique descriptions from PurchaseRecord', async () => {
    const res = await fetch('/api/costing/descriptions');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    // Descriptions should be unique
    const unique = [...new Set(data.data)];
    expect(data.data.length).toBe(unique.length);
  });

  test('should return sorted descriptions', async () => {
    const res = await fetch('/api/costing/descriptions');
    const data = await res.json();
    const sorted = [...data.data].sort((a: string, b: string) => a.localeCompare(b));
    expect(data.data).toEqual(sorted);
  });

  test('should not include empty strings', async () => {
    const res = await fetch('/api/costing/descriptions');
    const data = await res.json();
    data.data.forEach((desc: string) => {
      expect(desc.trim()).not.toBe('');
    });
  });
});
```

---

## 4. E2E Tests (Playwright)

**File:** `e2e/costing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Costing Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (adjust to your auth flow)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@lookatme.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should navigate to costing page from sidebar', async ({ page }) => {
    await page.click('text=Costing');
    await page.waitForURL('/admin/costing');
    await expect(page.locator('h1')).toContainText('Costing');
  });

  test('should show stats strip when records exist', async ({ page }) => {
    await page.goto('/admin/costing');
    // Wait for data to load
    await page.waitForSelector('[class*="animate-fade-in-up"]', { timeout: 5000 });
    await expect(page.locator('text=Total Records')).toBeVisible();
    await expect(page.locator('text=Avg Profit %')).toBeVisible();
  });

  test('should open filter drawer', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.click('#open-costing-filters-btn');
    await expect(page.locator('text=Advanced Filters')).toBeVisible();
    await expect(page.locator('text=Size')).toBeVisible();
    await expect(page.locator('text=Purchasing Description')).toBeVisible();
    await expect(page.locator('text=Profit Percentage Range')).toBeVisible();
  });

  test('should search by global filter', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.fill('input[placeholder*="Search"]', 'LEGGING');
    // Table should filter
    await page.waitForTimeout(500); // Debounce
    // Verify visible rows contain the search term
  });

  test('should open add costing form', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.click('text=Add Costing');
    await expect(page.locator('text=Design Details')).toBeVisible();
  });

  test('should validate required fields in form', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.click('text=Add Costing');
    // Try to go to next step without filling required fields
    await page.click('text=Next');
    await expect(page.locator('text=Design number is required')).toBeVisible();
  });

  test('should show purchasing descriptions in dropdown', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.click('text=Add Costing');
    const options = await page.locator('select[name="description"] option').allTextContents();
    expect(options.length).toBeGreaterThan(1); // At least placeholder + 1 description
    expect(options[0]).toContain('Select a purchasing description');
  });

  test('should create a costing record', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.click('text=Add Costing');

    // Step 1
    await page.fill('input[name="designNo"]', 'E2E_TEST');
    await page.selectOption('select[name="description"]', { index: 1 });
    await page.selectOption('select[name="size"]', 'M');
    await page.fill('input[name="fabricName"]', 'Test Fabric');
    await page.click('text=Next');

    // Step 2
    await page.fill('input[name="fabricPrice"]', '100');
    await page.fill('input[name="fabricConsumption"]', '10');
    await page.click('text=Next');

    // Step 3
    await page.fill('input[name="sewingCost"]', '20');
    await page.fill('input[name="accessoriesCost"]', '10');
    await page.fill('input[name="sellingPrice"]', '200');
    await page.click('text=Add Record');

    // Verify success
    await expect(page.locator('text=saved successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should view record details', async ({ page }) => {
    await page.goto('/admin/costing');
    // Click the first row's eye icon
    await page.locator('table tbody tr').first().click();
    await expect(page.locator('text=Total Cost')).toBeVisible();
    await expect(page.locator('text=Selling Price')).toBeVisible();
    await expect(page.locator('text=Cost Breakdown')).toBeVisible();
  });

  test('should filter by size', async ({ page }) => {
    await page.goto('/admin/costing');
    await page.click('#open-costing-filters-btn');
    await page.selectOption('select:near(:text("Size"))', 'M');
    await page.click('text=Apply Filters');
    // Verify table only shows size M records
  });

  test('should delete a costing record', async ({ page }) => {
    await page.goto('/admin/costing');
    // Accept the confirm dialog
    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('button[title="Delete"]').first().click();
    await expect(page.locator('text=deleted')).toBeVisible({ timeout: 5000 });
  });
});
```

---

## Running Tests

### Unit + Integration Tests
```bash
npm test -- --testPathPattern=costing
```

### E2E Tests
```bash
npx playwright test e2e/costing.spec.ts
```

### All Tests
```bash
npm test && npx playwright test
```

---

## Test Coverage Targets

| Area | Target | What to Test |
|------|--------|-------------|
| Model | 100% | All validations, calculations, edge cases |
| API GET | 90% | All filter combinations, empty results, error cases |
| API POST | 100% | Valid create, duplicate rejection, validation errors |
| API PUT | 90% | Update + recalculate, 404 handling |
| API DELETE | 100% | Successful delete, 404 handling |
| Descriptions API | 100% | Returns unique, sorted, non-empty descriptions |
| E2E Navigation | 100% | Sidebar link, breadcrumb |
| E2E CRUD | 90% | Create, Read, Update implied via form |
| E2E Filters | 80% | Search, size filter, description filter, drawer |

---

> **Back to:** [00-overview.md](./00-overview.md)
