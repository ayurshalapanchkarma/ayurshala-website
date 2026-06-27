-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_002_phase2_purchases.sql
-- Phase 2: Purchase Management — PO, GRN, Batches
-- ============================================================

BEGIN;

-- ============================================================
-- SEQUENCES: PO and GRN number generation
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS grn_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
  SELECT 'PO-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('po_number_seq')::TEXT, 6, '0')
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TEXT AS $$
  SELECT 'GRN-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('grn_number_seq')::TEXT, 6, '0')
$$ LANGUAGE sql;

-- ============================================================
-- TABLE: purchase_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number                TEXT UNIQUE NOT NULL,
  supplier_id              UUID REFERENCES suppliers(id),
  order_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date   DATE,
  status                   TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED')),
  total_amount             NUMERIC(12,2) DEFAULT 0,
  total_gst                NUMERIC(12,2) DEFAULT 0,
  grand_total              NUMERIC(12,2) DEFAULT 0,
  notes                    TEXT,
  created_by               UUID REFERENCES auth.users(id),
  clinic_id                UUID,
  is_deleted               BOOLEAN DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_supplier   ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status     ON purchase_orders(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_po_date       ON purchase_orders(order_date);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_select" ON purchase_orders;
DROP POLICY IF EXISTS "po_insert" ON purchase_orders;
DROP POLICY IF EXISTS "po_update" ON purchase_orders;

CREATE POLICY "po_select" ON purchase_orders
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

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

-- ============================================================
-- TABLE: purchase_items
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id              UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id         UUID NOT NULL REFERENCES inventory_products(id),
  quantity           INTEGER NOT NULL CHECK (quantity > 0),
  unit_price         NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  gst_percent        NUMERIC(5,2) DEFAULT 0,
  gst_amount         NUMERIC(10,2) DEFAULT 0,
  total_amount       NUMERIC(10,2) NOT NULL,
  received_quantity  INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_po      ON purchase_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pi_select" ON purchase_items;
DROP POLICY IF EXISTS "pi_insert" ON purchase_items;
DROP POLICY IF EXISTS "pi_update" ON purchase_items;

CREATE POLICY "pi_select" ON purchase_items
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "pi_insert" ON purchase_items
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "pi_update" ON purchase_items
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- TABLE: goods_received_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number       TEXT UNIQUE NOT NULL,
  po_id            UUID REFERENCES purchase_orders(id),
  supplier_id      UUID NOT NULL REFERENCES suppliers(id),
  received_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number   TEXT,
  invoice_date     DATE,
  invoice_amount   NUMERIC(12,2),
  status           TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'POSTED')),
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  clinic_id        UUID,
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_received_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_po       ON goods_received_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_status   ON goods_received_notes(status);
CREATE INDEX IF NOT EXISTS idx_grn_date     ON goods_received_notes(received_date);

ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grn_select" ON goods_received_notes;
DROP POLICY IF EXISTS "grn_insert" ON goods_received_notes;
DROP POLICY IF EXISTS "grn_update" ON goods_received_notes;

CREATE POLICY "grn_select" ON goods_received_notes
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "grn_insert" ON goods_received_notes
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "grn_update" ON goods_received_notes
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- TABLE: inventory_batches
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number        TEXT NOT NULL,
  product_id          UUID NOT NULL REFERENCES inventory_products(id),
  grn_id              UUID REFERENCES goods_received_notes(id),
  supplier_id         UUID REFERENCES suppliers(id),
  mfg_date            DATE,
  exp_date            DATE,
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity  INTEGER NOT NULL,
  purchase_price      NUMERIC(10,2) NOT NULL CHECK (purchase_price >= 0),
  mrp                 NUMERIC(10,2),
  status              TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CONSUMED', 'QUARANTINE')),
  clinic_id           UUID,
  is_deleted          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (batch_number, product_id)
);

CREATE INDEX IF NOT EXISTS idx_batches_product  ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_grn      ON inventory_batches(grn_id);
CREATE INDEX IF NOT EXISTS idx_batches_exp_date ON inventory_batches(exp_date);
CREATE INDEX IF NOT EXISTS idx_batches_status   ON inventory_batches(status);

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "batch_select" ON inventory_batches;
DROP POLICY IF EXISTS "batch_insert" ON inventory_batches;
DROP POLICY IF EXISTS "batch_update" ON inventory_batches;

CREATE POLICY "batch_select" ON inventory_batches
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "batch_insert" ON inventory_batches
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "batch_update" ON inventory_batches
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- TRIGGER: auto-post GRN creates batch + stock transaction
-- Called manually via function (see Phase 3 migration)
-- ============================================================

DROP TRIGGER IF EXISTS trg_po_updated_at ON purchase_orders;
CREATE TRIGGER trg_po_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_grn_updated_at ON goods_received_notes;
CREATE TRIGGER trg_grn_updated_at
  BEFORE UPDATE ON goods_received_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_batches_updated_at ON inventory_batches;
CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON inventory_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
