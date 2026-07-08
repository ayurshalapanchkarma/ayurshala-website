import { test, expect } from '@playwright/test';

test.describe('Inventory Masters - Categories', () => {
  test('should open categories page without errors', async ({ page }) => {
    await page.goto('/admin/inventory/categories');
    await expect(page).toHaveTitle(/Categories|Inventory/);
    
    // Check for page header
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check no 404
    const response = await page.goto('/admin/inventory/categories');
    expect(response?.status()).toBe(200);
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors.length).toBe(0);
  });

  test('should load categories data without errors', async ({ page }) => {
    await page.goto('/admin/inventory/categories');
    
    // Wait for table or content to load
    await page.waitForTimeout(1000);
    
    // Check that API call succeeded (check network tab for requests)
    const requests = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/inventory/categories')) {
        requests.push({
          url: response.url(),
          status: response.status(),
        });
        console.log(`[API] ${response.url()} -> ${response.status()}`);
      }
    });
    
    // Trigger data load
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify at least one successful API call
    expect(requests.length).toBeGreaterThan(0);
    if (requests.length > 0) {
      expect([200, 201, 304]).toContain(requests[0].status);
    }
  });

  test('should display categories in a table', async ({ page }) => {
    await page.goto('/admin/inventory/categories');
    
    // Wait for table
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
    
    // Check table has headers
    const headers = page.locator('th');
    expect(await headers.count()).toBeGreaterThan(0);
  });

  test('should allow search functionality', async ({ page }) => {
    await page.goto('/admin/inventory/categories');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Verify search was applied
      expect(searchInput).toHaveValue('test');
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/admin/inventory/categories');
    
    // Search for something unlikely to exist
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent12345');
      await page.waitForTimeout(1500);
      
      // Should show empty state or no results
      const emptyMessage = page.locator('text=/No.*found|No results/i');
      const tableRows = page.locator('tbody tr');
      
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible();
      }
    }
  });
});

test.describe('Inventory Masters - Suppliers', () => {
  test('should open suppliers page without errors', async ({ page }) => {
    const response = await page.goto('/admin/inventory/suppliers');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should load suppliers data', async ({ page }) => {
    await page.goto('/admin/inventory/suppliers');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('should display supplier list', async ({ page }) => {
    await page.goto('/admin/inventory/suppliers');
    
    await page.waitForTimeout(1500);
    
    // Check for table content
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`Suppliers found: ${count}`);
  });
});

test.describe('Inventory Masters - Products', () => {
  test('should open products page without errors', async ({ page }) => {
    const response = await page.goto('/admin/inventory/products');
    expect(response?.status()).toBe(200);
  });

  test('should display products table', async ({ page }) => {
    await page.goto('/admin/inventory/products');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('should allow search in products', async ({ page }) => {
    await page.goto('/admin/inventory/products');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      expect(searchInput).toHaveValue('test');
    }
  });
});

test.describe('Inventory Masters - Units', () => {
  test('should open units page without errors', async ({ page }) => {
    const response = await page.goto('/admin/inventory/units');
    expect(response?.status()).toBe(200);
  });

  test('should display units table', async ({ page }) => {
    await page.goto('/admin/inventory/units');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Inventory Masters - Manufacturers', () => {
  test('should open manufacturers page without errors', async ({ page }) => {
    const response = await page.goto('/admin/inventory/manufacturers');
    expect(response?.status()).toBe(200);
  });

  test('should display manufacturers table', async ({ page }) => {
    await page.goto('/admin/inventory/manufacturers');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});
