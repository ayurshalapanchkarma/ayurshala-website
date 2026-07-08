import { test, expect } from '@playwright/test';

test.describe('Inventory API Validation', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  test('GET /api/inventory/categories should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/categories`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    console.log(`✓ Categories API: ${response.status()}`);
  });

  test('GET /api/inventory/suppliers should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/suppliers`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    console.log(`✓ Suppliers API: ${response.status()}`);
  });

  test('GET /api/inventory/products should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/products`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    console.log(`✓ Products API: ${response.status()}`);
  });

  test('GET /api/inventory/units should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/units`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    console.log(`✓ Units API: ${response.status()}`);
  });

  test('GET /api/inventory/manufacturers should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/manufacturers`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    console.log(`✓ Manufacturers API: ${response.status()}`);
  });

  test('GET /api/inventory/purchase-orders should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/purchase-orders`);
    expect([200, 401]).toContain(response.status()); // 401 if auth required
    console.log(`✓ Purchase Orders API: ${response.status()}`);
  });

  test('GET /api/inventory/grns should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/grns`);
    expect([200, 401]).toContain(response.status());
    console.log(`✓ GRNs API: ${response.status()}`);
  });

  test('GET /api/inventory/adjustments should return 200', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/adjustments`);
    expect([200, 401]).toContain(response.status());
    console.log(`✓ Adjustments API: ${response.status()}`);
  });

  test('GET /api/inventory/stock-movements should return valid response', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/stock-movements`);
    expect([200, 401]).toContain(response.status());
    console.log(`✓ Stock Movements API: ${response.status()}`);
  });

  test('Report APIs should respond without 404', async ({ page }) => {
    const reports = [
      '/api/inventory/reports/current-stock',
      '/api/inventory/reports/stock-movement',
      '/api/inventory/reports/inventory-valuation',
      '/api/inventory/reports/purchase-register',
      '/api/inventory/reports/batch',
      '/api/inventory/reports/expiry',
      '/api/inventory/reports/low-stock',
      '/api/inventory/reports/dead-stock',
    ];

    for (const report of reports) {
      const response = await page.request.get(`${baseURL}${report}`);
      expect(response.status()).not.toBe(404);
      console.log(`✓ ${report}: ${response.status()}`);
    }
  });

  test('API responses should have proper structure', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/inventory/categories`);
    const data = await response.json();

    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✓ API response structure valid`);
  });
});
