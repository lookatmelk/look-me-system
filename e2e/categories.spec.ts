import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'admin@lookatme.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/admin/**');
}

test.describe('Categories Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/categories');
  });

  test('categories page loads and shows table', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Categories');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('#add-category-btn')).toBeVisible();
  });

  test('clicking Add Category opens a drawer', async ({ page }) => {
    await page.click('#add-category-btn');
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 3000 });
    await expect(drawer.locator('h2')).toContainText('Add Category');
  });

  test('drawer closes when Cancel is clicked', async ({ page }) => {
    await page.click('#add-category-btn');
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(drawer).not.toBeVisible({ timeout: 1000 });
  });

  test('drawer form contains name and description fields', async ({ page }) => {
    await page.click('#add-category-btn');
    await expect(page.locator('#category-form input[name="name"]')).toBeVisible();
    await expect(page.locator('#category-form textarea[name="description"]')).toBeVisible();
  });
});
