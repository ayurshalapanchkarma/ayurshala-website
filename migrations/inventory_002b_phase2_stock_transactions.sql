-- ============================================================
-- PHASE 2: Stock Transactions (Phase 3 Engine preparation)
-- Migration: inventory_002b_phase2_stock_transactions.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ENUM: Transaction Type
-- ============================================================
CREATE TYPE transaction_type AS ENUM (
  'PURCHASE',
  'SALE',
  'CONSUMPTION',
  'RETURN',
  'ADJUSTMENT',
  'EXPIRED',
  'DAMAGED',
  'TRANSFER',
  'OPENING_STOCK'
);

-- ============================================================
-- TABLE: stock_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID REFERENCES inventory_batches(id),
  transaction_type      transaction_type NOT NULL,
  quantity              NUMERIC(12,4) NOT NULL,
  reference_id          UUID,
  reference_type        TEXT,
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_product ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_txn_batch ON stock_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_txn_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_txn_ref ON stock_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_txn_date ON stock_transactions(created_at DESC);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "txn_select" ON stock_transactions
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "txn_insert" ON stock_transactions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TABLE: stock_ledger (Materialized view data)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  transaction_date      TIMESTAMPTZ NOT NULL,
  transaction_type      transaction_type NOT NULL,
  reference_id          UUID,
  qty_in                NUMERIC(12,4) DEFAULT 0,
  qty_out               NUMERIC(12,4) DEFAULT 0,
  balance               NUMERIC(12,4) DEFAULT 0,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON stock_ledger(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON stock_ledger(transaction_type);

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_select" ON stock_ledger
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "ledger_insert" ON stock_ledger
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- FUNCTION: Log stock transaction
-- ============================================================
CREATE OR REPLACE FUNCTION log_stock_transaction(
  p_product_id UUID,
  p_batch_id UUID,
  p_transaction_type transaction_type,
  p_quantity NUMERIC,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_txn_id UUID;
BEGIN
  INSERT INTO stock_transactions (
    product_id, batch_id, transaction_type, quantity,
    reference_id, reference_type, notes, created_by
  )
  VALUES (
    p_product_id, p_batch_id, p_transaction_type, p_quantity,
    p_reference_id, p_reference_type, p_notes, auth.uid()
  )
  RETURNING id INTO v_txn_id;
  
  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: Log audit on stock_transactions insert
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_txn ON stock_transactions;
CREATE TRIGGER trg_audit_txn
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

COMMIT;
