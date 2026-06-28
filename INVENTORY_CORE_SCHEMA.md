# INVENTORY MODULE - MIGRATION AUDIT

## REQUIRED MIGRATIONS (for Inventory module only)

### Phase 1 - Core Master Data (REQUIRED)
- ✅ `inventory_001_phase1_foundation.sql` - Products, Categories, Suppliers
- ✅ `inventory_001a_phase1_units_manufacturers.sql` - Units, Manufacturers  
- ✅ `inventory_001b_phase1_audit_logging.sql` - Audit Logs
- ✅ `inventory_001c_phase1_product_enhancements.sql` - Product fields

### Phase 2 - Purchase Management (REQUIRED)
- ✅ `inventory_002_phase2_purchases.sql` - Purchase Orders, Items
- ✅ `inventory_002a_phase2_purchases.sql` - Additional PO enhancements
- ✅ `inventory_002b_phase2_stock_transactions.sql` - Stock transactions

### Phase 3 - Stock Engine (REQUIRED)
- ✅ `inventory_003_phase3_stock_engine.sql` - Core stock engine
- ✅ `inventory_003a_phase3_stock_engine.sql` - Stock ledger

### Phase 4 - Batch & Expiry (REQUIRED)
- ✅ `inventory_004_phase4_batch_expiry.sql` - Batch management, expiry tracking

### Phase 8 - Adjustments (REQUIRED)
- ✅ `inventory_008_phase8_adjustments.sql` - Stock adjustments

### Phase 9 - Reporting (REQUIRED)
- ✅ `inventory_009_phase9_reporting.sql` - Reports and views

### Phase 10 - Settings (REQUIRED)
- ✅ `inventory_010_phase10_settings.sql` - Inventory settings only

---

## EXCLUDED MIGRATIONS (NOT part of Inventory module)

### Phase 4 - Sales (EXCLUDED - Not for inventory)
- ❌ `inventory_004a_phase4_sales.sql` - Sales & Dispensing (CRM/POS module)

### Phase 5 - Prescriptions & Sales (EXCLUDED - Patient/Clinical module)
- ❌ `inventory_005_phase5_sales.sql` - Sales
- ❌ `inventory_005a_phase5_prescriptions.sql` - Prescriptions

### Phase 6 - Treatment (EXCLUDED - Clinical/Treatment module)
- ❌ `inventory_006_phase6_treatments.sql` - Treatment execution
- ❌ `inventory_006_phase6_treatment_consumption.sql` - Treatment consumption

### Phase 7 - Finance & Oil (EXCLUDED - Finance & Analytics module)
- ❌ `inventory_007_phase7_finance.sql` - Finance/Billing
- ❌ `inventory_007_phase7_oil_tracking.sql` - Oil analytics

### Phase 8 - CRM (EXCLUDED - CRM module)
- ❌ `inventory_008_phase8_crm.sql` - CRM, follow-ups

### Phase 9 - Analytics (EXCLUDED - General Analytics module)
- ❌ `inventory_009_phase9_analytics.sql` - General analytics (not inventory reports)

### Phase 11 - HRMS (EXCLUDED - HR module)
- ❌ `inventory_011_phase11_hrms.sql` - Human Resource Management

### Phase 12 - Portal (EXCLUDED - Patient Portal module)
- ❌ `inventory_012_phase12_portal.sql` - Patient Portal APIs

### Phase 13 - AI (EXCLUDED - AI module)
- ❌ `inventory_013_phase13_ai.sql` - AI Assistant

---

## DEPENDENCY GRAPH

```
PHASE 1: FOUNDATION
├── inventory_001_phase1_foundation.sql
│   ├── inventory_categories
│   ├── inventory_products
│   ├── inventory_suppliers
│   └── Indexes
├── inventory_001a_phase1_units_manufacturers.sql
│   ├── inventory_units
│   ├── manufacturers
│   └── product_suppliers (linking table)
├── inventory_001b_phase1_audit_logging.sql
│   └── inventory_audit_logs
└── inventory_001c_phase1_product_enhancements.sql
    └── Additional product fields

PHASE 2: PURCHASE MANAGEMENT
├── inventory_002_phase2_purchases.sql
│   ├── purchase_orders
│   ├── purchase_order_items
│   └── grn (goods_receipt_notes)
├── inventory_002a_phase2_purchases.sql
│   └── GRN enhancements
└── inventory_002b_phase2_stock_transactions.sql
    ├── stock_transactions (base)
    └── stock_ledger (base)

PHASE 3: STOCK ENGINE
├── inventory_003_phase3_stock_engine.sql
│   ├── stock_transactions (enhanced)
│   └── batch_movements
└── inventory_003a_phase3_stock_engine.sql
    ├── stock_ledger (enhanced)
    ├── current_stock_view
    └── Stock calculations

PHASE 4: BATCH & EXPIRY
└── inventory_004_phase4_batch_expiry.sql
    ├── inventory_batches
    ├── batch_expiry_tracking
    └── FIFO calculations

PHASE 8: ADJUSTMENTS
└── inventory_008_phase8_adjustments.sql
    ├── stock_adjustments
    ├── adjustment_items
    ├── damage_register
    └── Approval workflows

PHASE 9: REPORTING
└── inventory_009_phase9_reporting.sql
    ├── Low stock views
    ├── Expiring stock views
    ├── Current stock reports
    ├── Stock movement reports
    └── Valuation reports

PHASE 10: SETTINGS
└── inventory_010_phase10_settings.sql
    └── inventory_settings (only)
```

---

## TABLES IN INVENTORY CORE

### Master Data
- inventory_categories
- inventory_products
- inventory_units
- manufacturers
- product_suppliers
- inventory_suppliers

### Transactions
- purchase_orders
- purchase_order_items
- goods_receipt_notes (GRN)
- inventory_batches
- stock_transactions
- stock_ledger

### Adjustments & Maintenance
- stock_adjustments
- adjustment_items
- damage_register

### Auditing
- inventory_audit_logs

### Settings
- inventory_settings

### Views (for reporting)
- current_stock_view
- low_stock_view
- expiring_stock_view
- valuation_report_view

---

## FILES TO CREATE

1. **inventory_core.sql** - Combined migration with only required tables (1,500 lines)
2. **INVENTORY_CORE_SCHEMA.md** - This audit document
3. **inventory_core/** - Optional: Directory with phase files if using modular approach

---

## USAGE

### Option A: Single File
```sql
-- In Supabase SQL Editor, paste entire inventory_core.sql and run
```

### Option B: Phases (if using modular approach)
```sql
-- Phase 1: Foundation
\i 'inventory_core/phase1_foundation.sql'

-- Phase 2: Purchases
\i 'inventory_core/phase2_purchases.sql'

-- And so on...
```

---

## VERIFICATION

After applying migrations:

```sql
-- Verify all required tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name LIKE 'inventory_%'
OR table_name IN ('purchase_orders', 'manufacturers', 'stock_%')
ORDER BY table_name;

-- Expected: 20+ inventory-specific tables
```

---

## FRONTEND SUPPORT

These migrations support the following Inventory module pages:

- ✅ Products
- ✅ Categories
- ✅ Units
- ✅ Manufacturers
- ✅ Suppliers
- ✅ Product Suppliers
- ✅ Purchase Orders
- ✅ GRN
- ✅ Batches
- ✅ Current Stock
- ✅ Stock Ledger
- ✅ Stock Transactions
- ✅ Stock Adjustments
- ✅ Low Stock
- ✅ Expiring Stock
- ✅ Inventory Reports
- ✅ Inventory Settings

---

## NOT INCLUDED

These modules are excluded from Inventory Core:

- ❌ CRM (Patient follow-ups, communications)
- ❌ HRMS (Employee, attendance)
- ❌ Finance (Invoices, billing)
- ❌ Patient Portal (APIs, webhooks)
- ❌ AI Assistant (Automations)
- ❌ Sales/Dispensing (Point of Sale)
- ❌ Prescriptions (Clinical)
- ❌ Treatments (Panchakarma execution)
- ❌ Analytics (General BI)

---

## NEXT STEPS

1. ✅ Audit complete
2. ⏳ Generate inventory_core.sql
3. ⏳ Apply to Supabase database
4. ⏳ Test Products API
5. ⏳ Resume frontend implementation (Phase 16.2)
