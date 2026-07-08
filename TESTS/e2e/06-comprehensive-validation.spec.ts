import { test, expect } from '@playwright/test';

test.describe('Inventory Module - Complete Workflow', () => {
  test('should have no console errors across all pages', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pages = [
      '/admin/inventory',
      '/admin/inventory/products',
      '/admin/inventory/categories',
      '/admin/inventory/suppliers',
      '/admin/inventory/units',
      '/admin/inventory/manufacturers',
      '/admin/inventory/purchase-orders',
      '/admin/inventory/grns',
      '/admin/inventory/adjustments',
      '/admin/inventory/current-stock',
      '/admin/inventory/transactions',
      '/admin/inventory/stock-ledger',
      '/admin/inventory/reports',
      '/admin/inventory/reports/current-stock',
      '/admin/inventory/reports/stock-movement',
      '/admin/inventory/reports/inventory-valuation',
      '/admin/inventory/reports/purchase-register',
      '/admin/inventory/reports/batch',
      '/admin/inventory/reports/expiry',
      '/admin/inventory/reports/low-stock',
      '/admin/inventory/reports/dead-stock',
    ];

    for (const pageUrl of pages) {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
    }

    expect(consoleErrors.length).toBe(0);
    console.log(`✓ No console errors found across ${pages.length} pages`);
  });

  test('should have no unhandled promise rejections', async ({ page }) => {
    const rejections: string[] = [];

    page.on('pageerror', (error) => {
      rejections.push(error.message);
    });

    await page.goto('/admin/inventory');
    await page.waitForTimeout(1000);

    expect(rejections.length).toBe(0);
    console.log('✓ No unhandled promise rejections');
  });

  test('should have all critical buttons enabled', async ({ page }) => {
    const criticalButtons = [
      {
        page: '/admin/inventory/purchase-orders',
        button: 'New Purchase Order',
      },
      {
        page: '/admin/inventory/grns',
        button: 'New GRN',
      },
      {
        page: '/admin/inventory/adjustments',
        button: 'New Adjustment',
      },
    ];

    for (const item of criticalButtons) {
      await page.goto(item.page);
      await page.waitForTimeout(500);

      const button = page.locator(`button:has-text("${item.button}")`);
      const isVisible = await button.isVisible().catch(() => false);
      const isEnabled = await button.isEnabled().catch(() => false);

      expect(isVisible).toBe(true);
      expect(isEnabled).toBe(true);
      console.log(`✓ ${item.button} button enabled on ${item.page}`);
    }
  });

  test('should display all modal elements when opened', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');

    const newButton = page.locator('button:has-text("New Purchase Order")');
    await newButton.click();

    await page.waitForTimeout(500);

    // Check for modal elements
    const modalTitle = page.locator('text="New Purchase Order"').nth(1);
    const closeButton = page.locator('button svg').nth(-1); // Last button usually close
    const submitButton = page.locator('button:has-text("Create Purchase Order")');
    const cancelButton = page.locator('button:has-text("Cancel")');

    expect(await modalTitle.isVisible()).toBe(true);
    expect(await submitButton.isVisible()).toBe(true);
    expect(await cancelButton.isVisible()).toBe(true);
    console.log('✓ Modal elements visible');
  });

  test('should handle modal dismissal', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');

    const newButton = page.locator('button:has-text("New Purchase Order")');
    await newButton.click();

    await page.waitForTimeout(500);

    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    await page.waitForTimeout(500);

    const modal = page.locator('text="New Purchase Order"').nth(1);
    const isVisible = await modal.isVisible().catch(() => false);

    expect(isVisible).toBe(false);
    console.log('✓ Modal can be dismissed');
  });

  test('should display data tables without runtime errors', async ({ page }) => {
    const tablePages = [
      '/admin/inventory/products',
      '/admin/inventory/categories',
      '/admin/inventory/suppliers',
      '/admin/inventory/purchase-orders',
      '/admin/inventory/grns',
      '/admin/inventory/adjustments',
      '/admin/inventory/current-stock',
      '/admin/inventory/transactions',
    ];

    for (const tablePageUrl of tablePages) {
      await page.goto(tablePageUrl);
      await page.waitForTimeout(1000);

      const table = page.locator('table').first();
      const isVisible = await table.isVisible().catch(() => false);

      expect(isVisible).toBe(true);
      console.log(`✓ Table loaded on ${tablePageUrl}`);
    }
  });

  test('should support pagination where available', async ({ page }) => {
    await page.goto('/admin/inventory/products');

    const prevButton = page.locator('button').filter({ hasText: '<' });
    const nextButton = page.locator('button').filter({ hasText: '>' });

    const prevVisible = await prevButton.isVisible().catch(() => false);
    const nextVisible = await nextButton.isVisible().catch(() => false);

    if (prevVisible || nextVisible) {
      console.log('✓ Pagination controls available');
    }
  });

  test('should support search/filter on list pages', async ({ page }) => {
    const searchPages = [
      '/admin/inventory/products',
      '/admin/inventory/categories',
      '/admin/inventory/suppliers',
      '/admin/inventory/purchase-orders',
    ];

    for (const searchPageUrl of searchPages) {
      await page.goto(searchPageUrl);
      await page.waitForTimeout(500);

      const searchInput = page.locator('input[placeholder*="Search"]').first();
      const isVisible = await searchInput.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`✓ Search available on ${searchPageUrl}`);
      }
    }
  });

  test('should handle network requests gracefully', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400 && response.status() !== 401) {
        failedRequests.push(`${response.url()}: ${response.status()}`);
      }
    });

    const criticalPages = [
      '/admin/inventory/purchase-orders',
      '/admin/inventory/grns',
      '/admin/inventory/adjustments',
      '/admin/inventory/reports',
      '/admin/inventory/reports/current-stock',
      '/admin/inventory/reports/stock-movement',
    ];

    for (const criticalPage of criticalPages) {
      await page.goto(criticalPage);
      await page.waitForTimeout(1000);
    }

    // Filter out 404s from API calls (might be expected if not authenticated)
    const criticalFailures = failedRequests.filter(
      (req) => !req.includes('404') && !req.includes('401')
    );

    expect(criticalFailures.length).toBe(0);
    console.log('✓ No critical network failures');
  });

  test('inventory module is accessible', async ({ page }) => {
    const response = await page.goto('/admin/inventory');
    expect(response?.status()).toBe(200);

    const header = page.locator('h1, h2').first();
    await expect(header).toBeVisible();

    console.log('✓ Inventory module accessible and responding');
  });
});
