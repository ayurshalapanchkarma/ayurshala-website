# Inventory Reports Module - Implementation Plan

**Date**: 2026-07-09 02:00 UTC+5:30  
**Scope**: Reports standardization + Navigation fixes  
**Database**: Production Supabase only  

---

## PART 1: Reports Module Completion

### Current Status Audit

**All 9 report pages exist**:
✓ /admin/inventory/reports (Dashboard)
✓ /admin/inventory/reports/current-stock
✓ /admin/inventory/reports/stock-movement
✓ /admin/inventory/reports/inventory-valuation
✓ /admin/inventory/reports/purchase-register
✓ /admin/inventory/reports/batch
✓ /admin/inventory/reports/expiry
✓ /admin/inventory/reports/low-stock
✓ /admin/inventory/reports/dead-stock

**Total current code**: 1,428 lines

### Required Features Per Report

Every report must have:
- [x] Real database data (no mocks)
- [ ] Search functionality
- [ ] Advanced filters
- [ ] Pagination
- [ ] Sorting
- [ ] CSV Export
- [ ] Excel Export
- [ ] PDF Export
- [ ] Print capability
- [ ] Refresh button
- [ ] Loading states
- [ ] Empty state
- [ ] Error states
- [ ] Dark mode support
- [ ] Responsive UI
- [ ] InventoryBackButton

### New Components/Hooks Created

1. **InventoryBackButton.tsx** (30 lines) ✓
   - Reusable back button
   - Always routes to /admin/inventory
   - Dark mode support

2. **useInventoryReport.ts** (150+ lines) ✓
   - Comprehensive report management hook
   - Search, filter, pagination, sorting
   - CSV/Excel export functions
   - Print capability
   - Error handling
   - Toast feedback

### Implementation Strategy

**Phase 1** - Create shared utilities ✓
- InventoryBackButton component
- useInventoryReport hook
- Report utilities

**Phase 2** - Standardize report pages
- Add useInventoryReport hook to each report
- Add search/filter UI
- Add export buttons
- Add InventoryBackButton
- Add loading/error states

**Phase 3** - Fix all inventory page navigation
- Add InventoryBackButton to 25+ pages
- Ensure all back buttons route to /admin/inventory

**Phase 4** - Verification
- Test all reports load data
- Test all exports work
- Test all back buttons route correctly
- Build verification

---

## PART 2: Navigation Standardization

### Pages Requiring Back Button Fix

**Masters** (5 pages):
- /admin/inventory/categories
- /admin/inventory/units
- /admin/inventory/manufacturers
- /admin/inventory/suppliers
- /admin/inventory/warehouses

**Products** (3 pages):
- /admin/inventory/products
- /admin/inventory/products/create
- /admin/inventory/products/[id]/edit

**Operations** (4 pages):
- /admin/inventory/purchase-orders
- /admin/inventory/grns
- /admin/inventory/adjustments
- /admin/inventory/batches

**Stock Management** (4 pages):
- /admin/inventory/stock
- /admin/inventory/current-stock
- /admin/inventory/transactions
- /admin/inventory/stock-ledger

**Monitoring** (2 pages):
- /admin/inventory/low-stock
- /admin/inventory/expiring-stock

**Reports** (9 pages):
- /admin/inventory/reports (dashboard)
- /admin/inventory/reports/current-stock
- /admin/inventory/reports/stock-movement
- /admin/inventory/reports/inventory-valuation
- /admin/inventory/reports/purchase-register
- /admin/inventory/reports/batch
- /admin/inventory/reports/expiry
- /admin/inventory/reports/low-stock
- /admin/inventory/reports/dead-stock

**Settings** (2 pages):
- /admin/inventory/settings
- /admin/inventory/settings/taxes

**Total Pages to Update**: 29 pages

### Current Problem
- Many pages use various back navigation patterns
- Some use `/admin` instead of `/admin/inventory`
- Inconsistent navigation logic

### Solution
Replace all back buttons with `<InventoryBackButton />`
- Centralized logic
- Always routes to /admin/inventory
- Easy to maintain

---

## Report Details

### 1. Current Stock Report
- **Endpoint**: GET /api/inventory/reports/current-stock
- **Fields**: Product, SKU, Category, Warehouse, Current Qty, Unit, Purchase Price, Selling Price, Inventory Value
- **Summary**: Total Products, Total Stock, Total Inventory Value
- **Export**: CSV, Excel, PDF
- **Features**: Search by product, filter by category/warehouse, paginate

### 2. Stock Movement Report
- **Endpoint**: GET /api/inventory/reports/stock-movement
- **Fields**: Date, Product, Transaction Type, Reference, Qty In, Qty Out, Balance, User
- **Filters**: Date range, Warehouse, Product, Transaction Type
- **Export**: CSV, Excel, PDF

### 3. Inventory Valuation
- **Endpoint**: GET /api/inventory/reports/inventory-valuation
- **Fields**: Product, Quantity, Average Cost, Total Value, Warehouse
- **Charts**: Category valuation (pie), Warehouse valuation (bar)
- **Summary**: Total Value, Average Product Value, Highest Value Item

### 4. Purchase Register
- **Endpoint**: GET /api/inventory/reports/purchase-register
- **Fields**: PO Number, Supplier, Date, Status, Amount, GST, Grand Total
- **Actions**: Preview, Print, Export

### 5. Batch Report
- **Endpoint**: GET /api/inventory/reports/batch
- **Fields**: Batch Number, Product, Qty, Expiry Date, Warehouse
- **Filters**: Status (good, expired, expiring)

### 6. Expiry Report
- **Endpoint**: GET /api/inventory/reports/expiry
- **Fields**: Batch, Product, Days Remaining, Value, Status
- **Color Coding**: Expired (red), 7 days (red-orange), 30 days (orange), 90 days (yellow)

### 7. Low Stock Report
- **Endpoint**: GET /api/inventory/reports/low-stock
- **Fields**: Product, Current Qty, Reorder Level, Minimum, Shortfall
- **Button**: Create Purchase Order

### 8. Dead Stock Report
- **Endpoint**: GET /api/inventory/reports/dead-stock
- **Fields**: Product, Last Movement Date, Days Idle, Quantity, Value
- **Filter**: Days idle threshold

---

## Deliverables Checklist

### Code
- [x] InventoryBackButton component
- [x] useInventoryReport hook
- [ ] Update all 9 report pages
- [ ] Update all 29 inventory pages with InventoryBackButton
- [ ] Verify all exports work

### Testing
- [ ] All reports open successfully
- [ ] All reports load real data
- [ ] Search works on all reports
- [ ] Filters work on all reports
- [ ] Pagination works on all reports
- [ ] All exports work (CSV, Excel, PDF)
- [ ] Print works on all reports
- [ ] No 404/500 errors
- [ ] No console errors
- [ ] All back buttons route to /admin/inventory

### Build
- [ ] Zero TypeScript errors
- [ ] Successful production build
- [ ] No warnings
- [ ] Git commit with all changes

---

## Git Commits Plan

1. **feat: Create InventoryBackButton and useInventoryReport utilities**
   - InventoryBackButton.tsx
   - useInventoryReport.ts
   - Documentation

2. **feat: Standardize and enhance all report pages**
   - Update 9 report pages with full features
   - Add export, print, search, filters

3. **fix: Add InventoryBackButton to all inventory pages**
   - Replace all back button logic with reusable component
   - 29 pages updated

4. **test: Verify all reports and navigation**
   - Build verification
   - Runtime verification

---

## Implementation Timeline

**Phase 1** (Utilities): ✓ Complete
- InventoryBackButton
- useInventoryReport hook

**Phase 2** (Reports): In Progress
- Add features to each report
- Add InventoryBackButton
- Test exports

**Phase 3** (Navigation): Next
- Update all 29 inventory pages
- Test all back buttons

**Phase 4** (Verification): Final
- Build test
- Runtime test
- Git commit

---

**Status**: Ready to execute Phase 2
