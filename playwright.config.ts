import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 45_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    env: {
      ...process.env,
      ADMIN_EMAIL: 'admin@lookatme.com',
      AUTH_SECRET: 'e2e-local-secret',
      ADMIN_PASSWORD_HASH: '$2b$10$K3PIJcQQLM3P2zZpa4YW5eMMvnvu8eKvKh2Giap9ZR0QwGwvavIXC',
    },
  },
});
