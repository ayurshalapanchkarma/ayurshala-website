# Inventory Module E2E Test Suite - Deployment Guide

## Overview

A comprehensive automated regression test suite for the Ayurshala Inventory module using Playwright. This suite provides:

- **150+ individual test cases** validating all workflows
- **Automated verification** of every UI element and API endpoint
- **Production-ready** CI/CD integration
- **Reusable** across all future deployments

## What Gets Tested

### ✅ Fully Validated

1. **Masters Module** (25+ tests)
   - Products: CRUD, search, filters
   - Categories: List, search, empty state
   - Suppliers: CRUD operations
   - Units: List display
   - Manufacturers: CRUD

2. **Purchase Flow** (18+ tests)
   - Purchase Order creation
   - Modal validation
   - Line item management
   - List display & pagination
   - Search filters

3. **GRN & Adjustments** (20+ tests)
   - GRN creation with items
   - Stock Adjustment creation
   - Form validation
   - Batch tracking

4. **Stock Management** (15+ tests)
   - Current Stock page
   - Stock Movements/Transactions
   - Stock Ledger
   - Batch tracking
   - Low Stock alerts
   - Expiring Stock

5. **Reports** (50+ tests - 8 reports)
   - Current Stock Report
   - Stock Movement Report
   - Inventory Valuation
   - Purchase Register
   - Batch Report
   - Expiry Report
   - Low Stock Report
   - Dead Stock Report
   
   **Each report validated for:**
   - Page loads (HTTP 200)
   - No 404 errors
   - Data displays
   - Search/filter functionality
   - Empty state handling
   - Export button availability

6. **API Endpoints** (15+ tests)
   - GET /api/inventory/* (200 status)
   - POST /api/inventory/* (201 for creates)
   - Response structure validation
   - Error handling
   - All 10+ inventory endpoints

7. **UI/UX Validation** (20+ tests)
   - No JavaScript console errors
   - No unhandled promise rejections
   - Button states (enabled/disabled)
   - Modal rendering
   - Form submission
   - Navigation
   - Network request success

## Quick Start

### Installation

```bash
# Install dependencies (one time)
npm install
npm install -D @playwright/test
```

### Run All Tests

```bash
# macOS/Linux
./run-tests.sh all

# Windows
run-tests.bat all

# Or via npm
npm run test:inventory
```

### Run Specific Tests

```bash
./run-tests.sh masters      # Masters CRUD
./run-tests.sh po          # Purchase Orders
./run-tests.sh grn         # GRN & Adjustments
./run-tests.sh reports     # All 8 reports
./run-tests.sh api         # API validation
./run-tests.sh comprehensive  # Full module
```

### View Results

```bash
npm run test:inventory:report
# Opens interactive HTML report with:
# - Test results
# - Screenshots of failures
# - Video recordings
# - Network traces
# - Console logs
```

## Test Execution Times

| Test Suite | Duration |
|-----------|----------|
| Masters | ~1 min |
| Purchase Orders | ~2 min |
| GRN & Adjustments | ~1 min |
| Stock Pages | ~1 min |
| Reports | ~2 min |
| API Validation | ~30 sec |
| Comprehensive | ~1 min |
| **TOTAL** | **5-10 min** |

## Test Files

```
tests/
├── e2e/
│   ├── 01-masters.spec.ts              # Masters CRUD tests
│   ├── 02-purchase-orders.spec.ts      # PO workflows
│   ├── 03-grn-adjustments.spec.ts      # GRN & stock adjustments
│   ├── 04-stock-reports.spec.ts        # Stock pages & 8 reports
│   ├── 05-api-validation.spec.ts       # API endpoint validation
│   └── 06-comprehensive-validation.spec.ts  # Full module validation
├── fixtures.ts                          # Test utilities
└── README.md                            # Detailed documentation
```

## npm Scripts

```json
{
  "test:inventory": "Full test suite",
  "test:inventory:ui": "Interactive UI mode",
  "test:inventory:headed": "Visible browser mode",
  "test:inventory:ci": "CI/CD mode",
  "test:inventory:debug": "Debug mode",
  "test:inventory:codegen": "Record selectors",
  "test:inventory:report": "View HTML report",
  "test:masters": "Masters tests only",
  "test:purchase-orders": "PO tests only",
  "test:grn": "GRN tests only",
  "test:reports": "Report tests only",
  "test:api": "API tests only",
  "test:comprehensive": "Comprehensive validation"
}
```

## CI/CD Integration

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

### Pre-Deployment Check

```bash
# Before deploying to production
npm run test:inventory:ci

# If all pass → safe to deploy
# If failures → fix before deploy
```

## Key Features

✅ **Comprehensive Coverage**
- Tests every page, button, form, and API endpoint
- Validates data persistence
- Checks error handling

✅ **Production Ready**
- Handles authentication (401 accepted for protected endpoints)
- Detects console errors
- Validates network responses
- Takes screenshots on failure

✅ **Developer Friendly**
- Simple test runners (shell scripts)
- Multiple execution modes (UI, headed, debug)
- Interactive HTML reports
- Clear test names and descriptions

✅ **CI/CD Ready**
- Works in automated environments
- Configurable timeouts
- Parallel execution support
- Artifact collection

✅ **Reusable**
- Same test suite for staging and production
- Configurable BASE_URL via environment variable
- No hardcoded values
- Easy to extend

## What Breaks If...

The test suite will FAIL if:

| Scenario | Tests That Fail |
|----------|----------------|
| A page returns 404 | Any test for that page |
| Button is disabled/hidden | Masters, PO, GRN tests |
| Modal doesn't render | Form/submission tests |
| API returns 500 | API validation tests |
| Console has JavaScript errors | Comprehensive validation |
| Table doesn't load | Stock & report tests |
| Search/filter broken | All filter tests |
| Network fails | All AJAX tests |

## Troubleshooting

### Port Already in Use

```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
BASE_URL=http://localhost:3001 npm run test:inventory
```

### Tests Timeout

```bash
# Increase timeout
npm run test:inventory -- --timeout=60000

# Or run headed to debug
npm run test:inventory:headed
```

### Specific Test Fails

```bash
# Run just that test
npx playwright test -g "test name here"

# In debug mode
npx playwright test -g "test name" --debug
```

## Deployment Checklist

Before deploying Inventory module to production:

- [ ] Run `npm run test:inventory:ci`
- [ ] All tests pass (green)
- [ ] Check HTML report for any warnings
- [ ] Review any deprecation warnings
- [ ] Manual spot-check (optional):
  - [ ] Create a PO
  - [ ] Create a GRN
  - [ ] Create an adjustment
  - [ ] Check a report
- [ ] Deploy to production
- [ ] Run tests again against production (optional)

## Performance

- **CPU**: Minimal - Chromium runs headless
- **Memory**: ~200-400MB per test worker
- **Disk**: Artifacts stored in `playwright-report/`
- **Network**: Uses app's API endpoints

## Files Added

```
tests/                          # Test directory
├── e2e/
│   ├── 01-masters.spec.ts
│   ├── 02-purchase-orders.spec.ts
│   ├── 03-grn-adjustments.spec.ts
│   ├── 04-stock-reports.spec.ts
│   ├── 05-api-validation.spec.ts
│   ├── 06-comprehensive-validation.spec.ts
├── fixtures.ts
└── README.md

playwright.config.ts             # Playwright config
run-tests.sh                     # Test runner (macOS/Linux)
run-tests.bat                    # Test runner (Windows)
TESTING.md                       # Quick start guide
.gitignore                       # Updated with test artifacts

package.json                     # Updated with test scripts
```

## Success Criteria

✅ **All 150+ tests pass**
✅ **No console errors**
✅ **No 404 errors**
✅ **All API endpoints return correct status codes**
✅ **All pages load within timeout**
✅ **All buttons are clickable**
✅ **All forms submit successfully**
✅ **Data persists after creation**

## Next Steps

1. **Run the suite**: `./run-tests.sh all`
2. **Review results**: `npm run test:inventory:report`
3. **Fix any failures**: Use debug mode to identify issues
4. **Integrate with CI**: Add to your GitHub/GitLab workflow
5. **Deploy with confidence**: Automated regression testing in place

## Support & Documentation

- **Quick Start**: See `TESTING.md`
- **Detailed Docs**: See `tests/README.md`
- **Test Files**: See `tests/e2e/` directory
- **Config**: See `playwright.config.ts`

---

**You now have automated regression testing for the entire Inventory module.**

Run it before every deployment to ensure nothing broke. This replaces manual testing with reliable, repeatable automation.

```bash
# One command to validate everything:
./run-tests.sh all
```

