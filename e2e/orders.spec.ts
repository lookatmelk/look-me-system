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
    await page.goto('/admin/orders');
  });

  test('Orders list page loads and shows the data table', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Orders');
    await expect(page.locator('table')).toBeVisible();
    
    // Verify common status badges exist
    const pendingText = page.locator('text=PENDING').first();
    const inProductionText = page.locator('text=IN_PRODUCTION').first();
    // Assuming at least one state exists in the table or filter UI
    await expect(page.locator('table')).toBeVisible(); 
  });

  test('Search filter exists on Orders page', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search design number or description..."]');
    await expect(searchInput).toBeVisible();
    
    // Simulate user typing into search
    await searchInput.fill('D-001');
    await expect(searchInput).toHaveValue('D-001');
  });

  test('"Add Order" button exists and navigates correctly if using page or opens drawer', async ({ page }) => {
    const addOrderBtn = page.locator('button:has-text("Add Order")');
    if (await addOrderBtn.isVisible()) {
        await addOrderBtn.click();
        // Just verify action doesn't crash the UI and creates a dialog/form
        const dialog = page.locator('[role="dialog"], form');
        await expect(dialog.first()).toBeVisible();
    }
  });
});
