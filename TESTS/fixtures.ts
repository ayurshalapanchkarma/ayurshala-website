import { test as base } from '@playwright/test';

export type TestFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication if needed
    // In a real scenario, you'd set up Supabase auth tokens
    await page.goto('/admin/inventory');
    await use(page);
  },
});

export { expect } from '@playwright/test';
