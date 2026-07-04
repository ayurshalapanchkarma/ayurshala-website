# Production Readiness Smoke Test
## Inventory Module v1.0 - Go-Live Certification

**Objective:** Verify critical path functionality and catch blocking issues  
**Time Budget:** ~2-3 hours total  
**Pass/Fail:** Simple - all stages must pass or issues must be fixed before go-live  

---

## Stage 1: Build & Runtime (15–20 min)

### Build Production
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] Zero critical warnings
- [ ] Production bundle created

### Start Development Server
```bash
npm run dev
```
- [ ] Server starts without crashes
- [ ] No startup exceptions in logs

### Verify Pages Load
Navigate to each inventory page:
- [ ] http://localhost:3000/admin/inventory/purchase-orders
- [ ] http://localhost:3000/admin/inventory/grns
- [ ] http://localhost:3000/admin/inventory/batches
- [ ] http://localhost:3000/admin/inventory/stock
- [ ] http://localhost:3000/admin/inventory/adjustments
- [ ] http://localhost:3000/admin/inventory/dashboard
- [ ] http://localhost:3000/admin/inventory/reports

For each page:
- [ ] Page loads without errors
- [ ] No console errors (F12 → Console)
- [ ] No red server logs
- [ ] UI renders correctly
- [ ] No infinite loading spinners

### Verify API Routes

Test key endpoints (using curl or Postman):
```bash
# Test GET endpoints - should return 200
curl http://localhost:3000/api/inventory/purchase-orders
curl http://localhost:3000/api/inventory/grns
curl http://localhost:3000/api/inventory/stock
curl http://localhost:3000/api/inventory/batches
curl http://localhost:3000/api/inventory/dashboard

# All should return 200 (not 500)
```

**Stage 1 Result:** ⏳ Pending

---

## Stage 2: End-to-End Inventory Flow (45–60 min)

**Objective:** One complete transaction from supplier to dashboard update

### Step 1: Create Supplier (Phase 3)
- [ ] Go to Suppliers page
- [ ] Click "New Supplier"
- [ ] Fill form (name, contact, address)
- [ ] Save
- [ ] Verify appears in list
- [ ] Note supplier UUID for next step

### Step 2: Create Product (Phase 3)
- [ ] Go to Products page
- [ ] Click "New Product"
- [ ] Fill form (name, code, category, unit)
- [ ] Set Reorder Level: 100
- [ ] Set Min Stock: 50
- [ ] Save
- [ ] Verify appears in list
- [ ] Note product UUID for next step

### Step 3: Create Purchase Order
- [ ] Go to Purchase Orders page
- [ ] Click "New Purchase Order"
- [ ] Select supplier (from Step 1)
- [ ] Add line item: product (from Step 2), qty=100, price=500
- [ ] Verify total calculated
- [ ] Click "Save as Draft"
- [ ] Verify PO number auto-generated
- [ ] Verify status is "Draft"
- [ ] Note PO UUID

### Step 4: Submit for Approval
- [ ] Open the PO (from Step 3)
- [ ] Click "Submit"
- [ ] Verify status changed to "Pending"
- [ ] Cannot edit after submission

### Step 5: Approve PO
- [ ] Open the PO
- [ ] Click "Approve"
- [ ] Verify status changed to "Approved"
- [ ] Verify approved_by timestamp set

### Step 6: Create GRN
- [ ] Go to GRN page
- [ ] Click "New GRN"
- [ ] Select the approved PO
- [ ] Verify PO reference pre-filled
- [ ] Verify supplier pre-filled
- [ ] Verify product items pre-populated
- [ ] Add batch info:
  - [ ] Batch number: "BATCH-001"
  - [ ] Expiry date: (90+ days from now)
  - [ ] MRP: 600
  - [ ] Purchase price: 500
  - [ ] Selling price: 600
  - [ ] Quantity: 100
- [ ] Click "Save as Draft"
- [ ] Verify GRN number auto-generated
- [ ] Note GRN UUID

### Step 7: Post GRN (CRITICAL ATOMIC OPERATION)
- [ ] Open the GRN
- [ ] Click "Post"
- [ ] **ATOMIC VERIFICATION:** All of the following must happen:

**Verify Batch Created:**
- [ ] Go to Batch Management
- [ ] Search for "BATCH-001"
- [ ] Verify batch appears with:
  - [ ] Product name correct
  - [ ] Supplier name correct
  - [ ] Available quantity = 100
  - [ ] Expiry date correct

**Verify Stock Increased:**
- [ ] Go to Stock Management
- [ ] Search for product name
- [ ] Verify current stock = 100
- [ ] Verify batch count = 1

**Verify Stock Movement Created:**
- [ ] Go to Stock Movements (via API or internal page)
- [ ] Verify movement type = "PURCHASE"
- [ ] Verify quantity = 100

**Verify PO Updated:**
- [ ] Go back to PO
- [ ] Verify status changed to "Received"
- [ ] Verify received_quantity updated

**Verify Dashboard Updated:**
- [ ] Go to Dashboard
- [ ] Verify "Inventory Value" increased by (100 × 500)
- [ ] Verify "Current Stock" updated
- [ ] Verify "Posted GRNs" count increased
- [ ] **Wait 30 seconds, refresh, verify values persist** (no stale data)

### Step 8: Stock Adjustment
- [ ] Go to Stock Adjustments
- [ ] Click "New Adjustment"
- [ ] Select product (from Step 2)
- [ ] Type: Decrease
- [ ] Quantity: 10
- [ ] Reason: PHYSICAL_COUNT
- [ ] Save

### Step 9: Post Adjustment
- [ ] Open adjustment
- [ ] Click "Post"
- [ ] Verify status = "Approved"

### Step 10: Verify Stock Changed
- [ ] Go to Stock Management
- [ ] Search for product
- [ ] Verify current stock = 90 (was 100, adjusted -10)

### Step 11: Verify Dashboard Updated
- [ ] Go to Dashboard
- [ ] Verify "Current Stock" shows 90
- [ ] Verify "Inventory Value" decreased by (10 × 500)
- [ ] Verify values correct (no stale data)

### Step 12: Verify Reports Updated
- [ ] Go to Reports → Current Stock Report
- [ ] Verify product listed with 90 units
- [ ] Verify inventory value correct

**End-to-End Result:** ⏳ Pending

---

## Stage 3: CRUD Smoke Test (30 min)

Test basic operations for each master module.

### Categories
- [ ] Create category
- [ ] Edit category name
- [ ] Search by name - works
- [ ] Toggle active status
- [ ] Delete category (soft delete)
- [ ] Verify deleted in list
- [ ] Restore category
- [ ] Verify restored

### Units
- [ ] Create unit
- [ ] Edit unit
- [ ] Search - works
- [ ] Toggle status
- [ ] Delete

### Manufacturers
- [ ] Create manufacturer with GSTIN
- [ ] Edit GSTIN - validation works (must be 15 chars)
- [ ] Delete manufacturer
- [ ] Restore

### Suppliers
- [ ] Create supplier with all fields
- [ ] Auto-generated code appears (SUP-XXXXXX)
- [ ] Edit supplier
- [ ] Email validation works
- [ ] Delete
- [ ] Restore

### Products
- [ ] Create product with all fields
- [ ] Auto-generated code appears (PRD-XXXXXX)
- [ ] Edit product
- [ ] Link to category works
- [ ] Link to unit works
- [ ] Reorder level set
- [ ] Delete
- [ ] Restore

**CRUD Result:** ⏳ Pending

---

## Stage 4: Transaction Smoke Test (30 min)

### Purchase Orders
- [ ] Create PO - works
- [ ] Search by PO number - works
- [ ] Filter by status (Draft, Pending, Approved) - works
- [ ] Pagination - works
- [ ] Edit draft - works
- [ ] Cannot edit approved - blocked
- [ ] Delete draft (cancel) - works
- [ ] Detail page loads - works

### GRNs
- [ ] Create GRN - works
- [ ] Search by GRN number - works
- [ ] Filter by status - works
- [ ] Pagination - works
- [ ] Detail page shows items - works
- [ ] Cannot edit posted - blocked
- [ ] Post GRN - status changes

### Batches
- [ ] Search batch by batch number - works
- [ ] Filter by status (Good, Expiring, Expired) - works
- [ ] Expiring Soon shows batches ≤90 days - works
- [ ] FIFO ordering (nearest expiry first) - works
- [ ] Pagination - works
- [ ] Days to expiry calculated - correct

### Stock
- [ ] Current stock shows all products - works
- [ ] Search by product name - works
- [ ] Filter low stock - shows only below reorder - works
- [ ] Pagination - works
- [ ] Inventory value calculated - correct

### Adjustments
- [ ] Create adjustment - works
- [ ] All adjustment types available (Increase, Decrease, Damage, Expired, Physical Count)
- [ ] Search by adjustment number - works
- [ ] Filter by reason - works
- [ ] Filter by status - works
- [ ] Post adjustment - status changes
- [ ] Verify movement created

**Transactions Result:** ⏳ Pending

---

## Stage 5: Reports (15–20 min)

Test all 9 reports.

### Current Stock Report
- [ ] Opens without errors
- [ ] Shows all products
- [ ] Totals visible
- [ ] CSV export - file downloads
- [ ] PDF export - opens print dialog

### Stock Movement Report
- [ ] Opens without errors
- [ ] Shows movements
- [ ] Filter by date - works
- [ ] CSV export - works

### Inventory Valuation
- [ ] Opens without errors
- [ ] Total value shown
- [ ] Sorted by value - works
- [ ] CSV export - works

### Purchase Register
- [ ] Opens without errors
- [ ] Shows POs and linked GRNs
- [ ] Totals correct
- [ ] CSV export - works

### Batch Report
- [ ] Opens without errors
- [ ] Shows all batches
- [ ] Expiry info visible
- [ ] CSV export - works

### Expiry Report
- [ ] Opens without errors
- [ ] Shows only ≤90 days
- [ ] Sorted by expiry - works
- [ ] CSV export - works

### Low Stock Report
- [ ] Opens without errors
- [ ] Shows only below reorder level
- [ ] CSV export - works

### Dead Stock Report
- [ ] Opens without errors
- [ ] Shows non-moving stock
- [ ] CSV export - works

### Product Ledger
- [ ] Opens without errors
- [ ] Shows movements for product
- [ ] CSV export - works

**Reports Result:** ⏳ Pending

---

## Stage 6: Dashboard (10 min)

- [ ] Dashboard loads without errors
- [ ] All KPI cards visible
- [ ] Stock Overview section loads
- [ ] Critical Alerts section loads
- [ ] Purchase Orders section loads
- [ ] GRN section loads
- [ ] Last Updated timestamp shown and current
- [ ] Auto-refresh happening (wait 30 seconds, values refresh)
- [ ] Inventory Value calculated correctly
- [ ] Current Stock sum correct
- [ ] Low Stock count accurate
- [ ] Pending value correct
- [ ] Today's GRN value shown

**Dashboard Result:** ⏳ Pending

---

## Stage 7: Security (10 min)

### Invalid Data Handling
- [ ] Try creating PO with no items - rejected with error
- [ ] Try creating GRN with no supplier - rejected with error
- [ ] Try leaving required fields blank - validation error shown
- [ ] Error messages are helpful (not technical jargon)

### Invalid IDs
- [ ] Try accessing `/api/inventory/purchase-orders/invalid-uuid`
- [ ] Returns 404 (not 500)
- [ ] No stack trace visible

### Duplicate Prevention
- [ ] Try creating duplicate product name - prevented or warned
- [ ] Try creating duplicate supplier name - prevented or warned

### Unauthorized Access
- [ ] Try modifying record with wrong user ID - behaves appropriately
- [ ] No obvious unauthorized access paths

**Security Result:** ⏳ Pending

---

## Issues Found & Fixed

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| (Example) | Critical | ⏳ | (To be filled) |

---

## Summary Results

| Stage | Status | Notes |
|-------|--------|-------|
| 1: Build & Runtime | ⏳ | |
| 2: End-to-End Flow | ⏳ | |
| 3: CRUD Operations | ⏳ | |
| 4: Transactions | ⏳ | |
| 5: Reports | ⏳ | |
| 6: Dashboard | ⏳ | |
| 7: Security | ⏳ | |

---

## Pass/Fail Criteria

**PASS (Production Ready):**
- ✅ All stages pass
- ✅ No critical bugs
- ✅ No high-severity bugs
- ✅ End-to-end flow works
- ✅ Dashboard accurate
- ✅ Reports work
- ✅ No runtime errors

**FAIL (Not Ready):**
- ❌ Any stage fails
- ❌ Critical bugs found
- ❌ End-to-end flow breaks
- ❌ Runtime errors present
- ❌ Security issues found

---

## Final Assessment

**Date:** [To be filled]  
**Tester:** [To be filled]  
**Result:** ⏳ Pending  

**Known Limitations (if any):**
- [To be filled if issues found]

**Recommendation:**

✅ **PRODUCTION READY** - If all stages pass and no critical bugs remain  
❌ **NOT READY** - If any critical/high-severity issues found

---

**Document Version:** 1.0  
**Purpose:** Production smoke test for go-live certification  
**Time to Complete:** ~2-3 hours
