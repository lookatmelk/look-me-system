import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Costing Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/costing');
  });

  test('Costing list page loads and shows the data table', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Costing');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Add Costing')).toBeVisible();
  });

  test('"Add Costing" navigates to the multi-step /add page', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Costing' }).click();
    await expect(page).toHaveURL(/\/admin\/costing\/add$/);
    await expect(page.locator('h1')).toContainText('Add Costing');
    await expect(page.locator('text=Design Details')).toBeVisible();
    await expect(page.locator('text=Cost Components')).toBeVisible();
  });

  test('Back link on Add Costing page returns to list', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Costing' }).click();
    await page.locator('a[href="/admin/costing"]').first().click();
    await expect(page).toHaveURL(/\/admin\/costing$/);
  });

  test('costing step 1 requires mandatory fields before moving next', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Costing' }).click();
    await expect(page).toHaveURL(/\/admin\/costing\/add$/);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page).toHaveURL(/\/admin\/costing\/add$/);
  });
});
