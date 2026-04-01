import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueValue } from './helpers';

test.describe('Shops Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/shops');
  });

  test('Shops management page loads correctly', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Shop Management');
    await expect(page.locator('button:has-text("Add Shop")')).toBeVisible();
    
    // Grid or Table of shops should be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('Clicking Add Shop opens the creation form modal', async ({ page }) => {
    const addShopBtn = page.locator('button:has-text("Add Shop")');
    await addShopBtn.click();
    
    // Dialog should appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Add New Shop');
    
    // Modal should have core inputs
    await expect(modal.locator('input[name="name"]')).toBeVisible();
    await expect(modal.locator('input[name="location"]')).toBeVisible();
    await expect(modal.locator('input[name="manager"]')).toBeVisible();
    
    // Close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });
  
  test('Shop search bar works correctly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search by name, location or manager..."]');
    await expect(searchInput).toBeVisible();
    const value = uniqueValue('shop-search');
    await searchInput.fill(value);
    await expect(searchInput).toHaveValue(value);
  });

  test('shop drawer validates required name', async ({ page }) => {
    await page.locator('button:has-text("Add Shop")').click();
    const modal = page.locator('[role="dialog"]');
    await modal.getByRole('button', { name: 'Create Shop' }).click();
    await expect(modal.locator('text=Shop name is required')).toBeVisible();
  });
});
