-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 001: SCHEMA
-- Clean-slate. Drops all previous inventory tables.
-- Run order: 001 → 002 → 003 → 004 → 005
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 0: DROP PREVIOUS INVENTORY SCHEMA (clean slate)
-- ============================================================

DROP TABLE IF EXISTS inventory_audit_logs          CASCADE;
DROP TABLE IF EXISTS adjustment_items              CASCADE;
DROP TABLE IF EXISTS stock_adjustments             CASCADE;
DROP TABLE IF EXISTS stock_ledger                  CASCADE;
DROP TABLE IF EXISTS stock_transactions            CASCADE;
DROP TABLE IF EXISTS goods_receipt_notes           CASCADE;
DROP TABLE IF EXISTS purchase_order_items          CASCADE;
DROP TABLE IF EXISTS purchase_orders               CASCADE;
DROP TABLE IF EXISTS inventory_batches             CASCADE;
DROP TABLE IF EXISTS product_suppliers             CASCADE;
DROP TABLE IF EXISTS inventory_products            CASCADE;
DROP TABLE IF EXISTS inventory_units               CASCADE;
DROP TABLE IF EXISTS inventory_categories          CASCADE;
DROP TABLE IF EXISTS inventory_settings            CASCADE;
DROP TABLE IF EXISTS manufacturers                 CASCADE;
DROP TABLE IF EXISTS suppliers                     CASCADE;

-- new v2 names (idempotent re-runs)
DROP TABLE IF EXISTS inv_product_documents         CASCADE;
DROP TABLE IF EXISTS inv_product_images            CASCADE;
DROP TABLE IF EXISTS inv_audit_log                 CASCADE;
DROP TABLE IF EXISTS inv_stock_adjustment_items    CASCADE;
DROP TABLE IF EXISTS inv_stock_adjustments         CASCADE;
DROP TABLE IF EXISTS inv_stock_movements           CASCADE;
DROP TABLE IF EXISTS inv_product_batches           CASCADE;
DROP TABLE IF EXISTS inv_goods_receipt_items       CASCADE;
DROP TABLE IF EXISTS inv_goods_receipts            CASCADE;
DROP TABLE IF EXISTS inv_purchase_order_items      CASCADE;
DROP TABLE IF EXISTS inv_purchase_orders           CASCADE;
DROP TABLE IF EXISTS inv_products                  CASCADE;
DROP TABLE IF EXISTS inv_suppliers                 CASCADE;
DROP TABLE IF EXISTS inv_manufacturers             CASCADE;
DROP TABLE IF EXISTS inv_units                     CASCADE;
DROP TABLE IF EXISTS inv_categories                CASCADE;
DROP TABLE IF EXISTS inv_tax_master                CASCADE;
DROP TABLE IF EXISTS inv_warehouse_locations       CASCADE;
DROP TABLE IF EXISTS inv_warehouses                CASCADE;
DROP TABLE IF EXISTS inv_settings                  CASCADE;


-- ============================================================
-- STEP 1: MASTER DATA — Settings, Categories, Units,
--         Tax, Manufacturers, Suppliers
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: inv_settings
-- Global inventory configuration. Key-value store.
-- Prefix formats, alert thresholds, GST toggles, etc.
-- ------------------------------------------------------------
CREATE TABLE inv_settings (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key       TEXT        NOT NULL UNIQUE,
  setting_value     TEXT,
  setting_type      TEXT        NOT NULL DEFAULT 'text'
                    CHECK (setting_type IN ('text','number','boolean','json')),
  description       TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE inv_settings IS
  'Global inventory configuration. All prefix formats, alert days, tax defaults stored here.';

-- ------------------------------------------------------------
-- TABLE: inv_categories
-- ------------------------------------------------------------
CREATE TABLE inv_categories (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  description       TEXT,
  display_order     INTEGER     NOT NULL DEFAULT 0,
  color             TEXT,                          -- hex colour for UI badges
  icon              TEXT,                          -- emoji or icon name
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_categories_name UNIQUE (name)
);

COMMENT ON TABLE inv_categories IS
  'Product categories. All category dropdowns must come from this table.';

-- ------------------------------------------------------------
-- TABLE: inv_units
-- ------------------------------------------------------------
CREATE TABLE inv_units (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  short_name        TEXT        NOT NULL,
  decimal_allowed   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_units_name       UNIQUE (name),
  CONSTRAINT uq_inv_units_short_name UNIQUE (short_name)
);

COMMENT ON TABLE inv_units IS
  'Units of measurement. Bottle, Strip, Tablet, ml, Gram, Kg, etc.';

-- ------------------------------------------------------------
-- TABLE: inv_tax_master
-- ------------------------------------------------------------
CREATE TABLE inv_tax_master (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name          TEXT        NOT NULL,
  tax_percentage    NUMERIC(5,2) NOT NULL CHECK (tax_percentage >= 0),
  hsn_code          TEXT,
  description       TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_tax_name UNIQUE (tax_name)
);

COMMENT ON TABLE inv_tax_master IS
  'GST tax rates. Products reference this for their applicable tax slab.';

-- ------------------------------------------------------------
-- TABLE: inv_manufacturers
-- ------------------------------------------------------------
CREATE TABLE inv_manufacturers (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_name TEXT        NOT NULL,
  contact_person    TEXT,
  mobile            TEXT,
  email             TEXT,
  gst_number        TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  pincode           TEXT,
  website           TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_manufacturer_name UNIQUE (manufacturer_name)
);

COMMENT ON TABLE inv_manufacturers IS
  'Product manufacturers. Distinct from suppliers (who you buy from).';

-- ------------------------------------------------------------
-- TABLE: inv_suppliers
-- ------------------------------------------------------------
CREATE TABLE inv_suppliers (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code     TEXT        NOT NULL,           -- auto-generated, format in inv_settings
  company_name      TEXT        NOT NULL,
  contact_person    TEXT,
  mobile            TEXT,
  email             TEXT,
  gst_number        TEXT,
  pan               TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT        NOT NULL DEFAULT 'India',
  pincode           TEXT,
  payment_terms     TEXT,
  credit_days       INTEGER     NOT NULL DEFAULT 0,
  -- banking
  bank_name         TEXT,
  account_number    TEXT,
  ifsc              TEXT,
  upi_id            TEXT,
  -- financial
  opening_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_limit      NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_supplier_code UNIQUE (supplier_code)
);

COMMENT ON TABLE inv_suppliers IS
  'Vendors/suppliers. supplier_code is auto-generated from inv_settings prefix.';


-- ============================================================
-- STEP 2: PRODUCT MASTER
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: inv_products
-- ------------------------------------------------------------
CREATE TABLE inv_products (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- identifiers
  product_code          TEXT        NOT NULL,       -- clinic-defined code
  sku                   TEXT,                        -- SKU / stock-keeping unit
  barcode               TEXT,                        -- EAN / barcode for scanning
  -- names
  product_name          TEXT        NOT NULL,
  generic_name          TEXT,                        -- generic / INN name
  -- classification
  category_uuid         UUID        NOT NULL REFERENCES inv_categories(uuid)      ON DELETE RESTRICT,
  manufacturer_uuid     UUID                 REFERENCES inv_manufacturers(uuid)   ON DELETE SET NULL,
  unit_uuid             UUID        NOT NULL REFERENCES inv_units(uuid)            ON DELETE RESTRICT,
  default_supplier_uuid UUID                 REFERENCES inv_suppliers(uuid)        ON DELETE SET NULL,
  -- pricing
  purchase_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_percentage        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  hsn_code              TEXT,
  -- stock thresholds
  minimum_stock         INTEGER     NOT NULL DEFAULT 0,
  reorder_level         INTEGER     NOT NULL DEFAULT 0,
  maximum_stock         INTEGER,
  minimum_order_qty     INTEGER     NOT NULL DEFAULT 1,
  maximum_order_qty     INTEGER,
  lead_time_days        INTEGER     NOT NULL DEFAULT 0,
  -- location
  storage_location      TEXT,
  rack_number           TEXT,
  shelf_number          TEXT,
  bin_number            TEXT,
  -- tracking flags
  batch_tracking        BOOLEAN     NOT NULL DEFAULT TRUE,
  expiry_tracking       BOOLEAN     NOT NULL DEFAULT TRUE,
  is_prescription       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_consumable         BOOLEAN     NOT NULL DEFAULT FALSE,
  is_service_item       BOOLEAN     NOT NULL DEFAULT FALSE,
  -- meta
  description           TEXT,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_product_code UNIQUE (product_code),
  CONSTRAINT uq_inv_product_barcode UNIQUE (barcode),
  CONSTRAINT chk_inv_product_prices CHECK (
    purchase_price >= 0 AND selling_price >= 0 AND mrp >= 0
  ),
  CONSTRAINT chk_inv_product_stock_levels CHECK (
    minimum_stock >= 0 AND reorder_level >= 0
    AND (maximum_stock IS NULL OR maximum_stock >= minimum_stock)
  )
);

COMMENT ON TABLE inv_products IS
  'Product master. One row per product SKU. batch_tracking and expiry_tracking '
  'drive whether GRN requires batch/expiry input.';

-- ------------------------------------------------------------
-- TABLE: inv_product_images
-- ------------------------------------------------------------
CREATE TABLE inv_product_images (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_uuid      UUID        NOT NULL REFERENCES inv_products(uuid) ON DELETE CASCADE,
  image_url         TEXT        NOT NULL,
  display_order     INTEGER     NOT NULL DEFAULT 0,
  is_primary        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE inv_product_images IS
  'Product images stored in Supabase Storage. image_url is the public URL.';

-- ------------------------------------------------------------
-- TABLE: inv_product_documents
-- ------------------------------------------------------------
CREATE TABLE inv_product_documents (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_uuid      UUID        NOT NULL REFERENCES inv_products(uuid) ON DELETE CASCADE,
  document_name     TEXT        NOT NULL,
  document_url      TEXT        NOT NULL,
  document_type     TEXT        NOT NULL DEFAULT 'other'
                    CHECK (document_type IN ('spec_sheet','msds','certificate','invoice','other')),
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE inv_product_documents IS
  'MSDS sheets, manufacturer certificates, invoices linked to products.';


-- ============================================================
-- STEP 3: WAREHOUSE (future-ready)
-- ============================================================

CREATE TABLE inv_warehouses (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_name    TEXT        NOT NULL,
  address           TEXT,
  is_default        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_warehouse_name UNIQUE (warehouse_name)
);

CREATE TABLE inv_warehouse_locations (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_uuid    UUID        NOT NULL REFERENCES inv_warehouses(uuid) ON DELETE CASCADE,
  location_code     TEXT        NOT NULL,
  location_name     TEXT        NOT NULL,           -- e.g. Rack A / Shelf 3 / Bin 12
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_wh_location UNIQUE (warehouse_uuid, location_code)
);


-- ============================================================
-- STEP 4: PURCHASE ORDERS
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: inv_purchase_orders
-- ------------------------------------------------------------
CREATE TABLE inv_purchase_orders (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number             TEXT        NOT NULL,
  supplier_uuid         UUID        NOT NULL REFERENCES inv_suppliers(uuid) ON DELETE RESTRICT,
  order_date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  -- approval workflow
  status                TEXT        NOT NULL DEFAULT 'draft'
                        CHECK (status IN (
                          'draft',
                          'pending',
                          'approved',
                          'partially_received',
                          'received',
                          'cancelled'
                        )),
  approved_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at           TIMESTAMPTZ,
  -- financials
  subtotal_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- meta
  remarks               TEXT,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_po_number UNIQUE (po_number),
  CONSTRAINT chk_inv_po_amounts CHECK (
    subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
  )
);

COMMENT ON TABLE inv_purchase_orders IS
  'Purchase order header. Status flow: draft→pending→approved→partially_received→received.';

-- ------------------------------------------------------------
-- TABLE: inv_purchase_order_items
-- ------------------------------------------------------------
CREATE TABLE inv_purchase_order_items (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_uuid   UUID        NOT NULL REFERENCES inv_purchase_orders(uuid) ON DELETE CASCADE,
  product_uuid          UUID        NOT NULL REFERENCES inv_products(uuid)         ON DELETE RESTRICT,
  ordered_quantity      NUMERIC(12,2) NOT NULL CHECK (ordered_quantity > 0),
  received_quantity     NUMERIC(12,2) NOT NULL DEFAULT 0,  -- updated as GRNs arrive
  unit_rate             NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent      NUMERIC(5,2)  NOT NULL DEFAULT 0,
  gst_percentage        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  line_amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_inv_poi_qty CHECK (
    ordered_quantity > 0 AND received_quantity >= 0
    AND received_quantity <= ordered_quantity * 1.05  -- allow 5% over-receipt
  )
);

COMMENT ON TABLE inv_purchase_order_items IS
  'PO line items. received_quantity is updated on each GRN posting.';


-- ============================================================
-- STEP 5: GOODS RECEIPT (GRN)
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: inv_goods_receipts
-- ------------------------------------------------------------
CREATE TABLE inv_goods_receipts (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number            TEXT        NOT NULL,
  purchase_order_uuid   UUID        REFERENCES inv_purchase_orders(uuid) ON DELETE RESTRICT,
  supplier_uuid         UUID        NOT NULL REFERENCES inv_suppliers(uuid) ON DELETE RESTRICT,
  invoice_number        TEXT,
  invoice_date          DATE,
  received_date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  received_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- status: draft until posted; posting triggers batches + movements
  status                TEXT        NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','posted','cancelled')),
  total_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  remarks               TEXT,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_grn_number UNIQUE (grn_number)
);

COMMENT ON TABLE inv_goods_receipts IS
  'GRN header. Posting (status: draft→posted) triggers batch creation and stock movements.';

-- ------------------------------------------------------------
-- TABLE: inv_goods_receipt_items
-- ------------------------------------------------------------
CREATE TABLE inv_goods_receipt_items (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_uuid              UUID        NOT NULL REFERENCES inv_goods_receipts(uuid)   ON DELETE CASCADE,
  product_uuid          UUID        NOT NULL REFERENCES inv_products(uuid)          ON DELETE RESTRICT,
  po_item_uuid          UUID        REFERENCES inv_purchase_order_items(uuid)       ON DELETE SET NULL,
  -- batch info
  batch_number          TEXT        NOT NULL,
  manufacturing_date    DATE,
  expiry_date           DATE,
  -- pricing
  mrp                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  purchase_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- quantities
  received_qty          NUMERIC(12,2) NOT NULL CHECK (received_qty > 0),
  free_qty              NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- tax
  gst_percentage        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  line_amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_inv_grni_qty CHECK (received_qty > 0 AND free_qty >= 0)
);

COMMENT ON TABLE inv_goods_receipt_items IS
  'GRN line items. On posting, each row creates/updates a product_batch and inserts a stock_movement.';


-- ============================================================
-- STEP 6: PRODUCT BATCHES
-- ============================================================

CREATE TABLE inv_product_batches (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_uuid          UUID        NOT NULL REFERENCES inv_products(uuid)      ON DELETE RESTRICT,
  batch_number          TEXT        NOT NULL,
  manufacturing_date    DATE,
  expiry_date           DATE,
  -- pricing snapshot at receipt time
  purchase_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- quantities
  received_quantity     NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- available_quantity is a TRIGGER-MAINTAINED CACHE.
  -- Source of truth = inv_stock_movements.
  -- Can always be rebuilt with: fn_rebuild_batch_quantity(batch_uuid)
  available_quantity    NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- origin
  supplier_uuid         UUID        REFERENCES inv_suppliers(uuid)              ON DELETE SET NULL,
  grn_uuid              UUID        REFERENCES inv_goods_receipts(uuid)         ON DELETE SET NULL,
  -- status
  status                TEXT        NOT NULL DEFAULT 'good'
                        CHECK (status IN ('good','quarantine','expired','damaged')),
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_batch_number UNIQUE (batch_number),
  CONSTRAINT chk_inv_batch_qty CHECK (
    received_quantity >= 0 AND available_quantity >= 0
  )
);

COMMENT ON TABLE inv_product_batches IS
  'One row per physical batch. available_quantity is a performance cache maintained '
  'by trigger on inv_stock_movements. Use fn_rebuild_batch_quantity() to recompute from movements.';


-- ============================================================
-- STEP 7: STOCK MOVEMENTS (IMMUTABLE LEDGER)
-- ============================================================

CREATE TABLE inv_stock_movements (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_uuid      UUID        NOT NULL REFERENCES inv_products(uuid)        ON DELETE RESTRICT,
  batch_uuid        UUID        REFERENCES inv_product_batches(uuid)          ON DELETE RESTRICT,
  -- what happened
  movement_type     TEXT        NOT NULL
                    CHECK (movement_type IN (
                      'PURCHASE',
                      'SALE',
                      'RETURN',
                      'TRANSFER',
                      'ADJUSTMENT',
                      'CONSUMPTION',
                      'EXPIRED',
                      'DAMAGED'
                    )),
  -- quantity is ALWAYS POSITIVE. Direction is implied by movement_type.
  -- PURCHASE / RETURN / ADJUSTMENT(increase) = stock IN
  -- SALE / CONSUMPTION / EXPIRED / DAMAGED / ADJUSTMENT(decrease) = stock OUT
  quantity          NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  -- snapshot of batch available_quantity at the moment of this movement
  before_stock      NUMERIC(12,2) NOT NULL,
  after_stock       NUMERIC(12,2) NOT NULL,
  -- soft reference to source document (no FK — many possible sources)
  reference_type    TEXT,         -- 'GRN' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | etc.
  reference_uuid    UUID,         -- UUID of the source document
  -- audit
  remarks           TEXT,
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NO updated_at — this table is APPEND-ONLY. Never update a movement row.
  CONSTRAINT chk_inv_movement_stock CHECK (before_stock >= 0)
);

COMMENT ON TABLE inv_stock_movements IS
  'IMMUTABLE LEDGER. Every inventory change creates one row here. '
  'NEVER UPDATE OR DELETE rows from this table. '
  'quantity is always positive. Direction determined by movement_type. '
  'before_stock and after_stock are snapshots for audit trail.';

-- Prevent updates and deletes on stock_movements at the DB level
-- (enforced via trigger in 003_triggers.sql)


-- ============================================================
-- STEP 8: STOCK ADJUSTMENTS
-- ============================================================

CREATE TABLE inv_stock_adjustments (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number     TEXT        NOT NULL,
  adjustment_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  reason                TEXT        NOT NULL
                        CHECK (reason IN (
                          'PHYSICAL_COUNT',
                          'DAMAGE',
                          'EXPIRED',
                          'LOST',
                          'CORRECTION'
                        )),
  notes                 TEXT,
  status                TEXT        NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','approved','cancelled')),
  -- approval trail
  approved_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at           TIMESTAMPTZ,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inv_adj_number UNIQUE (adjustment_number)
);

COMMENT ON TABLE inv_stock_adjustments IS
  'Stock adjustment header. Posting approved adjustments creates stock_movement rows.';

CREATE TABLE inv_stock_adjustment_items (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_uuid       UUID        NOT NULL REFERENCES inv_stock_adjustments(uuid) ON DELETE CASCADE,
  product_uuid          UUID        NOT NULL REFERENCES inv_products(uuid)           ON DELETE RESTRICT,
  batch_uuid            UUID        REFERENCES inv_product_batches(uuid)             ON DELETE RESTRICT,
  adjustment_type       TEXT        NOT NULL
                        CHECK (adjustment_type IN ('INCREASE','DECREASE')),
  system_qty            NUMERIC(12,2) NOT NULL DEFAULT 0,   -- qty before adjustment
  physical_qty          NUMERIC(12,2) NOT NULL DEFAULT 0,   -- counted / new qty
  difference            NUMERIC(12,2) NOT NULL DEFAULT 0,   -- physical - system (can be negative)
  reason_note           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inv_stock_adjustment_items IS
  'Adjustment line items. On approval, each row creates a stock_movement.';


-- ============================================================
-- STEP 9: AUDIT LOG
-- ============================================================

CREATE TABLE inv_audit_log (
  uuid              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module            TEXT        NOT NULL,   -- 'PRODUCT' | 'PO' | 'GRN' | 'ADJUSTMENT' | etc.
  action            TEXT        NOT NULL,   -- 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'POST'
  record_uuid       UUID,                   -- UUID of the affected record
  old_value         JSONB,
  new_value         JSONB,
  performed_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address        TEXT,
  user_agent        TEXT
);

COMMENT ON TABLE inv_audit_log IS
  'Audit trail for all critical inventory actions. Append-only.';

COMMIT;
