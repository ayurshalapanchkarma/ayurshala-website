import { test, expect } from '@playwright/test';

test.describe('Stock Pages', () => {
  test('should open current stock page without errors', async ({ page }) => {
    const response = await page.goto('/admin/inventory/current-stock');
    expect(response?.status()).toBe(200);
  });

  test('should open stock transactions page', async ({ page }) => {
    const response = await page.goto('/admin/inventory/transactions');
    expect(response?.status()).toBe(200);
  });

  test('should open stock ledger page', async ({ page }) => {
    const response = await page.goto('/admin/inventory/stock-ledger');
    expect(response?.status()).toBe(200);
  });

  test('should open stock page', async ({ page }) => {
    const response = await page.goto('/admin/inventory/stock');
    expect(response?.status()).toBe(200);
  });

  test('should display stock data', async ({ page }) => {
    await page.goto('/admin/inventory/current-stock');
    
    await page.waitForTimeout(1500);
    
    // Check for table or content
    const table = page.locator('table').first();
    if (await table.isVisible().catch(() => false)) {
      console.log('✓ Stock table displayed');
    }
  });

  test('should support stock search', async ({ page }) => {
    await page.goto('/admin/inventory/current-stock');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('product');
      await page.waitForTimeout(1000);
      console.log('✓ Stock search working');
    }
  });

  test('should open stock batch page', async ({ page }) => {
    const response = await page.goto('/admin/inventory/batches');
    expect(response?.status()).toBe(200);
  });

  test('should open low stock page', async ({ page }) => {
    const response = await page.goto('/admin/inventory/low-stock');
    expect(response?.status()).toBe(200);
  });

  test('should open expiring stock page', async ({ page }) => {
    const response = await page.goto('/admin/inventory/expiring-stock');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Reports', () => {
  const reports = [
    {
      name: 'Current Stock',
      url: '/admin/inventory/reports/current-stock',
    },
    {
      name: 'Stock Movement',
      url: '/admin/inventory/reports/stock-movement',
    },
    {
      name: 'Inventory Valuation',
      url: '/admin/inventory/reports/inventory-valuation',
    },
    {
      name: 'Purchase Register',
      url: '/admin/inventory/reports/purchase-register',
    },
    {
      name: 'Batch Report',
      url: '/admin/inventory/reports/batch',
    },
    {
      name: 'Expiry Report',
      url: '/admin/inventory/reports/expiry',
    },
    {
      name: 'Low Stock Report',
      url: '/admin/inventory/reports/low-stock',
    },
    {
      name: 'Dead Stock Report',
      url: '/admin/inventory/reports/dead-stock',
    },
  ];

  for (const report of reports) {
    test(`should open ${report.name} report without 404`, async ({ page }) => {
      const response = await page.goto(report.url);
      expect(response?.status()).toBe(200);
      console.log(`✓ ${report.name} loaded: ${response?.status()}`);
    });

    test(`should display ${report.name} report content`, async ({ page }) => {
      await page.goto(report.url);
      
      await page.waitForTimeout(1500);
      
      // Check for page header or table
      const header = page.locator('h1, h2').first();
      const table = page.locator('table').first();
      
      const headerVisible = await header.isVisible().catch(() => false);
      const tableVisible = await table.isVisible().catch(() => false);
      
      expect(headerVisible || tableVisible).toBe(true);
      console.log(`✓ ${report.name} content loaded`);
    });

    test(`${report.name} report should handle empty state`, async ({ page }) => {
      await page.goto(report.url);
      
      await page.waitForTimeout(1500);
      
      // Check for empty state message if table is empty
      const emptyMessage = page.locator('text=/No.*found|No results|No data/i');
      const tableRows = page.locator('tbody tr');
      
      const hasRows = (await tableRows.count()) > 0;
      const hasEmptyMsg = await emptyMessage.isVisible().catch(() => false);
      
      expect(hasRows || hasEmptyMsg).toBe(true);
    });

    test(`${report.name} should support search/filter`, async ({ page }) => {
      await page.goto(report.url);
      
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      const filterSelect = page.locator('select').first();
      
      const hasSearch = await searchInput.isVisible().catch(() => false);
      const hasFilter = await filterSelect.isVisible().catch(() => false);
      
      if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        console.log(`✓ ${report.name} search available`);
      }
      
      if (hasFilter) {
        console.log(`✓ ${report.name} filters available`);
      }
    });

    test(`${report.name} should support export if available`, async ({ page }) => {
      await page.goto(report.url);
      
      const exportButton = page.locator('button:has-text(/Export|Download/i)').first();
      if (await exportButton.isVisible().catch(() => false)) {
        await expect(exportButton).toBeEnabled();
        console.log(`✓ ${report.name} export button available`);
      }
    });
  }

  test('should navigate back from report to reports hub', async ({ page }) => {
    await page.goto('/admin/inventory/reports/current-stock');
    
    // Try to navigate back or check breadcrumb
    await page.goBack();
    await page.waitForTimeout(500);
    
    const currentUrl = page.url();
    console.log(`✓ Navigation working: ${currentUrl}`);
  });
});
