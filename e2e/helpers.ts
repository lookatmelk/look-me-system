import { expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@lookatme.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin@1234';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.click('#login-submit-btn');

  await expect(page).toHaveURL(/\/admin\//, { timeout: 20000 });
}

export function uniqueValue(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
