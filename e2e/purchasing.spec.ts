import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Purchasing Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/purchasing');
  });

  test('purchasing page loads and shows table', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Purchasing');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('#add-purchase-btn')).toBeVisible();
  });

  test('"Add Purchase" navigates to dedicated /add page (NOT a modal)', async ({ page }) => {
    await page.click('#add-purchase-btn');
    await expect(page).toHaveURL(/\/admin\/purchasing\/add$/);

    // No drawer/dialog should appear as the form is on a full page.
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('h1')).toContainText('Add Purchase Record');
  });

  test('Add Purchase page has all 3 sections', async ({ page }) => {
    await page.click('#add-purchase-btn');
    await expect(page.locator('text=Details & Linking')).toBeVisible();
    await expect(page.locator('text=Quantities & Rates')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
  });

  test('Add Purchase page shows auto-calculated amount', async ({ page }) => {
    await page.click('#add-purchase-btn');
    await page.fill('input[name="qty"]', '10');
    await page.fill('input[name="rate"]', '250');
    await expect(page.locator('text=2,500.00')).toBeVisible({ timeout: 2000 });
  });

  test('add purchase form shows required field errors', async ({ page }) => {
    await page.click('#add-purchase-btn');
    await page.locator('#add-purchase-form button[type="submit"]').click();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });

  test('Cancel on Add Purchase page returns to purchasing list', async ({ page }) => {
    await page.click('#add-purchase-btn');
    await expect(page).toHaveURL(/\/admin\/purchasing\/add/);
    await page.click('a[href="/admin/purchasing"]');
    await expect(page).toHaveURL(/\/admin\/purchasing$/);
  });

  test('Back arrow on Add Purchase page returns to list', async ({ page }) => {
    await page.click('#add-purchase-btn');
    await page.locator('a[href="/admin/purchasing"]').first().click();
    await expect(page).toHaveURL(/\/admin\/purchasing$/);
  });
});
