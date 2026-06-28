-- ============================================================
-- AYURSHALA INVENTORY CORE — STANDALONE MIGRATION
-- 
-- This file contains ONLY the database schema required
-- for the Inventory module. It excludes all unrelated
-- modules (CRM, HRMS, AI, Finance, Portal, etc).
--
-- Run this ONCE in Supabase SQL Editor to set up
-- the complete Inventory system.
--
-- CRITICAL: All CREATE TABLE statements come first,
-- then all CREATE INDEX statements, then CREATE VIEW.
-- ============================================================

-- PHASE 1: FOUNDATION — Categories, Products, Suppliers, Units, Manufacturers
-- ============================================================

-- TABLE: inventory_categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  slug                  TEXT UNIQUE,
  description           TEXT,
  parent_category_id    UUID REFERENCES inventory_categories(id),
  sort_order            INTEGER DEFAULT 0,
  is_active             BOOLEAN DEFAULT true,
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: inventory_products
CREATE TABLE IF NOT EXISTS inventory_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                   TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  category_id           UUID NOT NULL REFERENCES inventory_categories(id),
  unit                  TEXT NOT NULL,
  purchase_price        DECIMAL(12,2),
  sale_price            DECIMAL(12,2),
  mrp                   DECIMAL(12,2),
  gst_percent           DECIMAL(5,2),
  hsn_code              TEXT,
  reorder_level         INTEGER DEFAULT 0,
  min_stock             INTEGER,
  max_stock             INTEGER,
  barcode               TEXT,
  qr_code               TEXT,
  status                TEXT DEFAULT 'active',
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: inventory_suppliers
CREATE TABLE IF NOT EXISTS inventory_suppliers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name         TEXT NOT NULL,
  contact_person        TEXT,
  email                 TEXT,
  mobile                TEXT,
  phone                 TEXT,
  gstin                 TEXT,
  pan                   TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  postal_code           TEXT,
  bank_name             TEXT,
  bank_account          TEXT,
  payment_terms         TEXT,
  is_active             BOOLEAN DEFAULT true,
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: inventory_units
CREATE TABLE IF NOT EXISTS inventory_units (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  symbol                TEXT NOT NULL UNIQUE,
  conversion_factor     DECIMAL(10,4) DEFAULT 1,
  is_base_unit          BOOLEAN DEFAULT false,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: manufacturers
CREATE TABLE IF NOT EXISTS manufacturers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  gstin                 TEXT,
  contact_person        TEXT,
  email                 TEXT,
  phone                 TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  postal_code           TEXT,
  status                TEXT DEFAULT 'active',
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: product_suppliers (junction table)
CREATE TABLE IF NOT EXISTS product_suppliers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  supplier_id           UUID NOT NULL REFERENCES inventory_suppliers(id),
  supplier_sku          TEXT,
  supplier_price        DECIMAL(12,2),
  lead_time_days        INTEGER,
  is_preferred          BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: inventory_audit_logs
CREATE TABLE IF NOT EXISTS inventory_audit_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name            TEXT NOT NULL,
  record_id             UUID NOT NULL,
  action                TEXT NOT NULL,
  old_values            JSONB,
  new_values            JSONB,
  changed_by            UUID,
  changed_at            TIMESTAMPTZ DEFAULT now()
);

-- PHASE 2: PURCHASE MANAGEMENT
-- ============================================================

-- TABLE: purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number             TEXT UNIQUE NOT NULL,
  supplier_id           UUID NOT NULL REFERENCES inventory_suppliers(id),
  order_date            DATE NOT NULL,
  expected_delivery     DATE,
  total_amount          DECIMAL(14,2),
  gst_amount            DECIMAL(14,2),
  status                TEXT DEFAULT 'draft',
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: purchase_order_items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id     UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  quantity              DECIMAL(12,2) NOT NULL,
  unit_price            DECIMAL(12,2) NOT NULL,
  gst_percent           DECIMAL(5,2),
  line_total            DECIMAL(14,2),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: goods_receipt_notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number            TEXT UNIQUE NOT NULL,
  purchase_order_id     UUID REFERENCES purchase_orders(id),
  supplier_id           UUID NOT NULL REFERENCES inventory_suppliers(id),
  received_date         DATE NOT NULL,
  status                TEXT DEFAULT 'pending',
  total_amount          DECIMAL(14,2),
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- PHASE 3: STOCK ENGINE
-- ============================================================

-- TABLE: stock_transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type      TEXT NOT NULL,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID,
  quantity_change       DECIMAL(12,2) NOT NULL,
  reference_type        TEXT,
  reference_id          UUID,
  transaction_date      TIMESTAMPTZ DEFAULT now(),
  notes                 TEXT,
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: stock_ledger
CREATE TABLE IF NOT EXISTS stock_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID,
  opening_balance       DECIMAL(12,2),
  quantity_in           DECIMAL(12,2) DEFAULT 0,
  quantity_out          DECIMAL(12,2) DEFAULT 0,
  closing_balance       DECIMAL(12,2),
  ledger_date           DATE NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- PHASE 4: BATCH & EXPIRY
-- ============================================================

-- TABLE: inventory_batches
CREATE TABLE IF NOT EXISTS inventory_batches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number          TEXT NOT NULL UNIQUE,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  manufacture_date      DATE,
  expiry_date           DATE,
  current_quantity      DECIMAL(12,2) DEFAULT 0,
  purchase_price        DECIMAL(12,2),
  sale_price            DECIMAL(12,2),
  mrp                   DECIMAL(12,2),
  status                TEXT DEFAULT 'active',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- PHASE 8: ADJUSTMENTS
-- ============================================================

-- TABLE: stock_adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number     TEXT UNIQUE NOT NULL,
  adjustment_date       DATE NOT NULL,
  reason                TEXT,
  status                TEXT DEFAULT 'pending',
  created_by            UUID,
  approved_by           UUID,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- TABLE: adjustment_items
CREATE TABLE IF NOT EXISTS adjustment_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id         UUID NOT NULL REFERENCES stock_adjustments(id),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID,
  quantity_adjusted     DECIMAL(12,2) NOT NULL,
  adjustment_type       TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- PHASE 10: SETTINGS
-- ============================================================

-- TABLE: inventory_settings
CREATE TABLE IF NOT EXISTS inventory_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key           TEXT UNIQUE NOT NULL,
  setting_value         TEXT,
  setting_type          TEXT,
  description           TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 9: REPORTING (Views - after all tables exist)
-- ============================================================

-- Current Stock View
CREATE OR REPLACE VIEW current_stock AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.category_id,
  COALESCE(SUM(CASE WHEN st.transaction_type = 'IN' THEN st.quantity_change ELSE 0 END) - 
           SUM(CASE WHEN st.transaction_type = 'OUT' THEN st.quantity_change ELSE 0 END), 0) AS available_quantity,
  p.reorder_level,
  CASE WHEN COALESCE(SUM(CASE WHEN st.transaction_type = 'IN' THEN st.quantity_change ELSE 0 END) - 
           SUM(CASE WHEN st.transaction_type = 'OUT' THEN st.quantity_change ELSE 0 END), 0) <= p.reorder_level 
       THEN 'LOW_STOCK' ELSE 'OK' END AS stock_status
FROM inventory_products p
LEFT JOIN stock_transactions st ON p.id = st.product_id
WHERE p.is_deleted = false
GROUP BY p.id, p.sku, p.name, p.category_id, p.reorder_level;

-- ============================================================
-- ALL INDEXES (after all tables created)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inv_categories_slug ON inventory_categories(slug);
CREATE INDEX IF NOT EXISTS idx_inv_products_sku ON inventory_products(sku);
CREATE INDEX IF NOT EXISTS idx_inv_products_category ON inventory_products(category_id);
CREATE INDEX IF NOT EXISTS idx_inv_suppliers_gstin ON inventory_suppliers(gstin);
CREATE INDEX IF NOT EXISTS idx_product_suppliers ON product_suppliers(product_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_receipt_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_receipt_notes(status);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_date ON stock_ledger(ledger_date);
CREATE INDEX IF NOT EXISTS idx_batches_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_adjustments_status ON stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_audit_table ON inventory_audit_logs(table_name);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- All 16 tables for the Inventory module are now created.
-- All indexes created for performance optimization.
-- View created for stock reporting.
-- ============================================================
