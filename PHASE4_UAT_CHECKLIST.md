# Phase 4 - User Acceptance Testing (UAT) Checklist

**Status:** Ready for UAT (NOT yet Production Ready)  
**Date:** Saturday, 2026-07-04  
**Estimated Duration:** 60-90 minutes of hands-on testing  

---

## MODULE 1: PURCHASE ORDERS

### Create Purchase Order
- [ ] Navigate to Purchase Orders page
- [ ] Click "New Purchase Order"
- [ ] Select supplier from dropdown
- [ ] Add multiple line items (product, qty, price)
- [ ] Verify calculations (subtotal, tax, total)
- [ ] Save as Draft
- [ ] Verify PO number auto-generated
- [ ] Verify record appears in list

### Edit Draft PO
- [ ] Open draft PO
- [ ] Edit supplier
- [ ] Edit line items
- [ ] Update discount/GST
- [ ] Save changes
- [ ] Verify updated values persist

### Submit for Approval
- [ ] Click "Submit" button
- [ ] Verify status changes Draft → Pending
- [ ] Verify Submit button disappears
- [ ] Verify Approve button appears

### Approve PO
- [ ] Click "Approve" button
- [ ] Verify status changes Pending → Approved
- [ ] Verify approved_by and approved_at populated
- [ ] Verify Approve button disappears

### Cannot Edit Approved PO
- [ ] Open approved PO
- [ ] Verify Edit button disabled/hidden
- [ ] Verify cannot modify items

### Cancel PO
- [ ] Open draft/pending PO
- [ ] Click Cancel
- [ ] Verify status changes to Cancelled
- [ ] Verify cannot receive against cancelled PO

### Search & Filter
- [ ] Search by PO number - works
- [ ] Search by remarks - works
- [ ] Filter by status (Draft, Pending, Approved, etc.) - works
- [ ] Pagination works (navigate pages)

**UAT Result:** ⏳ Pending

---

## MODULE 2: GOODS RECEIPT NOTES (GRN)

### Create GRN Against PO
- [ ] Open Purchase Orders page
- [ ] Open approved PO
- [ ] Click "Create GRN"
- [ ] Verify PO reference pre-filled
- [ ] Verify PO items pre-populated (ordered qty, pending qty)
- [ ] Add batch numbers for each item
- [ ] Add manufacturing dates
- [ ] Add expiry dates
- [ ] Add MRP, purchase price, selling price
- [ ] Add received quantities
- [ ] Save as Draft
- [ ] Verify GRN number auto-generated

### Create Direct GRN (No PO)
- [ ] Navigate to GRN page
- [ ] Click "New GRN"
- [ ] Leave PO reference blank
- [ ] Select supplier
- [ ] Add invoice details
- [ ] Add items with batch info
- [ ] Save

### Post GRN (Atomic Operation)
- [ ] Open draft GRN
- [ ] Click "Post" button
- [ ] Verify atomic operation completes:
  - [ ] Status changes Draft → Posted
  - [ ] Batches created (check Batch Management page)
  - [ ] Stock movements created (check Stock Movements)
  - [ ] Available stock updated (check Stock page)
  - [ ] PO received_quantity updated
  - [ ] PO status updated (if fully received: Received, else: Partially Received)

### Verify Cannot Edit Posted GRN
- [ ] Open posted GRN
- [ ] Verify Edit button disabled
- [ ] Verify cannot cancel posted GRN

### Search & Filter
- [ ] Search by GRN number - works
- [ ] Search by invoice number - works
- [ ] Filter by status (Draft, Posted, Cancelled) - works
- [ ] Filter by supplier - works

**UAT Result:** ⏳ Pending

---

## MODULE 3: BATCH MANAGEMENT

### Batch Created from GRN
- [ ] Post a GRN with batch info
- [ ] Go to Batch Management page
- [ ] Verify batch appears with:
  - [ ] Correct batch number
  - [ ] Correct product linked
  - [ ] Correct supplier
  - [ ] Correct available quantity
  - [ ] Manufacturing date
  - [ ] Expiry date

### Batch Search
- [ ] Search by batch number - works
- [ ] Search by product name - works
- [ ] Results appear correctly

### Expiry Filtering
- [ ] Filter "Expiring Soon" (90 days) - shows only batches within 90 days
- [ ] Filter "Expired" - shows only expired batches
- [ ] Batches sorted by expiry date (nearest first)

### Status Management
- [ ] Filter "Good" - shows good batches
- [ ] Filter "Damaged" - shows damaged batches
- [ ] Filter "Quarantine" - shows quarantine batches

### Days to Expiry Calculation
- [ ] Create batch with expiry date 30 days from now
- [ ] Verify "Days to Expiry" shows ~30
- [ ] Create batch with expiry date 120 days from now
- [ ] Verify "Days to Expiry" shows ~120
- [ ] Create batch with past expiry date
- [ ] Verify shown as "Expired" with negative days

### FIFO Ordering
- [ ] Create 3 batches with different expiry dates
- [ ] Verify list sorted by expiry (nearest first)

**UAT Result:** ⏳ Pending

---

## MODULE 4: STOCK MANAGEMENT

### Current Stock Display
- [ ] Go to Stock Management page
- [ ] Verify all products with batches shown
- [ ] Columns displayed: Product Code, Product Name, Category, Current Stock, Reorder Level, Batches, Status

### Stock Calculated Correctly
- [ ] Create GRN with 50 units of Product A
- [ ] Go to Stock page
- [ ] Verify Product A shows 50 units available
- [ ] Create another GRN with 30 units
- [ ] Verify Product A now shows 80 units

### Low Stock Detection
- [ ] Set Product B reorder level to 100
- [ ] Create GRN with 50 units of Product B
- [ ] Go to Stock page
- [ ] Verify Product B marked as "Low Stock"
- [ ] Filter "Low Stock Only"
- [ ] Verify Product B appears

### Out of Stock
- [ ] Create adjustment to decrease Product C to 0
- [ ] Verify Product C shows 0 units
- [ ] Filter "Out of Stock"
- [ ] Verify Product C appears

### Search
- [ ] Search by product name - works
- [ ] Search by product code - works

### Inventory Value
- [ ] Verify calculated as (quantity × purchase_price)
- [ ] Value updates when stock changes

**UAT Result:** ⏳ Pending

---

## MODULE 5: STOCK ADJUSTMENTS

### Create Adjustment (Increase)
- [ ] Go to Stock Adjustments
- [ ] Click "New Adjustment"
- [ ] Select Product A, Batch X
- [ ] Type: Increase
- [ ] Quantity: 10
- [ ] Reason: PHYSICAL_COUNT
- [ ] Save as Draft
- [ ] Verify adjustment number auto-generated

### Verify Adjustment Creates Movement
- [ ] Open adjustment
- [ ] Click "Post"
- [ ] Verify status changes Draft → Approved
- [ ] Go to Stock page
- [ ] Verify Product A stock increased by 10
- [ ] Go to Stock Movements
- [ ] Verify movement created with type "ADJUSTMENT"

### Decrease Adjustment
- [ ] Create adjustment: Decrease 5 units
- [ ] Post adjustment
- [ ] Verify stock decreased by 5
- [ ] Verify movement created

### Damage Adjustment
- [ ] Create adjustment with reason: DAMAGE
- [ ] Post
- [ ] Verify batch status changed to "Damaged"
- [ ] Verify stock reduced

### Expired Adjustment
- [ ] Create adjustment with reason: EXPIRED
- [ ] Post
- [ ] Verify batch status changed to "Expired"
- [ ] Verify stock reduced

### Physical Count Adjustment
- [ ] Create adjustment with reason: PHYSICAL_COUNT
- [ ] Quantity: -5 (shortage found)
- [ ] Post
- [ ] Verify stock reduced by 5
- [ ] Verify notes recorded

### Cannot Edit Posted Adjustment
- [ ] Open posted adjustment
- [ ] Verify Edit button disabled

### Search & Filter
- [ ] Filter by status - works
- [ ] Filter by reason - works
- [ ] Search by adjustment number - works

**UAT Result:** ⏳ Pending

---

## MODULE 6: INVENTORY DASHBOARD

### Dashboard Loads
- [ ] Navigate to Dashboard
- [ ] Verify all cards load without errors
- [ ] Verify data populated

### Stock Overview Cards
- [ ] Total Products - accurate count
- [ ] Active Products - accurate count
- [ ] Inventory Value - correct calculation

### Critical Alerts Section
- [ ] Low Stock Items - correct count
- [ ] Expiring Soon (90 days) - correct count
- [ ] Out of Stock - correct count

### Purchase Orders Section
- [ ] Draft count - accurate
- [ ] Pending count - accurate
- [ ] Approved count - accurate
- [ ] Pending Value - correct calculation

### GRN Section
- [ ] Draft GRNs - accurate
- [ ] Posted GRNs - accurate
- [ ] Today's Receipt - correct (filtered to today)
- [ ] This Month - correct (filtered to current month)

### Real-Time Updates (Critical Test)
- [ ] Note current Dashboard values
- [ ] Create new PO in Draft status
- [ ] Wait 30 seconds
- [ ] Verify Dashboard updated (Draft count increased)
- [ ] Approve a PO
- [ ] Wait 30 seconds
- [ ] Verify Dashboard updated (Pending decreased, Approved increased)
- [ ] Post a GRN
- [ ] Wait 30 seconds
- [ ] Verify Dashboard updated (Posted GRNs increased, inventory value changed)
- [ ] Create stock adjustment
- [ ] Wait 30 seconds
- [ ] Verify Dashboard recalculated

### Last Updated Timestamp
- [ ] Verify "Last updated" shown and current
- [ ] Verify auto-refresh every 30 seconds

**UAT Result:** ⏳ Pending (Critical: Real-time updates must work without stale data)

---

## MODULE 7: REPORTS

### Current Stock Report
- [ ] Go to Reports
- [ ] Click "Current Stock Report"
- [ ] Verify loads all products
- [ ] Filter by category - works
- [ ] Verify columns: Product, Category, Current Stock, Reorder Level, Stock Value
- [ ] Test CSV export - file downloads correctly
- [ ] Test PDF/Print - opens print dialog

### Stock Movement Report
- [ ] Click "Stock Movement Report"
- [ ] Verify all movements shown
- [ ] Filter by date range - works
- [ ] Filter by product - works
- [ ] Filter by movement type - works
- [ ] Test CSV export

### Inventory Valuation Report
- [ ] Click "Inventory Valuation Report"
- [ ] Verify total value calculated correctly
- [ ] Verify sorted by value (highest first)
- [ ] Test CSV export

### Purchase Register Report
- [ ] Click "Purchase Register Report"
- [ ] Verify all POs and linked GRNs shown
- [ ] Filter by date range - works
- [ ] Filter by supplier - works
- [ ] Verify totals calculated (subtotal, GST, net)
- [ ] Test CSV export

### Batch Report
- [ ] Click "Batch Report"
- [ ] Verify all batches shown
- [ ] Verify expiry info shown
- [ ] Verify days to expiry calculated
- [ ] Test CSV export

### Expiry Report
- [ ] Click "Expiry Report"
- [ ] Verify only batches expiring within 90 days shown
- [ ] Sorted by expiry date (nearest first)
- [ ] Verify expired items highlighted
- [ ] Test CSV export

### Low Stock Report
- [ ] Click "Low Stock Report"
- [ ] Verify only items below reorder level
- [ ] Stock value shown
- [ ] Test CSV export

### Dead Stock Report
- [ ] Click "Dead Stock Report"
- [ ] Verify non-moving stock identified (180+ days no movement)
- [ ] Test CSV export

### Product Ledger
- [ ] From any product, view "Product Ledger"
- [ ] Verify all movements for that product shown
- [ ] Filter by date range - works

### Export Formats
- [ ] CSV download - works, opens in spreadsheet
- [ ] PDF/Print - opens print dialog, prints correctly
- [ ] Print preview - shows formatted data

**UAT Result:** ⏳ Pending

---

## SECURITY TESTING

### Invalid IDs
- [ ] Try accessing `/api/inventory/purchase-orders/invalid-uuid`
- [ ] Verify returns 404 error (not 500 or blank)
- [ ] Try accessing `/api/inventory/grns/invalid-uuid`
- [ ] Verify proper error response

### Invalid Payloads
- [ ] POST with missing required fields
- [ ] Verify returns 400 with validation error details
- [ ] POST with wrong data types
- [ ] Verify returns 400 with type error

### SQL Injection Attempts
- [ ] In search box, enter: `'; DROP TABLE inv_products; --`
- [ ] Verify search fails gracefully (no actual SQL executed)
- [ ] Try in filter parameters

### Unauthorized Access
- [ ] Try accessing without authentication headers
- [ ] Verify application handles appropriately
- [ ] Try modifying records with wrong x-user-id
- [ ] Verify authorization checks work

### Status Code Correctness
- [ ] Successful GET: 200
- [ ] Successful POST: 201
- [ ] Bad request: 400
- [ ] Not found: 404
- [ ] Server error: 500

**UAT Result:** ⏳ Pending

---

## PERFORMANCE TESTING

### Create Test Data
- [ ] Create ~50 products (or use existing)
- [ ] Create ~20 suppliers (or use existing)
- [ ] Create ~200 batches via GRNs
- [ ] Create ~500 stock movements via adjustments

### Dashboard Performance
- [ ] Load dashboard with 200+ batches
- [ ] Verify loads in <2 seconds
- [ ] No freezing or lag
- [ ] Auto-refresh works smoothly

### Stock Page Performance
- [ ] Load stock list with 50 products
- [ ] Verify pagination works smoothly
- [ ] Search with 50 products - responsive
- [ ] Filters apply without lag

### Reports Performance
- [ ] Load Current Stock report with 50 products
- [ ] Load Stock Movement report with 500 movements
- [ ] Filtering doesn't cause delays
- [ ] CSV export completes in <5 seconds

### Pagination
- [ ] Navigate through pages (1→2→3→last→1)
- [ ] Each page loads correctly
- [ ] No duplicate/missing data across pages

**UAT Result:** ⏳ Pending

---

## WORKFLOW INTEGRATION TEST

### Complete End-to-End Flow
1. [ ] Create Purchase Order (draft)
2. [ ] Submit for Approval (pending)
3. [ ] Approve Purchase Order (approved)
4. [ ] Create GRN against PO with batch info
5. [ ] Post GRN
   - [ ] Verify batch created
   - [ ] Verify stock increased
   - [ ] Verify movement created
   - [ ] Verify PO updated to "Received"
6. [ ] View product in Stock Management
   - [ ] Verify current stock correct
   - [ ] Verify batch listed
   - [ ] Verify supplier linked
7. [ ] Create Stock Adjustment
   - [ ] Verify movement created
   - [ ] Verify batch quantity updated
8. [ ] View Dashboard
   - [ ] Verify all KPIs updated
   - [ ] Verify no stale data
9. [ ] Run Reports
   - [ ] Verify all transactions visible
   - [ ] Verify calculations correct

**UAT Result:** ⏳ Pending

---

## SUMMARY SCORING

| Module | Status | Issues Found |
|--------|--------|--------------|
| Purchase Orders | ⏳ | |
| GRN | ⏳ | |
| Batch Management | ⏳ | |
| Stock Management | ⏳ | |
| Stock Adjustments | ⏳ | |
| Dashboard | ⏳ | |
| Reports | ⏳ | |
| Security | ⏳ | |
| Performance | ⏳ | |
| Integration | ⏳ | |

---

## ISSUES LOG

### Critical Issues (blocks production)
- [ ] (None yet - awaiting testing)

### High Priority (must fix before production)
- [ ] (None yet - awaiting testing)

### Medium Priority (should fix)
- [ ] (None yet - awaiting testing)

### Low Priority (nice to have)
- [ ] (None yet - awaiting testing)

---

## SIGN-OFF

**UAT Completion Date:** ⏳ Pending  
**UAT Result:** ⏳ Awaiting execution  
**Production Ready:** ❌ NO - Testing not yet conducted  
**Recommended Next Step:** Execute this UAT checklist before production deployment  

---

## NOTES

This checklist represents the comprehensive testing needed before claiming "Production Ready" status. Each item should be manually verified in the actual running application, not just code review.

The current status is:
- ✅ Code is complete and compiles
- ✅ Build passes with zero errors
- ❌ Real-world verification not yet performed
- ⏳ Production deployment should wait until this checklist is 100% complete
