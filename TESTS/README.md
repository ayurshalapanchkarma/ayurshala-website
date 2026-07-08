# Inventory Module E2E Test Suite

Comprehensive end-to-end test suite for the Ayurshala Inventory Module using Playwright.

## Overview

This test suite validates:

- **Masters**: Products, Categories, Units, Manufacturers, Suppliers
- **Purchase Flow**: Purchase Orders, GRN, Stock Adjustments
- **Stock Management**: Current Stock, Movements, Ledger, Batches
- **Reports**: 8 comprehensive inventory reports
- **API Endpoints**: All inventory APIs
- **UI/UX**: Buttons, modals, forms, navigation, error handling

## Test Structure

```
tests/
├── e2e/
│   ├── 01-masters.spec.ts              # Masters CRUD tests
│   ├── 02-purchase-orders.spec.ts      # Purchase Order workflows
│   ├── 03-grn-adjustments.spec.ts      # GRN and Stock Adjustment tests
│   ├── 04-stock-reports.spec.ts        # Stock pages and reports
│   ├── 05-api-validation.spec.ts       # API endpoint validation
│   └── 06-comprehensive-validation.spec.ts  # Full module validation
├── fixtures.ts                          # Test fixtures and helpers
└── README.md                            # This file
```

## Prerequisites

1. **Node.js** 18+ installed
2. **npm** or **yarn**
3. Application running locally or deployed

## Installation

```bash
# Install Playwright and dependencies
npm install -D @playwright/test

# Or with yarn
yarn add -D @playwright/test
```

## Configuration

### Environment Variables

Create a `.env.test` file:

```bash
BASE_URL=http://localhost:3000
HEADED=false  # Set to true to see browser
```

### Playwright Config

Edit `playwright.config.ts`:

```typescript
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:inventory

# Run specific test file
npx playwright test tests/e2e/01-masters.spec.ts

# Run with UI mode
npx playwright test --ui

# Run with headed browser (see browser)
npx playwright test --headed
```

### CI/CD Pipeline

```bash
# In GitHub Actions or similar
npm run test:inventory:ci

# With coverage
npm run test:inventory:coverage
```

### Test Selection

```bash
# Run specific test suite
npx playwright test masters
npx playwright test purchase-orders
npx playwright test grn
npx playwright test reports

# Run single test
npx playwright test -g "should open categories page"

# Run tests matching pattern
npx playwright test -g "API"
```

## Test Categories

### 1. Masters (`01-masters.spec.ts`)
- Categories: CRUD operations
- Suppliers: List, search, display
- Products: List, search, filters
- Units: List and display
- Manufacturers: List and display

**Expected**: All pages load, tables display, search works

### 2. Purchase Orders (`02-purchase-orders.spec.ts`)
- Open PO page
- Display PO button
- Open creation modal
- Form validation
- Create PO with line items
- Display PO list
- Search and filter
- Pagination

**Expected**: Modal opens, form validates, PO created, list updates

### 3. GRN & Adjustments (`03-grn-adjustments.spec.ts`)
- Open GRN page
- Create GRN with items
- Open adjustment page
- Create stock adjustment
- Validation
- List display

**Expected**: Modals functional, records created, lists updated

### 4. Stock & Reports (`04-stock-reports.spec.ts`)
- Stock pages: Current, Transactions, Ledger, Batches
- Low stock and expiring stock
- 8 Report pages:
  - Current Stock Report
  - Stock Movement Report
  - Inventory Valuation
  - Purchase Register
  - Batch Report
  - Expiry Report
  - Low Stock Report
  - Dead Stock Report

**Expected**: All pages load (200), tables display, filters work, empty states handled

### 5. API Validation (`05-api-validation.spec.ts`)
- GET endpoints for masters
- GET endpoints for transactions
- GET endpoints for reports
- Response structure validation
- Status code validation

**Expected**: All APIs respond with 200, proper JSON structure

### 6. Comprehensive Validation (`06-comprehensive-validation.spec.ts`)
- No console errors
- No unhandled promise rejections
- All buttons enabled
- Modal elements visible
- Modal dismissal works
- Tables load without errors
- Pagination available
- Search/filter working
- Network requests successful
- Module accessibility

**Expected**: Full module passes all checks

## Test Results

### Output Examples

**Success:**
```
✓ should open categories page without errors (1.2s)
✓ should display categories in a table (0.8s)
✓ should allow search functionality (1.5s)
✓ Categories API: 200

6 passed (5.2s)
```

**Failure:**
```
✗ should create purchase order with valid data
  Error: Timeout: waiting for response from /api/inventory/purchase-orders
  
  HTML Report: file:///path/to/test-results/index.html
```

### HTML Report

After tests complete, view results:

```bash
npx playwright show-report
```

This opens an interactive HTML report with:
- Test results
- Screenshots of failures
- Video recordings
- Network traces
- Full error logs

## API Status Codes

The tests validate:

| Endpoint | Expected Status | Notes |
|----------|-----------------|-------|
| GET /api/inventory/* | 200, 401 | 401 if auth required |
| POST /api/inventory/* | 201 | Created |
| PUT/PATCH /api/inventory/* | 200 | Updated |
| DELETE /api/inventory/* | 200 | Deleted |
| Non-existent routes | NOT 404 | Should not 404 |

## Troubleshooting

### Test Timeouts

**Problem**: Tests timeout waiting for elements

**Solution**:
```bash
# Increase timeout
npx playwright test --timeout=60000

# Or in specific test
await expect(element).toBeVisible({ timeout: 10000 });
```

### Authentication Issues

**Problem**: Tests fail with 401 Unauthorized

**Solution**: 
- Set up Supabase auth tokens in fixtures
- Mock authentication in test setup
- Use public APIs only

### Element Not Found

**Problem**: Selector not matching elements

**Solution**:
```bash
# Debug mode to inspect elements
npx playwright test --debug

# Use codegen to generate selectors
npx playwright codegen http://localhost:3000
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
name: Inventory Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:inventory:ci
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
inventory-tests:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm ci
    - npm run test:inventory:ci
  artifacts:
    paths:
      - playwright-report/
    when: always
```

## Best Practices

1. **Use selectors wisely**: Prefer data-testid > role > text
2. **Wait for elements**: Use proper wait strategies
3. **Handle dynamic content**: Wait for API responses
4. **Clean up**: Close modals, clear forms between tests
5. **Parallel execution**: Use appropriate worker count
6. **Debugging**: Use `--debug` flag for troubleshooting

## Common Issues & Solutions

### Issue: "Browser crashed"

```bash
# Disable GPU rendering
npx playwright test --disable-gpu
```

### Issue: "Port 3000 already in use"

```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
BASE_URL=http://localhost:3001 npm run test:inventory
```

### Issue: "Flaky tests"

```bash
# Add retry logic
test.describe.configure({ retries: 2 });

# Add wait times
await page.waitForTimeout(500);
```

## Maintenance

### Updating Tests

When UI changes:

1. Update selectors in affected tests
2. Re-run tests locally
3. Commit changes with updated tests
4. Verify in CI/CD

### Adding New Tests

```typescript
test('should do something', async ({ page }) => {
  await page.goto('/admin/inventory/new-page');
  
  // Your test here
  
  expect(result).toBe(true);
});
```

### Skipping Tests

```typescript
test.skip('temporarily disabled', async ({ page }) => {
  // Test code
});
```

## Performance

Test suite execution times:

- **All tests**: ~5-10 minutes
- **Masters**: ~1 minute
- **Purchase Orders**: ~2 minutes
- **Reports**: ~3 minutes
- **API Validation**: ~1 minute

Parallel execution reduces time by ~50% (use `workers: 4`)

## Support

For issues or questions:

1. Check `playwright-report/` for details
2. Review error screenshots
3. Check video recordings of failures
4. Review console logs in report

## License

Same as main project

---

**Last Updated**: 2026-07-08  
**Playwright Version**: ^1.40.0  
**Node Version**: 18+
