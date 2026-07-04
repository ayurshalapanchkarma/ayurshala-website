# Ayurshala ERP - Complete Roadmap

## Vision

Transform Ayurshala from a clinic into a fully integrated ERP system where:
- Inventory is the backbone
- Billing consumes inventory automatically
- Operations generate insights automatically
- Everything is connected and real-time

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AYURSHALA ERP SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PHASE 4 (DONE) ✅ - INVENTORY BACKBONE                  │  │
│  │  ├─ Purchase Orders → GRN → Batches → Stock             │  │
│  │  ├─ Stock Movements & Adjustments                        │  │
│  │  ├─ Real-time Dashboard                                 │  │
│  │  ├─ Comprehensive Reports                               │  │
│  │  └─ Expiry & Low-Stock Tracking                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PHASE 5 - CLINICAL & PHARMACY OPERATIONS (Next)         │  │
│  │  ├─ Pharmacy Billing (consume inventory)                 │  │
│  │  ├─ OPD Billing (consultations + medicines)              │  │
│  │  ├─ IPD Billing (room + procedures + medicines)          │  │
│  │  ├─ Patient Ledger (outstanding + payments)              │  │
│  │  ├─ Barcode Support (scanning + printing)                │  │
│  │  ├─ Automatic Stock Deduction (FIFO)                     │  │
│  │  └─ Notifications (low stock, expiry, reminders)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PHASE 6 - CLINIC INTELLIGENCE                           │  │
│  │  ├─ Financial Dashboard                                  │  │
│  │  ├─ Revenue Reports                                      │  │
│  │  ├─ Medicine Consumption Trends                          │  │
│  │  ├─ Doctor-wise Statistics                               │  │
│  │  ├─ Supplier Performance Analysis                        │  │
│  │  ├─ ABC Analysis (inventory prioritization)              │  │
│  │  ├─ Dead Stock Analysis                                  │  │
│  │  └─ Predictive Reorder Suggestions                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PHASE 7 - AUTOMATION & SCALE                            │  │
│  │  ├─ WhatsApp Appointment Reminders                       │  │
│  │  ├─ Email Invoices                                       │  │
│  │  ├─ Auto Purchase Suggestions                            │  │
│  │  ├─ Scheduled Backups                                    │  │
│  │  ├─ SMS Notifications                                    │  │
│  │  ├─ Multi-branch Support                                 │  │
│  │  ├─ Vendor Portal                                        │  │
│  │  └─ Staff Attendance Integration                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Inventory Backbone ✅ COMPLETE

**Status:** Implementation complete, awaiting smoke test / go-live

**Core Functionality:**
- Purchase orders with approval workflow
- Goods receipt notes with atomic batch creation
- Real-time stock tracking by batch
- Batch management with expiry tracking
- Stock adjustments with audit trail
- Real-time dashboard
- Comprehensive reporting

**Database Tables:**
- inv_products
- inv_suppliers
- inv_product_batches
- inv_purchase_orders
- inv_goods_receipts
- inv_stock_movements
- inv_stock_adjustments

**API Endpoints:** 40+

**This becomes the single source of truth for all inventory operations.**

---

## Phase 5: Clinical & Pharmacy Operations (Next Priority)

**Timeline:** 4-6 weeks after Phase 4 stabilization  
**Dependencies:** Phase 4 must be stable and in production

### Module 1: Pharmacy Billing

**Workflow:**
```
Customer wants medicine
         ↓
Search product (barcode or name)
         ↓
Confirm batch + quantity
         ↓
Calculate price (MRP × quantity - discount + tax)
         ↓
Generate invoice
         ↓
AUTOMATIC: Deduct from stock (FIFO)
         ↓
AUTOMATIC: Create stock movement
         ↓
AUTOMATIC: Update inventory dashboard
         ↓
Process payment
         ↓
Print receipt / email invoice
```

**Key Features:**
- Product search by name, code, or barcode
- Batch selection (FIFO - show nearest expiry first)
- Quantity tracking (prevent overselling)
- Discount management (percentage, fixed, or scheme)
- GST calculation
- Invoice numbering (auto-generated)
- Payment methods (cash, card, UPI, credit)
- Returns handling (deduct from sale, credit stock)
- Credit notes (track returns)
- Reprint receipts

**Database Tables (New):**
- pharmacy_sales (header)
- pharmacy_sales_items (line items)
- pharmacy_returns
- pharmacy_payments
- pharmacy_credit_notes

**Integration Points:**
- Read from: inv_products, inv_product_batches, inv_suppliers
- Write to: inv_stock_movements (when stock deducted)
- Update: inv_product_batches (available_quantity decremented)
- Trigger: Dashboard recalculation

**APIs Needed:** 20+ endpoints

### Module 2: OPD Billing

**Workflow:**
```
Patient consultation
         ↓
Doctor prescribes medicines
         ↓
Consultation fee + medicines billed
         ↓
Medicines from pharmacy (auto stock deduction)
         ↓
Generate patient bill
         ↓
Payment processing
         ↓
Email/SMS receipt
```

**Key Features:**
- Consultation charges
- Procedure charges
- Medicine charges (from pharmacy)
- Packages (consultation + followups + medicines)
- Doctor fees percentage
- Insurance integration
- Payment plans
- Receipts

**Database Tables (New):**
- opd_consultations
- opd_bills
- opd_payments
- opd_packages

### Module 3: IPD Billing

**Workflow:**
```
Patient admitted
         ↓
Room assigned
         ↓
Treatment + procedures during stay
         ↓
Medicines from pharmacy (tracked)
         ↓
Nursing charges
         ↓
Upon discharge: Generate final bill
         ↓
Process payment
         ↓
Generate discharge bill
```

**Key Features:**
- Room charges (daily)
- Nursing charges
- Procedure charges
- Medicine tracking during stay
- Lab tests
- Imaging
- Final bill calculation
- Advance settlement
- Insurance claims

**Database Tables (New):**
- ipd_admissions
- ipd_room_charges
- ipd_procedure_charges
- ipd_medicines_issued (traced to pharmacy_sales)
- ipd_discharge_bills

### Module 4: Patient Ledger

**Tracks:**
- Total outstanding balance
- Payment history
- Advance payments
- Credit adjustments
- Insurance claims status

**Database Tables (New):**
- patient_ledger (summary)
- patient_transactions (detail)

### Module 5: Automatic Inventory Consumption

**Critical Integration:**
When pharmacy bill is posted:

```
1. AUTOMATIC FIFO Selection
   Select nearest-expiry batch(es) for each medicine

2. AUTOMATIC STOCK DEDUCTION
   batch.available_quantity -= sale_quantity
   
3. AUTOMATIC MOVEMENT CREATION
   CREATE stock_movement:
   - type: "PHARMACY_SALE"
   - product_uuid: (from medicine)
   - batch_uuid: (selected)
   - quantity: (sold)
   - reference: "PHARMA-SALE-{invoice_id}"
   
4. AUTOMATIC BATCH UPDATE
   If available_quantity = 0:
   - Mark batch complete
   - Remove from active stock
   
5. AUTOMATIC DASHBOARD UPDATE
   - Current Stock decremented
   - Inventory Value decreased
   - Low Stock alerts triggered if needed
   - Expiry alerts recalculated
```

**This is where inventory becomes truly operational - not just tracked, but actively consumed.**

### Module 6: Barcode Support

**Features:**
- Print barcode labels for products
- Barcode scanning during:
  - Pharmacy billing (quick product lookup)
  - GRN receiving (fast batch entry)
  - Stock audit (verify physical count)
  - Patient billing (medicine selection)

**Technology:**
- Barcode format: Code128 or QR code
- Print labels: Thermal printer support
- Scan devices: Mobile camera or USB barcode scanner
- Integration: Product → Batch lookup

### Module 7: Notifications

**Automated Alerts:**
- Low stock warnings (when below reorder level)
- Expiring medicines (30 days before expiry)
- Expired stock alerts (past expiry date)
- Purchase reminders (auto-suggest POs for low stock)
- Supplier reminders (follow up on pending GRNs)

**Channels:**
- In-app notifications
- Email alerts
- WhatsApp messages
- SMS (optional)

---

## Phase 6: Clinic Intelligence

**Timeline:** 6-8 weeks after Phase 5  
**Purpose:** Transform data into business insights

### Financial Dashboard
- Daily revenue
- Monthly revenue trend
- Payment method breakdown
- Outstanding receivables
- Insurance claims status
- Expense analysis

### Revenue Reports
- Revenue by doctor
- Revenue by treatment type
- Revenue by patient type (OPD/IPD)
- Revenue by payment method
- Average consultation fee
- Package performance

### Medicine Consumption Analysis
- Top-selling medicines
- Medicine usage by doctor
- Medicine usage by treatment type
- Medicine cost trends
- Stock turnover ratio

### Doctor Statistics
- Consultations per doctor
- Revenue per doctor
- Average treatment cost
- Patient satisfaction (if tracked)
- Prescription patterns

### Supplier Performance
- On-time delivery rate
- Quality issues
- Price trends
- Order frequency
- Payment terms compliance

### Inventory Analytics
- ABC Analysis (Pareto analysis of inventory)
  - A items: 20% of items, 80% of value
  - B items: 30% of items, 15% of value
  - C items: 50% of items, 5% of value
- Dead stock analysis (no movement in 6 months)
- Fast-moving items
- Slow-moving items
- Stock turnover by category
- Inventory carrying cost

### Predictive Suggestions
- Automatic reorder suggestions based on:
  - Average consumption rate
  - Reorder lead time
  - Current stock level
  - Expiry dates
- Suggested order quantity (EOQ calculation)
- Suggested supplier (based on performance)

---

## Phase 7: Automation & Scale

**Timeline:** 8-12 weeks after Phase 6  
**Purpose:** Reduce manual work, enable multi-location

### Automation Features

**WhatsApp Reminders:**
- Appointment confirmations
- Prescription reminders
- Follow-up reminders
- Payment due reminders

**Email Invoices:**
- Auto-send patient invoices
- Insurance claim emails
- Supplier order confirmations
- Payment receipts

**Auto Purchase Suggestions:**
- System analyzes consumption
- Generates PO drafts
- Staff reviews and approves
- Auto-order to preferred suppliers

**Scheduled Backups:**
- Daily database backups
- Auto-archive old transactions
- Disaster recovery testing

**SMS Notifications:**
- Critical alerts
- Payment reminders
- Appointment notifications

**Multi-branch Support:**
- Centralized inventory across branches
- Branch-wise reporting
- Consolidated financial reporting
- Shared supplier management
- Transfer between branches

**Vendor Portal:**
- Suppliers can view their POs
- Auto-generate invoices
- Track payment status
- Upload GRN confirmations

**Staff Integration:**
- Attendance tracking
- Shift management
- Performance metrics
- Payroll integration

---

## Integration Architecture

### Data Flow: Inventory → Billing → Analytics

```
PHARMACY BILLING
├─ Select medicine (from inv_products)
├─ Select batch (from inv_product_batches)
├─ Confirm quantity
├─ Generate invoice
│
└─> AUTOMATIC ACTIONS:
    ├─ Deduct stock: batch.available_quantity -= qty
    ├─ Create movement: inv_stock_movements (type: PHARMACY_SALE)
    ├─ Update inventory value: Σ(batch.qty × batch.purchase_price)
    ├─ Recalculate dashboard: All KPIs update
    ├─ Check alerts:
    │  ├─ Low stock? Notify
    │  ├─ Expiring soon? Alert
    │  └─ Out of stock? Prevent sale
    └─ Trigger analytics: Consumption trends

PATIENT LEDGER
├─ Record pharmacy sale as charge
├─ Track payment received
├─ Update outstanding balance
└─ Generate patient bill

ANALYTICS ENGINE
├─ Read: All transactions (pharmacy, OPD, IPD)
├─ Aggregate: Revenue, consumption, inventory
└─ Generate: Reports, trends, predictions
```

### The Inventory Becomes Living Data

Instead of:
- Manual stock updates
- Periodic inventory counts
- Guessing reorder points
- Unknown medicine consumption

You get:
- **Real-time stock** (updated on every sale)
- **Automatic movements** (every transaction traced)
- **Live insights** (know consumption instantly)
- **Smart predictions** (system suggests orders)
- **Complete audit trail** (every item tracked)

---

## Critical Success Factors

### 1. Inventory Must Be Stable First
- Phase 4 must be fully operational
- Stock accuracy verified
- Dashboard reliable
- Reports correct
- Then open to billing

### 2. FIFO Must Work Perfectly
- Batches sorted by expiry
- Nearest expiry selected automatically
- No manual intervention
- Audit trail clear

### 3. Stock Movement Tracking Must Be Automatic
- Never manually update stock
- Every sale creates movement
- Every adjustment creates movement
- Every GRN creates movement
- Complete audit trail

### 4. Real-Time Updates Essential
- Dashboard updates immediately after billing
- No stale data
- Analytics reflects current state
- Alerts triggered instantly

### 5. Integration Seamless
- Billing doesn't exist separately from inventory
- They're one system
- Data flows automatically
- No duplicate entry

---

## Timeline & Resource Plan

| Phase | Duration | Team | Priority |
|-------|----------|------|----------|
| Phase 4: Inventory | DONE ✅ | Backend + Frontend | COMPLETE |
| Stabilization | 1-2 weeks | DevOps + QA | NOW |
| Phase 5: Billing | 4-6 weeks | Backend + Frontend | NEXT |
| Phase 6: Analytics | 6-8 weeks | Backend + Data | AFTER P5 |
| Phase 7: Automation | 8-12 weeks | Backend + DevOps | FINAL |

**Total:** ~4 months from now for complete ERP

---

## Success Metrics After Phase 5

When Pharmacy Billing is live:

✅ Every pharmacy sale automatically deducts stock  
✅ Dashboard updates in real-time  
✅ Stock movements created for every transaction  
✅ FIFO batch selection automatic  
✅ Zero manual stock updates needed  
✅ Expiry alerts triggered automatically  
✅ Patient invoices generated automatically  
✅ Complete audit trail of all stock movement  

**At this point: Inventory + Billing = Integrated ERP**

---

## Why This Matters

**Today:** You have inventory software  
**After Phase 5:** You have clinic operations software  
**After Phase 6:** You have business intelligence system  
**After Phase 7:** You have enterprise ERP system

Each phase builds on the previous one. Inventory is the foundation everything else depends on.

---

## Next Actions (In Order)

1. ✅ **Stabilize & Release Phase 4** (this week)
2. ⏳ **Plan Phase 5** (next week)
3. ⏳ **Implement Pharmacy Billing** (4-6 weeks)
4. ⏳ **Implement OPD/IPD Billing** (4-6 weeks)
5. ⏳ **Build Analytics** (6-8 weeks)
6. ⏳ **Automate Operations** (8-12 weeks)

**The inventory you've built is the backbone of a complete ERP system.**

---

**Document Version:** 1.0  
**Purpose:** Long-term vision and roadmap  
**Scope:** 4-month complete ERP build  
**Current Phase:** 4 (Inventory) - stabilization and go-live  
**Next Phase:** 5 (Clinical & Pharmacy Operations)
