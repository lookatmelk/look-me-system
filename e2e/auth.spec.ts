import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

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
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\//);
  });

  test('unauthenticated user is redirected to login when accessing admin', async ({ page }) => {
    await page.goto('/admin/suppliers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to API returns 401', async ({ page }) => {
    const start = Date.now();
    const response = await page.request.get('/api/suppliers');
    const durationMs = Date.now() - start;
    expect(response.status()).toBe(401);
    expect(durationMs).toBeLessThan(1500);
  });
});
