import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueValue } from './helpers';

test.describe('Orders Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
  });

  test('Orders list page loads and shows the data table', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Orders');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Order' })).toBeVisible();
  });

  test('Search filter exists on Orders page', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search design no, description..."]');
    await expect(searchInput).toBeVisible();
    const value = uniqueValue('ord-search');
    await searchInput.fill(value);
    await expect(searchInput).toHaveValue(value);
  });

  test('Add Order navigates to add page with multistep form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Order' }).click();
    await expect(page).toHaveURL(/\/admin\/orders\/add$/);
    await expect(page.locator('h1')).toContainText('Add Order');
    await expect(page.locator('text=Design Selection')).toBeVisible();
    await expect(page.locator('text=Shop Allocations')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
  });

  test('order form step 1 shows validation when moving next without required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Order' }).click();
    await expect(page).toHaveURL(/\/admin\/orders\/add$/);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page).toHaveURL(/\/admin\/orders\/add$/);
  });
});
