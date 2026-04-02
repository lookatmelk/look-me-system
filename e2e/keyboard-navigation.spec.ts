import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Keyboard Navigation', () => {
  test('orders table supports arrow navigation, Enter open, and Delete guard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');

    const tableRegion = page.locator('#orders-table-keyboard-region');
    await expect(tableRegion).toBeVisible();

    const rows = page.locator('tr[data-kb-row-index]');
    const count = await rows.count();
    test.skip(count === 0, 'No seeded order rows available for keyboard table navigation test.');

    await tableRegion.click();
    await page.keyboard.press('Home');
    await expect(page.locator('tr[data-kb-row-index="0"][data-selected="true"]')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=Order')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    await page.keyboard.press('Delete');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('keyboard hint bar is visible on add forms', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/purchasing/add');
    await expect(page.getByRole('note', { name: 'Keyboard shortcuts' })).toBeVisible();
    await expect(page.locator('text=Ctrl/Cmd+Enter')).toBeVisible();

    await page.goto('/admin/orders/add');
    await expect(page.getByRole('note', { name: 'Keyboard shortcuts' })).toBeVisible();

    await page.goto('/admin/costing/add');
    await expect(page.getByRole('note', { name: 'Keyboard shortcuts' })).toBeVisible();
  });

  test('Ctrl/Cmd+Enter triggers submit on purchasing add form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/purchasing/add');

    const description = page.locator('textarea[name="description"]');
    await description.click();

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
    await expect(page.locator('text=Description is required')).toBeVisible();
  });
});
