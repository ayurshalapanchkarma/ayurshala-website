# Inventory Module E2E Test Suite - Quick Start Guide

## 🚀 Quick Start

### One-Command Setup & Test

```bash
# macOS/Linux
./run-tests.sh all

# Windows
run-tests.bat all
```

### Individual Test Suites

```bash
# Masters (Products, Categories, Suppliers, etc.)
./run-tests.sh masters

# Purchase Orders
./run-tests.sh po

# GRN & Adjustments
./run-tests.sh grn

# Reports (8 report pages)
./run-tests.sh reports

# API Validation
./run-tests.sh api

# Comprehensive validation (full module)
./run-tests.sh comprehensive
```

## 📋 What Gets Tested

### ✅ Masters Module
- [x] Products CRUD
- [x] Categories CRUD
- [x] Suppliers CRUD
- [x] Units list & display
- [x] Manufacturers list & display
- [x] Search functionality
- [x] Empty state handling

### ✅ Purchase Flow
- [x] Purchase Orders creation
- [x] Add/remove line items
- [x] Form validation
- [x] Modal open/close
- [x] List display & pagination

### ✅ Stock Operations
- [x] GRN (Goods Receipt Note) creation
- [x] Stock Adjustment creation
- [x] Batch tracking
- [x] Validation

### ✅ Stock Pages
- [x] Current Stock
- [x] Stock Movements/Transactions
- [x] Stock Ledger
- [x] Batches
- [x] Low Stock alerts
- [x] Expiring Stock

### ✅ Reports (8 Pages)
- [x] Current Stock Report
- [x] Stock Movement Report
- [x] Inventory Valuation
- [x] Purchase Register
- [x] Batch Report
- [x] Expiry Report
- [x] Low Stock Report
- [x] Dead Stock Report

**Each Report Validated For:**
- Page loads (no 404)
- No runtime errors
- Data displays
- Filters work
- Empty state handled
- Export buttons available

### ✅ API Endpoints
- [x] GET endpoints return 200
- [x] Response structure validation
- [x] Error handling
- [x] Status codes correct

### ✅ UI/UX
- [x] No console errors
- [x] No unhandled promise rejections
- [x] Buttons enabled/visible
- [x] Modals render completely
- [x] Forms submit correctly
- [x] Navigation works
- [x] Tables display data
- [x] Pagination functions
- [x] Search filters work
- [x] Network requests successful

## 🖥️ Prerequisites

```bash
# Check Node.js (need 18+)
node -v

# Check npm
npm -v

# If needed, install Node.js from https://nodejs.org
```

## 📦 Installation

```bash
# Clone or navigate to project
cd ~/Documents/ayurshala-website

# Install dependencies
npm install

# Install Playwright (if not already installed)
npm install -D @playwright/test
```

## 🧪 Running Tests

### Via Script (Recommended)

```bash
# All tests
./run-tests.sh all

# Specific test suite
./run-tests.sh masters

# With visible browser
./run-tests.sh headed

# UI mode (interactive)
./run-tests.sh ui

# Debug mode
./run-tests.sh debug

# View results
./run-tests.sh report
```

### Via npm Commands

```bash
# All tests
npm run test:inventory

# Specific modules
npm run test:masters
npm run test:purchase-orders
npm run test:grn
npm run test:reports
npm run test:api
npm run test:comprehensive

# With options
npm run test:inventory -- --ui
npm run test:inventory -- --headed
npm run test:inventory -- --debug
```

### Direct Playwright Commands

```bash
# All tests
npx playwright test

# Specific file
npx playwright test tests/e2e/02-purchase-orders.spec.ts

# Specific test
npx playwright test -g "should create purchase order"

# Watch mode
npx playwright test --watch
```

## 📊 Test Results

### Console Output

```
✓ should open categories page without errors (1.2s)
✓ should display categories in a table (0.8s)
✓ should allow search functionality (1.5s)
✓ Categories API: 200

6 passed (5.2s)
```

### HTML Report

```bash
npm run test:inventory:report
```

Opens interactive report showing:
- ✓ Passed tests (green)
- ✗ Failed tests (red) with screenshots
- Timeline of execution
- Network activity
- Console logs
- Video recordings (failed tests)

## 🐛 Troubleshooting

### Issue: "Port 3000 already in use"

```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
BASE_URL=http://localhost:3001 npm run test:inventory
```

### Issue: "Element not found"

This usually means:
1. Page didn't load properly
2. Element selector changed
3. JavaScript error prevented rendering

**Solution:**
```bash
npm run test:inventory:debug
# Use Playwright Inspector to find elements
```

### Issue: "Tests timeout"

```bash
# Increase timeout
npm run test:inventory -- --timeout=60000

# Or run with headed to see what's happening
npm run test:inventory -- --headed
```

### Issue: "Authentication required (401)"

Some tests might fail with 401 if:
- Supabase auth not configured
- Session expired
- API requires auth

**Current behavior**: Tests accept 401 as valid (API exists but auth required)

## 📈 Test Execution Times

| Test Suite | Time |
|-----------|------|
| Masters | ~1 min |
| Purchase Orders | ~2 min |
| GRN | ~1 min |
| Stock | ~1 min |
| Reports | ~2 min |
| API | ~30 sec |
| Comprehensive | ~1 min |
| **Total** | **~5-10 min** |

## 🔄 CI/CD Integration

### GitHub Actions

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

### Before Deploying

```bash
# Run full test suite
npm run test:inventory:ci

# If all pass, safe to deploy
# If failures, fix before deploy
```

## 📚 Test Files Location

```
tests/
├── e2e/
│   ├── 01-masters.spec.ts              # 6 test suites, 25+ tests
│   ├── 02-purchase-orders.spec.ts      # 6 test suites, 18+ tests
│   ├── 03-grn-adjustments.spec.ts      # 10 test suites, 20+ tests
│   ├── 04-stock-reports.spec.ts        # 24 test suites, 50+ tests
│   ├── 05-api-validation.spec.ts       # 12 test suites, 15+ tests
│   └── 06-comprehensive-validation.spec.ts  # 10 test suites, 20+ tests
├── fixtures.ts                          # Test utilities
└── README.md                            # Detailed documentation
```

**Total**: ~6 test suites with ~150+ individual tests

## 🎯 What Each Test Validates

### Masters Tests
```
✓ Page loads (no 404)
✓ Table displays
✓ Search works
✓ Empty state handled
✓ No console errors
```

### Purchase Order Tests
```
✓ Button visible & enabled
✓ Modal opens
✓ Form validates
✓ Items can be added/removed
✓ Submission sends correct data
✓ List updates after create
✓ Pagination works
```

### Report Tests (Per Report)
```
✓ Route loads (200 status)
✓ Page header visible
✓ Table displays
✓ Filters functional
✓ Empty state handled
✓ Export button available
✓ No runtime errors
```

### API Tests
```
✓ Status codes correct (200, 201)
✓ Response has proper structure
✓ No 404s on valid endpoints
✓ Error responses handled
```

## 💡 Tips

1. **Run tests regularly**: After any changes to inventory module
2. **Use UI mode for debugging**: `npm run test:inventory:ui`
3. **Check HTML report**: Always review failed tests in report
4. **Watch mode for development**: `npx playwright test --watch`
5. **Filter tests**: `npx playwright test -g "keyword"`

## 📞 Support

For issues:
1. Check `playwright-report/` folder for details
2. Review error screenshots in report
3. Check test file comments for test intent
4. Run with `--debug` flag to inspect

---

**Ready to test?**

```bash
# macOS/Linux
./run-tests.sh all

# Windows
run-tests.bat all
```

**View results:**

```bash
npm run test:inventory:report
```

