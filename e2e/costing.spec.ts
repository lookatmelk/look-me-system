import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'admin@lookatme.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/admin/**');
}

test.describe('Costing Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/costing');
  });

  test('Costing list page loads and shows the data table', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Costing');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Add Costing')).toBeVisible();
  });

  test('"Add Costing" navigates to the multi-step /add page', async ({ page }) => {
    await page.click('text=Add Costing');
    await expect(page).toHaveURL(/\/admin\/costing\/add$/);
    await expect(page.locator('h1')).toContainText('Add Costing Record');
    
    // Verify steps are visible
    await expect(page.locator('text=Step 1')).toBeVisible();
    await expect(page.locator('text=Step 2')).toBeVisible();
  });

  test('Back link on Add Costing page returns to list', async ({ page }) => {
    await page.click('text=Add Costing');
    // Click the back link specifically (href to /admin/costing)
    await page.locator('a[href="/admin/costing"]').first().click();
    await expect(page).toHaveURL(/\/admin\/costing$/);
  });
});
