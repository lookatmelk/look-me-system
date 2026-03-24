import { test, expect } from '@playwright/test';

// Helper to log in programmatically
async function login(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'admin@lookatme.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/admin/**');
}

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Welcome back');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#login-submit-btn')).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('#login-submit-btn');
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
  });

  test('successful login redirects to admin', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/admin\//);
  });

  test('unauthenticated user is redirected to login when accessing admin', async ({ page }) => {
    await page.goto('/admin/suppliers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to API returns 401', async ({ page }) => {
    const response = await page.request.get('/api/suppliers');
    expect(response.status()).toBe(401);
  });
});
