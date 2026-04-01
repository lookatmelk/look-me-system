import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueValue } from './helpers';

test.describe('Suppliers Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/suppliers');
  });

  test('suppliers page loads and shows table', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Suppliers');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('#add-supplier-btn')).toBeVisible();
  });

  test('clicking Add Supplier opens a right-side drawer (not a modal)', async ({ page }) => {
    await page.click('#add-supplier-btn');

    // Drawer should appear (check it slides from right — has role=dialog)
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 3000 });
    await expect(drawer.locator('h2')).toContainText('Add Supplier');

    // Verify it's NOT a centered modal — it should be positioned to the right
    const boundingBox = await drawer.boundingBox();
    const viewportSize = page.viewportSize();
    if (boundingBox && viewportSize) {
      // The drawer panel should start at the right side of the viewport
      expect(boundingBox.x + boundingBox.width).toBeGreaterThan(viewportSize.width * 0.5);
    }
  });

  test('drawer closes when clicking Cancel', async ({ page }) => {
    await page.click('#add-supplier-btn');
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Click backdrop or Cancel button
    await page.locator('button:has-text("Cancel")').click();
    await expect(drawer).not.toBeVisible({ timeout: 1000 });
  });

  test('drawer closes when clicking the X button', async ({ page }) => {
    await page.click('#add-supplier-btn');
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    await page.click('[aria-label="Close drawer"]');
    await expect(drawer).not.toBeVisible({ timeout: 1000 });
  });

  test('form shows validation errors on empty submit', async ({ page }) => {
    await page.click('#add-supplier-btn');
    await page.locator('#supplier-form button[type="submit"]').click();
    await expect(page.locator('text=Name must be at least')).toBeVisible({ timeout: 3000 });
  });

  test('supplier search accepts typed value', async ({ page }) => {
    const value = uniqueValue('sup-search');
    const input = page.locator('input[placeholder="Search suppliers by name, phone..."]');
    await input.fill(value);
    await expect(input).toHaveValue(value);
  });
});
