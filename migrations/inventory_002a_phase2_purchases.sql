-- ============================================================
-- PHASE 2: Purchase Management
-- Migration: inventory_002a_phase2_purchases.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ENUM: Purchase Order Status
-- ============================================================
CREATE TYPE purchase_order_status AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED'
);

-- ============================================================
-- TABLE: purchase_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number             TEXT UNIQUE NOT NULL,
  supplier_id           UUID NOT NULL REFERENCES suppliers(id),
  status                purchase_order_status DEFAULT 'DRAFT',
  expected_delivery_date TIMESTAMPTZ,
  invoice_number        TEXT,
  invoice_date          DATE,
  gst_amount            NUMERIC(12,2) DEFAULT 0,
  discount_amount       NUMERIC(12,2) DEFAULT 0,
  shipping_amount       NUMERIC(12,2) DEFAULT 0,
  total_amount          NUMERIC(12,2) DEFAULT 0,
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id),
  approved_by           UUID REFERENCES auth.users(id),
  approved_at           TIMESTAMPTZ,
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_po_created ON purchase_orders(created_at DESC);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_select" ON purchase_orders
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "po_insert" ON purchase_orders
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "po_update" ON purchase_orders
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "po_delete" ON purchase_orders
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

-- ============================================================
-- TABLE: purchase_order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id     UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  quantity_ordered      NUMERIC(12,4) NOT NULL,
  unit_id               UUID REFERENCES inventory_units(id),
  purchase_price        NUMERIC(10,2) NOT NULL,
  gst_percent           NUMERIC(5,2) DEFAULT 0,
  discount_percent      NUMERIC(5,2) DEFAULT 0,
  line_total            NUMERIC(12,2),
  received_quantity     NUMERIC(12,4) DEFAULT 0,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_product ON purchase_order_items(product_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poi_select" ON purchase_order_items
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "poi_admin" ON purchase_order_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

CREATE POLICY "poi_admin_update" ON purchase_order_items
  FOR UPDATE USING (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

-- ============================================================
-- ENUM: GRN Status
-- ============================================================
CREATE TYPE grn_status AS ENUM (
  'DRAFT',
  'RECEIVED',
  'PARTIAL',
  'REJECTED',
  'POSTED'
);

-- ============================================================
-- TABLE: goods_receipt_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number            TEXT UNIQUE NOT NULL,
  purchase_order_id     UUID REFERENCES purchase_orders(id),
  supplier_id           UUID NOT NULL REFERENCES suppliers(id),
  received_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by           UUID REFERENCES auth.users(id),
  supplier_invoice_no   TEXT,
  supplier_invoice_date DATE,
  status                grn_status DEFAULT 'DRAFT',
  remarks               TEXT,
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_number ON goods_receipt_notes(grn_number);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipt_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_receipt_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_receipt_notes(status, is_deleted);

ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grn_select" ON goods_receipt_notes
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "grn_insert" ON goods_receipt_notes
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "grn_update" ON goods_receipt_notes
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- TABLE: goods_receipt_items
-- ============================================================
CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_note_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  quantity_received     NUMERIC(12,4) NOT NULL,
  accepted_quantity     NUMERIC(12,4) NOT NULL,
  rejected_quantity     NUMERIC(12,4) DEFAULT 0,
  batch_number          TEXT NOT NULL,
  mfg_date              DATE,
  exp_date              DATE NOT NULL,
  purchase_price        NUMERIC(10,2) NOT NULL,
  mrp                   NUMERIC(10,2),
  selling_price         NUMERIC(10,2),
  unit_id               UUID REFERENCES inventory_units(id),
  remarks               TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gri_grn ON goods_receipt_items(goods_receipt_note_id);
CREATE INDEX IF NOT EXISTS idx_gri_product ON goods_receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_gri_batch ON goods_receipt_items(batch_number);

ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gri_select" ON goods_receipt_items
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "gri_admin" ON goods_receipt_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

-- ============================================================
-- ENUM: Batch Status
-- ============================================================
CREATE TYPE batch_status AS ENUM (
  'ACTIVE',
  'LOW_STOCK',
  'EXPIRED',
  'DEPLETED',
  'BLOCKED'
);

-- ============================================================
-- TABLE: inventory_batches
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_batches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number          TEXT NOT NULL,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  goods_receipt_item_id UUID REFERENCES goods_receipt_items(id),
  mfg_date              DATE,
  exp_date              DATE NOT NULL,
  initial_quantity      NUMERIC(12,4) NOT NULL,
  current_quantity      NUMERIC(12,4) NOT NULL,
  purchase_price        NUMERIC(10,2) NOT NULL,
  mrp                   NUMERIC(10,2),
  selling_price         NUMERIC(10,2),
  status                batch_status DEFAULT 'ACTIVE',
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_number, product_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_number ON inventory_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_expiry ON inventory_batches(exp_date);
CREATE INDEX IF NOT EXISTS idx_batch_status ON inventory_batches(status, is_deleted);

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_select" ON inventory_batches
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "batch_admin" ON inventory_batches
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

-- ============================================================
-- FUNCTION: Generate PO Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number, 9, 6) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || v_year || '-%';
  
  RETURN 'PO-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Generate GRN Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(grn_number, 9, 6) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM goods_receipt_notes
  WHERE grn_number LIKE 'GRN-' || v_year || '-%';
  
  RETURN 'GRN-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================
DROP TRIGGER IF EXISTS trg_po_updated_at ON purchase_orders;
CREATE TRIGGER trg_po_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_poi_updated_at ON purchase_order_items;
CREATE TRIGGER trg_poi_updated_at
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_grn_updated_at ON goods_receipt_notes;
CREATE TRIGGER trg_grn_updated_at
  BEFORE UPDATE ON goods_receipt_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_gri_updated_at ON goods_receipt_items;
CREATE TRIGGER trg_gri_updated_at
  BEFORE UPDATE ON goods_receipt_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_batch_updated_at ON inventory_batches;
CREATE TRIGGER trg_batch_updated_at
  BEFORE UPDATE ON inventory_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGERS: Audit logging
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_po ON purchase_orders;
CREATE TRIGGER trg_audit_po
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_poi ON purchase_order_items;
CREATE TRIGGER trg_audit_poi
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_grn ON goods_receipt_notes;
CREATE TRIGGER trg_audit_grn
  AFTER INSERT OR UPDATE OR DELETE ON goods_receipt_notes
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_batch ON inventory_batches;
CREATE TRIGGER trg_audit_batch
  AFTER INSERT OR UPDATE OR DELETE ON inventory_batches
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

COMMIT;
