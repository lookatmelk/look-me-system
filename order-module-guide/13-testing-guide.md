# 13 — Testing Guide

> Testing strategy for the Orders module covering unit tests, API integration tests, and E2E browser tests. Follows the same patterns as `costing-module-guide/11-testing-guide.md` and existing `e2e/purchasing.spec.ts`.

---

## Test Structure

```
__tests__/
└── orders/
    ├── OrderRecord.test.ts              Unit tests for Mongoose model
    ├── orders-api.test.ts               API route integration tests
    └── orders-designs.test.ts           Designs endpoint tests

e2e/
└── orders.spec.ts                        Playwright E2E tests
```

---

## 1. Model Unit Tests

**File:** `__tests__/orders/OrderRecord.test.ts`

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// import OrderRecord from '@/models/OrderRecord';

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

describe('OrderRecord Model', () => {
  const validCostingId = new mongoose.Types.ObjectId();

  const validData = {
    designNo: '1001',
    costingId: validCostingId,
    description: 'LEGGING',
    shop1: { qty: 360, sizes: ['M', 'L', 'XL'] },
    shop2: { qty: 120, sizes: ['L', 'XL', '2XL'] },
    shop3: { qty: 0, sizes: [] },
    sellingPrice: 275,
    totalCost: 219,
    profitPercentage: 25.57,
    orderDate: new Date('2026-03-29'),
    status: 'PENDING',
  };

  // ─── Creation Tests ───

  test('should create an order record with valid data', async () => {
    const record = await OrderRecord.create(validData);
    expect(record._id).toBeDefined();
    expect(record.designNo).toBe('1001');
    expect(record.description).toBe('LEGGING');
    expect(record.status).toBe('PENDING');
  });

  test('should auto-calculate designTotal', async () => {
    const record = await OrderRecord.create(validData);
    // designTotal = 360 + 120 + 0 = 480
    expect(record.designTotal).toBe(480);
  });

  test('should auto-calculate projectedRevenue', async () => {
    const record = await OrderRecord.create(validData);
    // projectedRevenue = sellingPrice × designTotal = 275 × 480 = 132000
    expect(record.projectedRevenue).toBe(132000);
  });

  test('should auto-calculate projectedProfit', async () => {
    const record = await OrderRecord.create(validData);
    // projectedProfit = (sellingPrice - totalCost) × designTotal = (275 - 219) × 480 = 26880
    expect(record.projectedProfit).toBe(26880);
  });

  test('should handle zero quantities correctly', async () => {
    const record = await OrderRecord.create({
      ...validData,
      shop1: { qty: 0, sizes: [] },
      shop2: { qty: 0, sizes: [] },
      shop3: { qty: 100, sizes: ['M'] },
    });
    expect(record.designTotal).toBe(100);
    expect(record.projectedRevenue).toBe(27500); // 275 × 100
  });

  // ─── Validation Tests ───

  test('should reject missing required fields', async () => {
    await expect(OrderRecord.create({})).rejects.toThrow();
  });

  test('should reject missing designNo', async () => {
    const { designNo, ...incomplete } = validData;
    await expect(OrderRecord.create(incomplete)).rejects.toThrow();
  });

  test('should reject missing costingId', async () => {
    const { costingId, ...incomplete } = validData;
    await expect(OrderRecord.create(incomplete)).rejects.toThrow();
  });

  test('should reject missing orderDate', async () => {
    const { orderDate, ...incomplete } = validData;
    await expect(OrderRecord.create(incomplete)).rejects.toThrow();
  });

  test('should reject invalid status', async () => {
    await expect(
      OrderRecord.create({ ...validData, status: 'INVALID' })
    ).rejects.toThrow();
  });

  test('should accept all valid statuses', async () => {
    const statuses = ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    for (const status of statuses) {
      const record = await OrderRecord.create({
        ...validData,
        designNo: `TEST_${status}`,
        status,
      });
      expect(record.status).toBe(status);
    }
  });

  test('should reject negative shop quantities', async () => {
    await expect(
      OrderRecord.create({
        ...validData,
        designNo: 'NEG_QTY',
        shop1: { qty: -10, sizes: ['M'] },
      })
    ).rejects.toThrow();
  });

  test('should reject invalid size values in sizes array', async () => {
    await expect(
      OrderRecord.create({
        ...validData,
        designNo: 'INVALID_SIZE',
        shop1: { qty: 10, sizes: ['XXXXXXXXXXXL'] },
      })
    ).rejects.toThrow();
  });

  test('should accept numeric sizes', async () => {
    const record = await OrderRecord.create({
      ...validData,
      designNo: 'NUMERIC_SIZES',
      shop1: { qty: 60, sizes: ['28', '30', '32'] },
    });
    expect(record.shop1.sizes).toEqual(['28', '30', '32']);
  });

  test('should reject notes exceeding 500 characters', async () => {
    await expect(
      OrderRecord.create({
        ...validData,
        designNo: 'LONG_NOTES',
        notes: 'x'.repeat(501),
      })
    ).rejects.toThrow();
  });

  test('should default status to PENDING', async () => {
    const { status, ...dataWithoutStatus } = validData;
    const record = await OrderRecord.create({
      ...dataWithoutStatus,
      designNo: 'DEFAULT_STATUS',
    });
    expect(record.status).toBe('PENDING');
  });

  // ─── Sub-document Tests ───

  test('should store shop allocations with sizes', async () => {
    const record = await OrderRecord.create(validData);
    expect(record.shop1.qty).toBe(360);
    expect(record.shop1.sizes).toEqual(['M', 'L', 'XL']);
    expect(record.shop2.qty).toBe(120);
    expect(record.shop2.sizes).toEqual(['L', 'XL', '2XL']);
    expect(record.shop3.qty).toBe(0);
    expect(record.shop3.sizes).toEqual([]);
  });

  test('should allow empty sizes for zero-quantity shops', async () => {
    const record = await OrderRecord.create({
      ...validData,
      designNo: 'EMPTY_SHOP',
      shop3: { qty: 0, sizes: [] },
    });
    expect(record.shop3.sizes).toEqual([]);
  });

  // ─── Allow Multiple Orders for Same Design ───

  test('should allow multiple orders for the same designNo', async () => {
    await OrderRecord.create({ ...validData, orderDate: new Date('2026-03-01') });
    const second = await OrderRecord.create({
      ...validData,
      orderDate: new Date('2026-03-15'),
    });
    expect(second._id).toBeDefined();
  });
});
```

---

## 2. API Integration Tests

**File:** `__tests__/orders/orders-api.test.ts`

```typescript
describe('GET /api/orders', () => {
  test('should return all order records', async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should filter by status', async () => {
    const res = await fetch('/api/orders?status=PENDING');
    const data = await res.json();
    expect(data.success).toBe(true);
    data.data.forEach((record: any) => {
      expect(record.status).toBe('PENDING');
    });
  });

  test('should filter by designNo', async () => {
    const res = await fetch('/api/orders?designNo=1001');
    const data = await res.json();
    data.data.forEach((record: any) => {
      expect(record.designNo).toBe('1001');
    });
  });

  test('should filter by shop allocation', async () => {
    const res = await fetch('/api/orders?shop=shop1');
    const data = await res.json();
    data.data.forEach((record: any) => {
      expect(record.shop1.qty).toBeGreaterThan(0);
    });
  });

  test('should filter by design total range', async () => {
    const res = await fetch('/api/orders?minTotal=100&maxTotal=500');
    const data = await res.json();
    data.data.forEach((record: any) => {
      expect(record.designTotal).toBeGreaterThanOrEqual(100);
      expect(record.designTotal).toBeLessThanOrEqual(500);
    });
  });

  test('should filter by date range', async () => {
    const res = await fetch('/api/orders?startDate=2026-01-01&endDate=2026-03-31');
    const data = await res.json();
    data.data.forEach((record: any) => {
      const date = new Date(record.orderDate);
      expect(date.getTime()).toBeGreaterThanOrEqual(new Date('2026-01-01').getTime());
      expect(date.getTime()).toBeLessThan(new Date('2026-04-01').getTime());
    });
  });

  test('should populate costingId reference', async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (data.data.length > 0) {
      const record = data.data[0];
      // costingId should be populated with design details
      expect(record.costingId).toBeDefined();
      if (typeof record.costingId === 'object') {
        expect(record.costingId.designNo).toBeDefined();
        expect(record.costingId.description).toBeDefined();
      }
    }
  });
});

describe('POST /api/orders', () => {
  test('should create a new order record', async () => {
    const payload = {
      costingId: 'VALID_COSTING_ID', // Replace with actual ID in tests
      orderDate: '2026-03-29',
      status: 'PENDING',
      shop1: { qty: 100, sizes: ['M', 'L', 'XL'] },
      shop2: { qty: 50, sizes: ['L', 'XL'] },
      shop3: { qty: 0, sizes: [] },
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.designTotal).toBe(150);
  });

  test('should reject order with invalid costingId', async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        costingId: '000000000000000000000000', // Non-existent
        orderDate: '2026-03-29',
        shop1: { qty: 10, sizes: ['M'] },
        shop2: { qty: 0, sizes: [] },
        shop3: { qty: 0, sizes: [] },
      }),
    });

    expect(res.status).toBe(404);
  });

  test('should reject order with zero total quantity', async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        costingId: 'VALID_COSTING_ID',
        orderDate: '2026-03-29',
        shop1: { qty: 0, sizes: [] },
        shop2: { qty: 0, sizes: [] },
        shop3: { qty: 0, sizes: [] },
      }),
    });

    expect(res.status).toBe(400);
  });

  test('should reject shop with qty but no sizes', async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        costingId: 'VALID_COSTING_ID',
        orderDate: '2026-03-29',
        shop1: { qty: 100, sizes: [] }, // qty > 0 but no sizes
        shop2: { qty: 0, sizes: [] },
        shop3: { qty: 0, sizes: [] },
      }),
    });

    expect(res.status).toBe(400);
  });

  test('should snapshot costing data', async () => {
    // Create order, then verify sellingPrice/totalCost are snapshotted
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        costingId: 'VALID_COSTING_ID',
        orderDate: '2026-03-29',
        shop1: { qty: 10, sizes: ['M'] },
        shop2: { qty: 0, sizes: [] },
        shop3: { qty: 0, sizes: [] },
      }),
    });

    const data = await res.json();
    if (data.success) {
      expect(data.data.sellingPrice).toBeGreaterThan(0);
      expect(data.data.totalCost).toBeGreaterThan(0);
      expect(data.data.projectedRevenue).toBe(data.data.sellingPrice * data.data.designTotal);
    }
  });
});

describe('PUT /api/orders/:id', () => {
  test('should update shop quantities and recalculate totals', async () => {
    // Create a record first, then update shop quantities
    // Verify that designTotal, projectedRevenue, projectedProfit are recalculated
  });

  test('should update status', async () => {
    // Create, then update status from PENDING to IN_PRODUCTION
    // Verify status changed
  });

  test('should reject invalid status on update', async () => {
    // Try to set status to 'INVALID'
    // Expect 400
  });
});

describe('DELETE /api/orders/:id', () => {
  test('should delete an order record', async () => {
    // Create, then delete, then verify 404 on GET
  });

  test('should return 404 for non-existent record', async () => {
    const res = await fetch('/api/orders/000000000000000000000000', {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});
```

---

## 3. Designs Endpoint Tests

**File:** `__tests__/orders/orders-designs.test.ts`

```typescript
describe('GET /api/orders/designs', () => {
  test('should return design options from CostingRecord', async () => {
    const res = await fetch('/api/orders/designs');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should include required fields in each design', async () => {
    const res = await fetch('/api/orders/designs');
    const data = await res.json();
    if (data.data.length > 0) {
      const design = data.data[0];
      expect(design._id).toBeDefined();
      expect(design.designNo).toBeDefined();
      expect(design.description).toBeDefined();
      expect(design.sellingPrice).toBeDefined();
      expect(design.totalCost).toBeDefined();
      expect(design.profitPercentage).toBeDefined();
    }
  });

  test('should return designs sorted by designNo', async () => {
    const res = await fetch('/api/orders/designs');
    const data = await res.json();
    if (data.data.length > 1) {
      const designNos = data.data.map((d: any) => d.designNo);
      const sorted = [...designNos].sort();
      expect(designNos).toEqual(sorted);
    }
  });

  test('should not include unnecessary fields', async () => {
    const res = await fetch('/api/orders/designs');
    const data = await res.json();
    if (data.data.length > 0) {
      const design = data.data[0];
      // Should NOT include heavy fields
      expect(design.fabricConsumption).toBeUndefined();
      expect(design.printBelt).toBeUndefined();
      expect(design.threadLabelsPollyBags).toBeUndefined();
    }
  });
});
```

---

## 4. E2E Tests (Playwright)

**File:** `e2e/orders.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'admin@lookatme.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/admin/**');
}

test.describe('Orders Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Navigation Tests ───

  test('should navigate to orders page from sidebar', async ({ page }) => {
    await page.click('text=Orders');
    await page.waitForURL('/admin/orders');
    await expect(page.locator('h1')).toContainText('Orders');
  });

  test('orders page loads and shows table', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('h1')).toContainText('Orders');
    await expect(page.locator('table')).toBeVisible();
  });

  // ─── Stats Strip Tests ───

  test('should show stats strip when records exist', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForSelector('[class*="animate-fade-in-up"]', { timeout: 5000 });
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Units')).toBeVisible();
  });

  // ─── Filter Tests ───

  test('should open filter drawer', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.click('#open-orders-filters-btn');
    await expect(page.locator('text=Advanced Filters')).toBeVisible();
    await expect(page.locator('text=Order Status')).toBeVisible();
    await expect(page.locator('text=Design Number')).toBeVisible();
    await expect(page.locator('text=Shop Allocation')).toBeVisible();
    await expect(page.locator('text=Design Total Range')).toBeVisible();
    await expect(page.locator('text=Order Date Range')).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.click('#open-orders-filters-btn');
    await page.selectOption('select:near(:text("Order Status"))', 'PENDING');
    await page.click('text=Apply Filters');
    // Verify table only shows PENDING orders
  });

  test('should search by global filter', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.fill('input[placeholder*="Search"]', 'LEGGING');
    await page.waitForTimeout(500); // Debounce
    // Verify visible rows contain the search term
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.click('#open-orders-filters-btn');
    await page.selectOption('select:near(:text("Order Status"))', 'PENDING');
    await page.click('text=Apply Filters');
    await page.click('text=Clear all');
    // Verify all filters are cleared
  });

  // ─── Add Order Tests ───

  test('"Add Order" navigates to dedicated /add page', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.click('text=Add Order');
    await expect(page).toHaveURL(/\/admin\/orders\/add$/);
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('h1')).toContainText('Add Order');
  });

  test('Add Order page has all 3 steps', async ({ page }) => {
    await page.goto('/admin/orders/add');
    await expect(page.locator('text=Design Selection')).toBeVisible();
    await expect(page.locator('text=Shop Allocations')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
  });

  test('should validate required fields in step 1', async ({ page }) => {
    await page.goto('/admin/orders/add');
    // Try to go to next step without selecting a design
    await page.click('text=Next');
    await expect(page.locator('text=Please select a design')).toBeVisible();
  });

  test('should show design info when design is selected', async ({ page }) => {
    await page.goto('/admin/orders/add');
    // Select first design option
    const options = await page.locator('select[name="costingId"] option').allTextContents();
    if (options.length > 1) {
      await page.selectOption('select[name="costingId"]', { index: 1 });
      await expect(page.locator('text=Selected Design')).toBeVisible();
    }
  });

  test('should validate shop quantities in step 2', async ({ page }) => {
    await page.goto('/admin/orders/add');
    // Select a design and fill step 1
    await page.selectOption('select[name="costingId"]', { index: 1 });
    await page.fill('input[name="orderDate"]', '2026-03-29');
    await page.click('text=Next');

    // Try to go to step 3 without entering any quantities
    await page.click('text=Next');
    await expect(page.locator('text=At least one shop must have a quantity')).toBeVisible();
  });

  test('should show live design total on step 2', async ({ page }) => {
    await page.goto('/admin/orders/add');
    await page.selectOption('select[name="costingId"]', { index: 1 });
    await page.fill('input[name="orderDate"]', '2026-03-29');
    await page.click('text=Next');

    // Enter quantities
    await page.fill('input[name="shop1.qty"]', '100');
    await page.fill('input[name="shop2.qty"]', '50');
    // Verify total shows 150
    await expect(page.locator('text=150')).toBeVisible();
  });

  // ─── Detail Modal Tests ───

  test('should view record details on row click', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.locator('table tbody tr').first().click();
    await expect(page.locator('text=Design Total')).toBeVisible();
    await expect(page.locator('text=Projected Revenue')).toBeVisible();
    await expect(page.locator('text=Shop Allocations')).toBeVisible();
  });

  // ─── Delete Tests ───

  test('should show confirm modal on delete', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.locator('button[title="Delete"]').first().click();
    await expect(page.locator('text=Delete Order')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();
  });

  // ─── Back Navigation Tests ───

  test('Cancel on Add Order page returns to orders list', async ({ page }) => {
    await page.goto('/admin/orders/add');
    await page.locator('a[href="/admin/orders"]').first().click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
  });
});
```

---

## Running Tests

### Unit + Integration Tests
```bash
npm test -- --testPathPattern=orders
```

### E2E Tests
```bash
npx playwright test e2e/orders.spec.ts
```

### All Tests
```bash
npm test && npx playwright test
```

---

## Test Coverage Targets

| Area | Target | What to Test |
|------|--------|-------------|
| Model | 100% | All validations, calculations, edge cases, sub-documents |
| API GET | 90% | All filter combinations, populate, empty results, error cases |
| API POST | 100% | Valid create, costing validation, snapshot, qty validation |
| API PUT | 90% | Update shop qty + recalculate, status update, 404 handling |
| API DELETE | 100% | Successful delete, 404 handling |
| Designs API | 100% | Returns correct fields, sorted, no heavy data |
| E2E Navigation | 100% | Sidebar link, breadcrumb, back navigation |
| E2E CRUD | 90% | Create full flow, Read via detail modal |
| E2E Filters | 80% | Search, status filter, drawer open/close, clear all |
| E2E Validation | 90% | Step 1 required fields, step 2 qty/sizes validation |

---

> **Back to:** [00-overview.md](./00-overview.md)
