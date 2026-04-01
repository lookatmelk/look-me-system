import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueValue } from './helpers';

test.describe('Categories Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
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

  test('category form validates required name', async ({ page }) => {
    await page.click('#add-category-btn');
    await page.locator('#category-form button[type="submit"]').click();
    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
  });

  test('search field accepts user input', async ({ page }) => {
    const value = uniqueValue('cat-search');
    const input = page.locator('input[placeholder="Search categories by name..."]');
    await input.fill(value);
    await expect(input).toHaveValue(value);
  });
});
