# Phase 5 - UAT & Stabilization Comprehensive Checklist

**Project Structure:**
```
Phase 4: Implementation ✅ Complete
    ↓
Phase 5: UAT & Stabilization ⏳ Next
    ↓
Phase 6: Production Release
```

**Scope:** Complete business workflow testing  
**Duration:** 2-3 hours of hands-on testing  
**Tester Role:** Product owner or experienced end-user  

---

## MASTER DATA TESTING (Phase 3 Verification)

These were built in Phase 3. Verify they still work with Phase 4 transactions.

### Categories
- [ ] Create new category
- [ ] Edit existing category
- [ ] Delete category (soft delete)
- [ ] Restore deleted category
- [ ] Toggle is_active status
- [ ] Search categories
- [ ] Pagination works
- [ ] Duplicate name prevention

### Units
- [ ] Create new unit
- [ ] Edit existing unit
- [ ] Delete unit
- [ ] Toggle status
- [ ] Search units
- [ ] Pagination works

### Manufacturers
- [ ] Create with GSTIN (validate 15 chars)
- [ ] Edit manufacturer
- [ ] Delete manufacturer
- [ ] Search manufacturers
- [ ] Pagination works
- [ ] GSTIN format validation

### Suppliers
- [ ] Create supplier with 20+ fields
- [ ] Auto-generated supplier code (SUP-000001)
- [ ] Edit supplier
- [ ] Delete supplier
- [ ] Toggle status
- [ ] Search suppliers
- [ ] Pagination works
- [ ] PAN validation (10 chars)
- [ ] Email validation
- [ ] Mobile validation (10 digits)

### Products
- [ ] Create product with 25+ fields
- [ ] Auto-generated product code (PRD-000001)
- [ ] Link to category
- [ ] Link to unit
- [ ] Link to manufacturer
- [ ] Set reorder level
- [ ] Set min stock
- [ ] Edit product
- [ ] Delete product (soft delete)
- [ ] Toggle status
- [ ] Search products
- [ ] Pagination works
- [ ] Batch tracking enabled
- [ ] Expiry tracking enabled

**Master Data UAT Result:** ⏳ Pending

---

## PURCHASE ORDERS - COMPLETE WORKFLOW

### Create Draft PO
- [ ] Click "New Purchase Order"
- [ ] Select supplier (dropdown loads all from Phase 3)
- [ ] Add order date
- [ ] Add expected delivery date
- [ ] Add line items:
  - [ ] Product selected from dropdown (Phase 3 products)
  - [ ] Quantity entered
  - [ ] Unit shown (from product)
  - [ ] Unit price entered
  - [ ] Discount % entered
  - [ ] GST % entered
- [ ] Line amount auto-calculated correctly
- [ ] Add multiple items (verify totals update)
- [ ] Subtotal calculated correctly
- [ ] Tax amount calculated correctly (sum of line taxes)
- [ ] Total amount correct
- [ ] Save as Draft
- [ ] PO number auto-generated (e.g., PO-000001)
- [ ] Status shows "Draft"

### Edit Draft PO
- [ ] Open draft PO
- [ ] Edit supplier
- [ ] Edit line item quantity
- [ ] Edit discount %
- [ ] Edit GST %
- [ ] Verify totals recalculate immediately
- [ ] Remove line item
- [ ] Add new line item
- [ ] Save changes
- [ ] Verify changes persist on reload

### Submit for Approval
- [ ] Click "Submit" button
- [ ] Verify status changes "Draft" → "Pending"
- [ ] Verify "Submitted by" and timestamp recorded
- [ ] Verify edit button disabled
- [ ] Verify approve button available

### Approve PO
- [ ] Click "Approve" button
- [ ] Verify status changes "Pending" → "Approved"
- [ ] Verify "Approved by" and timestamp recorded
- [ ] Cannot revert to Pending

### Cannot Modify Approved PO
- [ ] Open approved PO
- [ ] Verify edit button disabled
- [ ] Verify cannot change supplier
- [ ] Verify cannot change items

### Cancel PO
- [ ] Open draft PO
- [ ] Click "Cancel"
- [ ] Verify status changes to "Cancelled"
- [ ] Cannot receive against cancelled PO
- [ ] Try to cancel approved PO - should fail
- [ ] Verify error message appropriate

### List & Search
- [ ] Search by PO number (e.g., "PO-000001") - works
- [ ] Search by remarks - works
- [ ] Filter by status:
  - [ ] Draft - shows only drafts
  - [ ] Pending - shows only pending
  - [ ] Approved - shows only approved
- [ ] Pagination works (navigate pages)
- [ ] Page indicator accurate

**Purchase Orders UAT Result:** ⏳ Pending

---

## GOODS RECEIPT NOTES - COMPLETE WORKFLOW

### Create GRN Against Approved PO
- [ ] Open approved PO
- [ ] Look for "Create GRN" button
- [ ] Click it
- [ ] Verify PO reference pre-filled
- [ ] Verify supplier pre-filled
- [ ] Verify PO items shown with:
  - [ ] Ordered quantity
  - [ ] Already received quantity
  - [ ] Pending quantity
- [ ] For each item:
  - [ ] Product name shown
  - [ ] Batch number entered (e.g., "BATCH-001")
  - [ ] Manufacturing date entered
  - [ ] Expiry date entered (30+ days future)
  - [ ] MRP entered
  - [ ] Purchase price entered
  - [ ] Selling price entered
  - [ ] Received quantity entered
  - [ ] Free quantity entered (optional)
  - [ ] GST % entered
- [ ] Line amount calculated
- [ ] Total amount calculated
- [ ] Save as Draft
- [ ] GRN number auto-generated

### Create Direct GRN (No PO)
- [ ] Navigate to GRN page
- [ ] Click "New GRN"
- [ ] Leave PO reference blank
- [ ] Select supplier
- [ ] Enter invoice number
- [ ] Enter invoice date
- [ ] Add items manually
- [ ] Save as Draft

### Partial Receiving
- [ ] Open approved PO with 100 units ordered
- [ ] Create first GRN receiving 60 units
- [ ] Post GRN
- [ ] Verify PO shows "Partially Received"
- [ ] Create second GRN receiving 40 units
- [ ] Post second GRN
- [ ] Verify PO shows "Received"

### Post GRN - Atomic Operation (CRITICAL)
- [ ] Open draft GRN
- [ ] Click "Post" button
- [ ] Verify following happens ATOMICALLY:

  **Immediate Verification:**
  - [ ] GRN status changes "Draft" → "Posted"
  - [ ] Cannot edit posted GRN
  - [ ] Cannot cancel posted GRN

  **Batch Verification (go to Batch Management):**
  - [ ] New batch created for each GRN item
  - [ ] Batch number matches GRN entry
  - [ ] Product linked correctly
  - [ ] Supplier linked correctly
  - [ ] Manufacturing date stored
  - [ ] Expiry date stored
  - [ ] Available quantity = received quantity
  - [ ] Status = "good"

  **Stock Verification (go to Stock Management):**
  - [ ] Product available stock increased by received quantity
  - [ ] Calculation correct (sum of all good batches)

  **Movement Verification (go to Stock Movements):**
  - [ ] Stock movement created with type "PURCHASE"
  - [ ] Movement references GRN
  - [ ] Before/after stock quantities correct
  - [ ] Timestamp recorded

  **PO Verification (go back to PO):**
  - [ ] PO received_quantity updated
  - [ ] If all items received: PO status "Received"
  - [ ] If partial: PO status "Partially Received"

  **Dashboard Verification (go to Dashboard):**
  - [ ] Inventory Value increased
  - [ ] Current Stock card updated
  - [ ] Today's GRNs count increased
  - [ ] Wait 30 seconds, verify values still correct

- [ ] All above verified without any manual intervention

### Multiple Batches Same Product
- [ ] Create GRN with 2 batches of same product:
  - [ ] Batch A: 50 units, expiry 3 months
  - [ ] Batch B: 50 units, expiry 6 months
- [ ] Post GRN
- [ ] Go to Batch Management
- [ ] Verify both batches created
- [ ] Verify sorted by expiry (Batch A first)
- [ ] Go to Stock Management
- [ ] Verify product shows 100 total units
- [ ] Verify batch count shows 2

**GRN UAT Result:** ⏳ Pending (CRITICAL: Atomic operation must work)

---

## BATCH MANAGEMENT - COMPLETE LIFECYCLE

### Batch Created from GRN
- [ ] Post a GRN with batch info
- [ ] Go to Batch Management
- [ ] Find batch by batch number
- [ ] Verify fields:
  - [ ] Product name
  - [ ] Batch number
  - [ ] Manufacturing date
  - [ ] Expiry date
  - [ ] Available quantity (= received qty)
  - [ ] Supplier name
  - [ ] Status = "good"

### Search Functionality
- [ ] Search by batch number (exact match) - works
- [ ] Search by product name (partial match) - works
- [ ] Search by supplier name - works
- [ ] Results appear correctly

### Expiry Calculation
- [ ] Create batch expiring 20 days from now
- [ ] Verify "Days to Expiry" shows ~20
- [ ] Verify status badge shows "Expiring Soon" (yellow)
- [ ] Create batch expiring 120 days from now
- [ ] Verify "Days to Expiry" shows ~120
- [ ] Verify status shows "Good" (green)
- [ ] Create batch with past expiry date
- [ ] Verify "Days to Expiry" shows negative
- [ ] Verify status shows "Expired" (red)

### FIFO Ordering
- [ ] Create 3 GRNs with same product, different batch expiry dates:
  - [ ] Batch A: 90 days (3 months)
  - [ ] Batch B: 30 days (1 month)
  - [ ] Batch C: 180 days (6 months)
- [ ] Go to Batch Management
- [ ] Search product name
- [ ] Verify batches listed in order: B (30 days), A (90 days), C (180 days)
- [ ] FIFO ready for picking

### Status Filters
- [ ] Filter "Good" - shows only good batches
- [ ] Filter "Expiring Soon" - shows only ≤90 days
- [ ] Filter "Expired" - shows only past expiry
- [ ] Filter "Damaged" - works
- [ ] Filter "Quarantine" - works

### Batch History
- [ ] Open batch details
- [ ] Verify GRN reference shown
- [ ] Verify can link back to GRN

### Supplier Linkage
- [ ] Create GRN from Supplier A
- [ ] Batch created
- [ ] Go to Batch Management
- [ ] Verify supplier name shows "Supplier A"
- [ ] Filter by supplier name - batch appears

**Batch Management UAT Result:** ⏳ Pending

---

## STOCK MANAGEMENT - REAL-TIME INVENTORY

### Current Stock Display
- [ ] Go to Stock Management page
- [ ] Verify table displays:
  - [ ] Product Code
  - [ ] Product Name
  - [ ] Category
  - [ ] Current Stock
  - [ ] Reorder Level
  - [ ] Batch Count
  - [ ] Status (Normal/Low Stock)

### Stock Calculated Correctly
- [ ] Create GRN with 100 units of Product X
- [ ] Go to Stock page
- [ ] Find Product X
- [ ] Verify shows 100 units
- [ ] Create another GRN with 50 units of Product X
- [ ] Verify now shows 150 units
- [ ] Delete adjustment of 25 units
- [ ] Verify shows 125 units

### Low Stock Detection
- [ ] Set Product Y reorder level = 100
- [ ] Create GRN with 50 units
- [ ] Go to Stock page
- [ ] Find Product Y
- [ ] Verify status shows "Low Stock" (red)
- [ ] Filter "Low Stock Only"
- [ ] Verify Product Y appears

### Out of Stock
- [ ] Create GRN with 10 units of Product Z
- [ ] Create adjustment: Decrease 10 units (reason: PHYSICAL_COUNT)
- [ ] Go to Stock page
- [ ] Find Product Z
- [ ] Verify shows 0 units
- [ ] Verify status shows "Out of Stock"

### Search Functionality
- [ ] Search by product code - works
- [ ] Search by product name - works
- [ ] Filters apply correctly

### Inventory Value
- [ ] GRN shows purchase price 100/unit, 50 units
- [ ] Go to Stock page
- [ ] Verify inventory value = 100 × 50 = 5,000
- [ ] Value updates when stock changes

**Stock Management UAT Result:** ⏳ Pending

---

## STOCK ADJUSTMENTS - ALL TYPES

### Increase Adjustment
- [ ] Create adjustment: Product A, Batch X
- [ ] Type: Increase
- [ ] Quantity: 10 units
- [ ] Reason: PHYSICAL_COUNT (or CORRECTION)
- [ ] Save as Draft
- [ ] Adjustment number auto-generated
- [ ] Click "Post"
- [ ] Status changes Draft → Approved
- [ ] Go to Stock page
- [ ] Product A now shows +10 units
- [ ] Go to Stock Movements
- [ ] Verify movement created with type "ADJUSTMENT"

### Decrease Adjustment
- [ ] Create adjustment: Quantity: 5 units
- [ ] Type: Decrease
- [ ] Reason: PHYSICAL_COUNT
- [ ] Post
- [ ] Verify stock decreased by 5
- [ ] Verify movement created

### Damage Adjustment
- [ ] Create adjustment: Quantity: 20 units
- [ ] Reason: DAMAGE
- [ ] Post
- [ ] Verify stock decreased by 20
- [ ] Go to Batch Management
- [ ] Verify batch status changed to "Damaged"

### Expired Adjustment
- [ ] Create adjustment for expired batch
- [ ] Reason: EXPIRED
- [ ] Quantity: (full batch quantity)
- [ ] Post
- [ ] Verify stock decreased
- [ ] Verify batch status changed to "Expired"

### Lost Adjustment
- [ ] Create adjustment
- [ ] Reason: LOST
- [ ] Quantity: 5 units
- [ ] Notes: "Items lost during movement"
- [ ] Post
- [ ] Verify stock decreased
- [ ] Verify notes recorded

### Physical Count Adjustment
- [ ] Expected 100 units but counted 95
- [ ] Create adjustment: Quantity: -5
- [ ] Reason: PHYSICAL_COUNT
- [ ] Notes: "Physical count shortage"
- [ ] Post
- [ ] Verify stock reduced by 5
- [ ] Verify audit trail shows what happened

### Cannot Edit Posted Adjustment
- [ ] Open posted adjustment
- [ ] Verify Edit button disabled
- [ ] Verify cannot modify reason or quantity

### Search & Filter
- [ ] Filter by status:
  - [ ] Draft - shows drafts only
  - [ ] Approved - shows approved only
- [ ] Filter by reason - all types work
- [ ] Search by adjustment number - works
- [ ] Date filtering - works

### Verify Adjustment Creates Movement
- [ ] Create and post any adjustment
- [ ] Go to Stock Movements
- [ ] Find the movement
- [ ] Verify it has:
  - [ ] Type = "ADJUSTMENT"
  - [ ] Correct product
  - [ ] Correct batch
  - [ ] Correct before/after quantities
  - [ ] Correct adjustment quantity

**Stock Adjustments UAT Result:** ⏳ Pending

---

## INVENTORY DASHBOARD - REAL-TIME KPIs

### Dashboard Loads
- [ ] Navigate to Dashboard
- [ ] Verify no errors
- [ ] All cards load
- [ ] Data populated

### Stock Overview Cards
- [ ] Total Products: accurate count
- [ ] Active Products: accurate count
- [ ] Inventory Value: correct calculation (Σ quantity × purchase_price)

### Critical Alerts
- [ ] Low Stock Items: accurate count (below reorder level)
- [ ] Expiring Soon (90 days): accurate count
- [ ] Out of Stock: accurate count

### Purchase Orders Section
- [ ] Draft: accurate count
- [ ] Pending: accurate count
- [ ] Approved: accurate count
- [ ] Partially Received: accurate count
- [ ] Pending Value: correct sum of pending + approved PO totals

### GRN Section
- [ ] Draft GRNs: accurate count
- [ ] Posted GRNs: accurate count
- [ ] Today's Receipt: correct (filtered to today only)
- [ ] This Month: correct (filtered to current calendar month)

### Real-Time Updates (CRITICAL TEST)
**Setup:**
- [ ] Note all Dashboard values
- [ ] Have Stock page and Dashboard both open

**Test 1: Create PO**
- [ ] Create new PO (draft) with $10,000 total
- [ ] Wait 30 seconds
- [ ] Verify Dashboard "Draft" count increased by 1
- [ ] Verify "Pending Value" unchanged (draft not counted)

**Test 2: Approve PO**
- [ ] Approve the PO
- [ ] Wait 30 seconds
- [ ] Verify Dashboard "Pending" decreased by 1
- [ ] Verify Dashboard "Approved" increased by 1
- [ ] Verify "Pending Value" increased by $10,000

**Test 3: Post GRN**
- [ ] Create and post a GRN (e.g., 100 units @ $100 = $10,000 inventory)
- [ ] Wait 30 seconds
- [ ] Verify Dashboard "Inventory Value" increased by ~$10,000
- [ ] Verify Dashboard "Current Stock" updated
- [ ] Verify Dashboard "Today's GRNs" count increased
- [ ] Verify "Posted GRNs" increased

**Test 4: Stock Adjustment**
- [ ] Create stock adjustment (e.g., increase 50 units @ $100 = $5,000)
- [ ] Post adjustment
- [ ] Wait 30 seconds
- [ ] Verify Dashboard "Current Stock" updated
- [ ] Verify Dashboard "Inventory Value" updated
- [ ] Verify all values still correct (no stale data)

**Test 5: Check for Stale Data**
- [ ] Verify all Dashboard values match Stock page values
- [ ] Verify all totals add up correctly
- [ ] No discrepancies

### Last Updated Timestamp
- [ ] Verify "Last updated" timestamp shown
- [ ] Timestamp is current (within last 30 seconds)
- [ ] Refreshes automatically

**Dashboard UAT Result:** ⏳ Pending (CRITICAL: Real-time updates must work)

---

## REPORTS - ALL 9 TYPES

### Current Stock Report
- [ ] Navigate to Reports
- [ ] Click "Current Stock Report"
- [ ] Verify loads all products with stock levels
- [ ] Columns visible:
  - [ ] Product Code
  - [ ] Product Name
  - [ ] Category
  - [ ] Current Stock
  - [ ] Reorder Level
  - [ ] Stock Value
- [ ] Filter by category - works
- [ ] Export CSV - file downloads
- [ ] Export PDF - opens print dialog
- [ ] Print - shows formatted data

### Stock Movement Report
- [ ] Click "Stock Movement Report"
- [ ] Verify all movements listed
- [ ] Columns:
  - [ ] Date
  - [ ] Product
  - [ ] Movement Type
  - [ ] Quantity
  - [ ] Before/After Stock
- [ ] Filter by date range - works
- [ ] Filter by product - works
- [ ] Filter by movement type - works
- [ ] Export works

### Inventory Valuation Report
- [ ] Click "Inventory Valuation Report"
- [ ] Verify total value calculated
- [ ] Verify products sorted by value (highest first)
- [ ] Columns:
  - [ ] Product Code
  - [ ] Current Stock
  - [ ] Average Purchase Price
  - [ ] Total Value
- [ ] Summary shows total inventory value
- [ ] Export works

### Purchase Register Report
- [ ] Click "Purchase Register Report"
- [ ] Verify all POs and linked GRNs shown
- [ ] Columns:
  - [ ] PO Date
  - [ ] PO Number
  - [ ] Supplier
  - [ ] GRN Number (if received)
  - [ ] Product
  - [ ] Quantity
  - [ ] Unit Price
  - [ ] Total Amount
  - [ ] GST
  - [ ] Net Amount
- [ ] Filter by date range - works
- [ ] Filter by supplier - works
- [ ] Summary totals correct
- [ ] Export works

### Batch Report
- [ ] Click "Batch Report"
- [ ] Verify all batches listed
- [ ] Columns:
  - [ ] Batch Number
  - [ ] Product
  - [ ] Supplier
  - [ ] Manufacturing Date
  - [ ] Expiry Date
  - [ ] Received Qty
  - [ ] Available Qty
  - [ ] Days to Expiry
- [ ] Batches sorted by expiry (nearest first)
- [ ] Summary shows total batches, expiring count
- [ ] Export works

### Expiry Report
- [ ] Click "Expiry Report"
- [ ] Verify only batches expiring within 90 days shown
- [ ] Sorted by expiry date (nearest first)
- [ ] Expired batches highlighted differently
- [ ] Columns include Days to Expiry
- [ ] Export works

### Low Stock Report
- [ ] Click "Low Stock Report"
- [ ] Verify only items below reorder level shown
- [ ] Stock value shown for each item
- [ ] Total value of low stock items calculated
- [ ] Export works

### Dead Stock Report
- [ ] Click "Dead Stock Report"
- [ ] Verify non-moving stock identified (180+ days)
- [ ] Stock value shown
- [ ] Average age shown
- [ ] Export works

### Product Ledger
- [ ] From any product, access "Product Ledger"
- [ ] Verify all movements for that product shown
- [ ] Chronological order
- [ ] Filter by date range - works
- [ ] Export works

### Export Testing
**CSV Export:**
- [ ] Click CSV download
- [ ] File downloads with correct name
- [ ] Open in spreadsheet
- [ ] Data formatted correctly
- [ ] All columns present

**PDF Export:**
- [ ] Click PDF/Print
- [ ] Print dialog opens
- [ ] Preview shows formatted report
- [ ] Headers and footers correct
- [ ] Page breaks correct

**Print:**
- [ ] Click Print
- [ ] Browser print dialog appears
- [ ] Data formatted for printing
- [ ] Can print to physical printer

**Reports UAT Result:** ⏳ Pending

---

## SECURITY TESTING

### Invalid UUIDs
- [ ] Try GET `/api/inventory/purchase-orders/invalid-uuid-123`
- [ ] Verify returns 404 (not 500)
- [ ] Error message appropriate
- [ ] No stack trace exposed
- [ ] Try same with GRN, adjustments, etc.

### Invalid Payloads
- [ ] POST PO with missing supplier_uuid
- [ ] Verify returns 400 with validation error
- [ ] Error message explains what's wrong
- [ ] POST with negative quantity
- [ ] Verify returns 400

### SQL Injection Attempts
- [ ] In search field, enter: `'; DROP TABLE inv_products; --`
- [ ] Search executes safely
- [ ] No SQL executed
- [ ] Returns normal results (no matches)
- [ ] Application continues working

### Missing Required Fields
- [ ] POST GRN without supplier_uuid
- [ ] Returns 400 with field error
- [ ] POST PO without items array
- [ ] Returns 400 with items error

### Unauthorized Access Attempts
- [ ] Try accessing with invalid x-user-id
- [ ] Application handles appropriately
- [ ] Try modifying record with wrong user
- [ ] Verify authorization checks work

### Error Response Format
- [ ] Verify all errors return JSON
- [ ] Include error code and message
- [ ] No HTML error pages
- [ ] Consistent error format across APIs

**Security UAT Result:** ⏳ Pending

---

## PERFORMANCE TESTING

### Seed Test Data
- [ ] Create ~500 products (or use existing)
- [ ] Create ~100 suppliers (or use existing)
- [ ] Create GRNs to result in ~5,000 batches
- [ ] Create stock adjustments to result in ~50,000 stock movements

### Dashboard Performance
- [ ] Load dashboard with full data volume
- [ ] Verify loads in <3 seconds
- [ ] All KPIs calculate correctly
- [ ] No timeouts
- [ ] Auto-refresh works smoothly
- [ ] No memory leaks

### Stock Page Performance
- [ ] Load stock list with 500 products
- [ ] Pagination works smoothly
- [ ] Searching responsive (<1 second)
- [ ] Filters apply without delay
- [ ] Navigate between pages quickly

### Reports Performance
- [ ] Stock Movement Report with 50,000 movements
- [ ] Loads in <5 seconds
- [ ] Filters don't hang
- [ ] CSV export completes in <10 seconds
- [ ] No timeout errors

### API Response Times
- [ ] Purchase Orders list: <500ms
- [ ] GRN detail: <500ms
- [ ] Stock list: <1 second
- [ ] Dashboard: <2 seconds
- [ ] Report generation: <5 seconds

**Performance UAT Result:** ⏳ Pending

---

## END-TO-END WORKFLOW TEST

**Complete Transaction Cycle:**

1. [ ] Create Product (from Phase 3)
2. [ ] Create Supplier (from Phase 3)
3. [ ] Create PO (draft) with product
4. [ ] Submit PO (pending)
5. [ ] Approve PO (approved)
6. [ ] Create GRN against PO with batch info
7. [ ] Post GRN
   - [ ] Verify batch created
   - [ ] Verify stock increased
   - [ ] Verify movement created
   - [ ] Verify PO updated to "Received"
8. [ ] View product in Stock Management
   - [ ] Verify stock correct
   - [ ] Verify batch visible
   - [ ] Verify supplier linked
9. [ ] Create stock adjustment (e.g., physical count shortage)
10. [ ] Post adjustment
    - [ ] Verify stock updated
    - [ ] Verify movement created
11. [ ] View Dashboard
    - [ ] Verify all KPIs updated
    - [ ] Verify inventory value correct
    - [ ] Verify no stale data
12. [ ] Run reports
    - [ ] Stock report shows product
    - [ ] Movement report shows transactions
    - [ ] Valuation report shows correct value
    - [ ] Purchase register shows PO and GRN
13. [ ] Test exports
    - [ ] CSV downloads
    - [ ] PDF works
    - [ ] Print works

**End-to-End UAT Result:** ⏳ Pending

---

## SIGN-OFF CRITERIA

Only proceed to Phase 6 (Production Release) when ALL of these are true:

- [ ] ✅ Production build passes
- [ ] ✅ All master data workflows work (Create, Read, Update, Delete, Restore, Toggle)
- [ ] ✅ Purchase Order workflow complete (Draft → Pending → Approved → Received)
- [ ] ✅ GRN atomic posting works (batches created, movements created, PO updated, stock updated)
- [ ] ✅ Batch management functional (search, filter, FIFO, expiry calculation)
- [ ] ✅ Stock management accurate (calculations correct, low stock alerts work)
- [ ] ✅ All 5 adjustment types work and create movements
- [ ] ✅ Dashboard updates in real-time without stale data
- [ ] ✅ All 9 reports load, filter, and export correctly
- [ ] ✅ Security tests pass (no SQL injection, proper error handling)
- [ ] ✅ Performance acceptable with test data volume
- [ ] ✅ No critical bugs found
- [ ] ✅ End-to-end workflow completes successfully
- [ ] ✅ Backup/rollback plan prepared
- [ ] ✅ Release tagged (e.g., inventory-v1.0.0)

---

## GO/NO-GO DECISION

**If all criteria met:** ✅ APPROVE FOR PRODUCTION  
**If critical issues found:** ❌ DEFER TO BUG FIXES  

---

**Document Version:** 1.0  
**Status:** Ready for UAT execution  
**Next Phase:** Phase 5 - UAT & Stabilization
