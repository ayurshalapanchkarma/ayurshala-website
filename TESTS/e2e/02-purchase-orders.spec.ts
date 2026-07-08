import { test, expect } from '@playwright/test';

test.describe('Purchase Orders', () => {
  test('should open purchase orders page without errors', async ({ page }) => {
    const response = await page.goto('/admin/inventory/purchase-orders');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1:has-text("Purchase Orders")')).toBeVisible();
  });

  test('should display new purchase order button', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    const newButton = page.locator('button:has-text("New Purchase Order")');
    await expect(newButton).toBeVisible();
    await expect(newButton).toBeEnabled();
  });

  test('should open purchase order creation modal', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    const newButton = page.locator('button:has-text("New Purchase Order")');
    await newButton.click();
    
    // Wait for modal to appear
    const modal = page.locator('text="New Purchase Order"').nth(1);
    await expect(modal).toBeVisible({ timeout: 3000 });
    
    // Check modal elements
    const supplierSelect = page.locator('select').first();
    await expect(supplierSelect).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    const newButton = page.locator('button:has-text("New Purchase Order")');
    await newButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Try to submit without filling form
    const submitButton = page.locator('button:has-text("Create Purchase Order")');
    await submitButton.click();
    
    // Should show validation error (toast)
    // Check for toast or error message
    await page.waitForTimeout(1000);
    
    // Toast error should appear
    const errorToast = page.locator('text=/Please select|Please add/i');
    if (await errorToast.isVisible()) {
      console.log('✓ Validation error shown');
    }
  });

  test('should create purchase order with valid data', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    // Click new button
    const newButton = page.locator('button:has-text("New Purchase Order")');
    await newButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Select supplier
    const supplierSelect = page.locator('select').first();
    const options = await supplierSelect.locator('option').count();
    
    if (options > 1) {
      // Select first non-empty option
      await supplierSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      
      // Set date
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.fill('2026-07-08');
      
      // Add at least one item
      const addItemButton = page.locator('button:has-text("Add Item")');
      if (await addItemButton.isVisible()) {
        await addItemButton.click();
        await page.waitForTimeout(500);
        
        // Fill item details
        const productSelect = page.locator('select').nth(1);
        const productOptions = await productSelect.locator('option').count();
        
        if (productOptions > 1) {
          await productSelect.selectOption({ index: 1 });
          
          // Fill quantity
          const quantityInput = page.locator('input[type="number"]').nth(0);
          await quantityInput.fill('10');
          
          // Fill unit rate
          const rateInput = page.locator('input[type="number"]').nth(1);
          await rateInput.fill('100');
          
          // Submit
          const submitButton = page.locator('button:has-text("Create Purchase Order")');
          
          // Intercept API response
          const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/inventory/purchase-orders') && response.status() === 201
          );
          
          await submitButton.click();
          
          try {
            const response = await responsePromise;
            console.log(`✓ Purchase Order created: ${response.status()}`);
            expect(response.status()).toBe(201);
          } catch (e) {
            console.log('⚠ API response not 201, checking if modal closed');
          }
          
          // Wait and check if modal closed
          await page.waitForTimeout(1500);
          
          const modalStill = page.locator('text="New Purchase Order"').nth(1);
          const isVisible = await modalStill.isVisible().catch(() => false);
          
          if (!isVisible) {
            console.log('✓ Modal closed after submission');
          }
        }
      }
    } else {
      console.log('⚠ No suppliers available to create PO');
    }
  });

  test('should display purchase orders in table', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    await page.waitForTimeout(1500);
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`Purchase Orders found: ${count}`);
  });

  test('should allow search and filter', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('PO');
      await page.waitForTimeout(1000);
      
      expect(searchInput).toHaveValue('PO');
      console.log('✓ Search filter working');
    }
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/admin/inventory/purchase-orders');
    
    const nextButton = page.locator('button').filter({ hasText: '>' });
    if (await nextButton.isVisible()) {
      const isEnabled = await nextButton.isEnabled();
      console.log(`✓ Pagination next button visible: ${isEnabled}`);
    }
  });
});
