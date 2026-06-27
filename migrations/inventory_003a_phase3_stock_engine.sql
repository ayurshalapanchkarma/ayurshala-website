-- ============================================================
-- PHASE 3: Stock Ledger Engine
-- Migration: inventory_003a_phase3_stock_engine.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ENUM: Movement Type (expanded)
-- ============================================================
DROP TYPE IF EXISTS movement_type CASCADE;
CREATE TYPE movement_type AS ENUM (
  'PURCHASE',
  'SALE',
  'TREATMENT_CONSUMPTION',
  'RETURN_FROM_PATIENT',
  'PURCHASE_RETURN',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'STOCK_ADJUSTMENT',
  'EXPIRED',
  'DAMAGED',
  'OPENING_STOCK'
);

-- ============================================================
-- ENUM: Reference Type
-- ============================================================
CREATE TYPE reference_type AS ENUM (
  'PURCHASE_ORDER',
  'GOODS_RECEIPT_NOTE',
  'SALES_INVOICE',
  'APPOINTMENT',
  'PRESCRIPTION',
  'ADJUSTMENT',
  'EXPIRY',
  'DAMAGE',
  'TRANSFER',
  'OPENING_STOCK'
);

-- ============================================================
-- TABLE: stock_transactions (updated)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID REFERENCES inventory_batches(id),
  movement_type         movement_type NOT NULL,
  quantity_in           NUMERIC(12,4) DEFAULT 0,
  quantity_out          NUMERIC(12,4) DEFAULT 0,
  reference_id          UUID,
  reference_type        reference_type,
  reference_number      TEXT,
  unit_id               UUID REFERENCES inventory_units(id),
  created_by            UUID REFERENCES auth.users(id),
  remarks               TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_product ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_txn_batch ON stock_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_txn_type ON stock_transactions(movement_type);
CREATE INDEX IF NOT EXISTS idx_txn_ref ON stock_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_txn_date ON stock_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_product_date ON stock_transactions(product_id, created_at DESC);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "txn_select" ON stock_transactions
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "txn_insert" ON stock_transactions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TABLE: stock_ledger (Immutable ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID REFERENCES inventory_batches(id),
  movement_type         movement_type NOT NULL,
  reference_number      TEXT,
  qty_in                NUMERIC(12,4) DEFAULT 0,
  qty_out               NUMERIC(12,4) DEFAULT 0,
  balance_after         NUMERIC(12,4) NOT NULL,
  transaction_id        UUID REFERENCES stock_transactions(id),
  created_by            UUID REFERENCES auth.users(id),
  remarks               TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_batch ON stock_ledger(batch_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON stock_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_product_date ON stock_ledger(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON stock_ledger(movement_type);

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_select" ON stock_ledger
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "ledger_insert" ON stock_ledger
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TABLE: current_stock (Materialized, derived)
-- ============================================================
CREATE TABLE IF NOT EXISTS current_stock (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL UNIQUE REFERENCES inventory_products(id),
  available_quantity    NUMERIC(12,4) DEFAULT 0,
  reserved_quantity     NUMERIC(12,4) DEFAULT 0,
  blocked_quantity      NUMERIC(12,4) DEFAULT 0,
  expired_quantity      NUMERIC(12,4) DEFAULT 0,
  total_quantity        NUMERIC(12,4) DEFAULT 0,
  last_calculated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_current_stock_product ON current_stock(product_id);

ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "current_stock_select" ON current_stock
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================
-- FUNCTION: Calculate current stock for product
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_current_stock(p_product_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC(12,4);
BEGIN
  SELECT COALESCE(SUM(quantity_in - quantity_out), 0)
  INTO v_balance
  FROM stock_transactions
  WHERE product_id = p_product_id;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: Get current stock details
-- ============================================================
CREATE OR REPLACE FUNCTION get_stock_details(p_product_id UUID)
RETURNS TABLE (
  available_qty NUMERIC,
  reserved_qty NUMERIC,
  blocked_qty NUMERIC,
  expired_qty NUMERIC,
  total_qty NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(CASE WHEN b.status = 'ACTIVE' THEN b.current_quantity ELSE 0 END),
    CAST(0 AS NUMERIC),
    SUM(CASE WHEN b.status = 'BLOCKED' THEN b.current_quantity ELSE 0 END),
    SUM(CASE WHEN b.status = 'EXPIRED' THEN b.current_quantity ELSE 0 END),
    SUM(CASE WHEN b.status != 'DEPLETED' THEN b.current_quantity ELSE 0 END)
  FROM inventory_batches b
  WHERE b.product_id = p_product_id AND b.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Log stock transaction with ledger
-- ============================================================
CREATE OR REPLACE FUNCTION log_stock_movement(
  p_product_id UUID,
  p_batch_id UUID,
  p_movement_type movement_type,
  p_quantity_in NUMERIC,
  p_quantity_out NUMERIC,
  p_reference_id UUID,
  p_reference_type reference_type,
  p_reference_number TEXT,
  p_remarks TEXT
)
RETURNS UUID AS $$
DECLARE
  v_txn_id UUID;
  v_balance NUMERIC(12,4);
  v_unit_id UUID;
BEGIN
  -- Get product unit
  SELECT unit_id INTO v_unit_id FROM inventory_products WHERE id = p_product_id;
  
  -- Create transaction
  INSERT INTO stock_transactions (
    product_id, batch_id, movement_type,
    quantity_in, quantity_out,
    reference_id, reference_type, reference_number,
    unit_id, created_by, remarks
  )
  VALUES (
    p_product_id, p_batch_id, p_movement_type,
    COALESCE(p_quantity_in, 0), COALESCE(p_quantity_out, 0),
    p_reference_id, p_reference_type, p_reference_number,
    v_unit_id, auth.uid(), p_remarks
  )
  RETURNING id INTO v_txn_id;
  
  -- Calculate new balance
  SELECT calculate_current_stock(p_product_id) INTO v_balance;
  
  -- Create ledger entry
  INSERT INTO stock_ledger (
    product_id, batch_id, movement_type, reference_number,
    qty_in, qty_out, balance_after,
    transaction_id, created_by, remarks
  )
  VALUES (
    p_product_id, p_batch_id, p_movement_type, p_reference_number,
    COALESCE(p_quantity_in, 0), COALESCE(p_quantity_out, 0), v_balance,
    v_txn_id, auth.uid(), p_remarks
  );
  
  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS: Audit on transactions
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_txn ON stock_transactions;
CREATE TRIGGER trg_audit_txn
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_ledger ON stock_ledger;
CREATE TRIGGER trg_audit_ledger
  AFTER INSERT ON stock_ledger
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

COMMIT;
