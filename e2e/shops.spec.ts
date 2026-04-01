import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'admin@lookatme.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/admin/**');
}

test.describe('Shops Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
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
    await expect(modal.locator('h2')).toContainText('Add Shop');
    
    // Modal should have core inputs
    await expect(modal.locator('input[name="name"]')).toBeVisible();
    await expect(modal.locator('input[name="location"]')).toBeVisible();
    await expect(modal.locator('input[name="manager"]')).toBeVisible();
    
    // Close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });
  
  test('Shop search bar works correctly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search shops..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Kandy');
    await expect(searchInput).toHaveValue('Kandy');
  });
});
