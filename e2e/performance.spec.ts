import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Performance Checks', () => {
  test('admin pages render within budget', async ({ page }) => {
    await loginAsAdmin(page);

    const routes = [
      '/admin/dashboard',
      '/admin/purchasing',
      '/admin/orders',
      '/admin/costing',
      '/admin/suppliers',
      '/admin/categories',
      '/admin/shops',
    ];

    for (const route of routes) {
      const start = Date.now();
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible();
      const durationMs = Date.now() - start;

      // Budget is intentionally moderate to reduce flakes on shared CI runners.
      expect(durationMs).toBeLessThan(5000);
    }
  });

  test('key authenticated APIs respond quickly', async ({ page }) => {
    await loginAsAdmin(page);

    const endpoints = [
      '/api/orders',
      '/api/purchasing',
      '/api/costing',
      '/api/suppliers',
      '/api/categories',
      '/api/shops',
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await page.request.get(endpoint);
      const durationMs = Date.now() - start;

      expect(response.ok()).toBeTruthy();
      expect(durationMs).toBeLessThan(2500);
    }
  });
});
