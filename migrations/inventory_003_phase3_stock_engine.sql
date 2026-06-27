-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_003_phase3_stock_engine.sql
-- Phase 3: Stock Transaction Engine — The Core
-- RULE: Current stock is ALWAYS derived from transactions.
--       Never edit stock directly.
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: stock_transactions
-- This is the immutable ledger. Nothing is ever deleted here.
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type  TEXT NOT NULL CHECK (transaction_type IN (
                      'PURCHASE', 'SALE', 'CONSUMPTION', 'RETURN',
                      'ADJUSTMENT', 'EXPIRED', 'DAMAGED', 'TRANSFER'
                    )),
  product_id        UUID NOT NULL REFERENCES inventory_products(id),
  batch_id          UUID REFERENCES inventory_batches(id),
  reference_type    TEXT,                       -- 'GRN', 'SALE', 'TREATMENT', 'ADJUSTMENT'
  reference_id      UUID,                       -- ID of source record
  reference_number  TEXT,                       -- e.g. GRN-2026-000001
  quantity_in       INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in >= 0),
  quantity_out      INTEGER NOT NULL DEFAULT 0 CHECK (quantity_out >= 0),
  unit_cost         NUMERIC(10,2) DEFAULT 0,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  transaction_date  TIMESTAMPTZ DEFAULT NOW(),
  clinic_id         UUID,
  CONSTRAINT chk_qty_direction CHECK (
    (quantity_in > 0 AND quantity_out = 0) OR
    (quantity_in = 0 AND quantity_out > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_txn_product     ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_txn_type        ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_txn_date        ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_txn_batch       ON stock_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_txn_reference   ON stock_transactions(reference_id);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "txn_select"  ON stock_transactions;
DROP POLICY IF EXISTS "txn_insert"  ON stock_transactions;

-- Read: admin, pharmacist, doctor can see the ledger
CREATE POLICY "txn_select" ON stock_transactions
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'DOCTOR')
  );

-- Write: only service_role + ADMIN (triggers use service_role)
CREATE POLICY "txn_insert" ON stock_transactions
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

-- NO UPDATE or DELETE policies — ledger is immutable

-- ============================================================
-- VIEW: current_stock
-- Real-time stock level per product derived from transactions
-- ============================================================
CREATE OR REPLACE VIEW current_stock AS
SELECT
  p.id                                                        AS product_id,
  p.sku,
  p.name                                                      AS product_name,
  c.name                                                      AS category_name,
  p.unit,
  p.reorder_level,
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0)::INTEGER AS current_stock,
  CASE
    WHEN COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0) <= p.reorder_level
    THEN TRUE ELSE FALSE
  END                                                          AS is_low_stock
FROM inventory_products p
LEFT JOIN inventory_categories c  ON c.id = p.category_id
LEFT JOIN stock_transactions t    ON t.product_id = p.id
WHERE p.is_deleted = FALSE
GROUP BY p.id, p.sku, p.name, c.name, p.unit, p.reorder_level;

-- ============================================================
-- VIEW: inventory_ledger
-- Full chronological ledger with running balance per product
-- ============================================================
CREATE OR REPLACE VIEW inventory_ledger AS
SELECT
  t.transaction_date,
  p.name                                                        AS product_name,
  c.name                                                        AS category_name,
  p.unit,
  t.transaction_type,
  t.reference_number,
  t.reference_type,
  t.quantity_in,
  t.quantity_out,
  SUM(t.quantity_in - t.quantity_out)
    OVER (PARTITION BY t.product_id
          ORDER BY t.transaction_date, t.id
          ROWS UNBOUNDED PRECEDING)::INTEGER                    AS running_balance,
  t.notes,
  t.created_by,
  t.product_id,
  t.batch_id,
  t.id                                                          AS transaction_id
FROM stock_transactions t
JOIN inventory_products p     ON p.id = t.product_id
LEFT JOIN inventory_categories c ON c.id = p.category_id
ORDER BY t.transaction_date DESC, t.id DESC;

-- ============================================================
-- VIEW: batch_stock
-- Per-batch remaining stock with expiry info
-- ============================================================
CREATE OR REPLACE VIEW batch_stock AS
SELECT
  b.id                                        AS batch_id,
  b.batch_number,
  b.product_id,
  p.name                                      AS product_name,
  p.sku,
  p.unit,
  c.name                                      AS category_name,
  b.mfg_date,
  b.exp_date,
  (b.exp_date - CURRENT_DATE)::INTEGER        AS days_to_expiry,
  b.quantity                                  AS original_quantity,
  b.remaining_quantity,
  b.purchase_price,
  b.mrp,
  b.status,
  b.grn_id,
  b.supplier_id
FROM inventory_batches b
JOIN inventory_products p     ON p.id = b.product_id
LEFT JOIN inventory_categories c ON c.id = p.category_id
WHERE b.is_deleted = FALSE;

-- ============================================================
-- FUNCTION: post_grn
-- Called after GRN is verified — creates batches + transactions
-- ============================================================
CREATE OR REPLACE FUNCTION post_grn(
  p_grn_id      UUID,
  p_items       JSONB,   -- array of {product_id, batch_number, mfg_date, exp_date, quantity, purchase_price, mrp}
  p_created_by  UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_grn         goods_received_notes%ROWTYPE;
  v_item        JSONB;
  v_batch_id    UUID;
BEGIN
  SELECT * INTO v_grn FROM goods_received_notes WHERE id = p_grn_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GRN not found: %', p_grn_id;
  END IF;
  IF v_grn.status = 'POSTED' THEN
    RAISE EXCEPTION 'GRN already posted: %', v_grn.grn_number;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Create batch
    INSERT INTO inventory_batches (
      batch_number, product_id, grn_id, supplier_id,
      mfg_date, exp_date, quantity, remaining_quantity,
      purchase_price, mrp, status
    ) VALUES (
      v_item->>'batch_number',
      (v_item->>'product_id')::UUID,
      p_grn_id,
      v_grn.supplier_id,
      (v_item->>'mfg_date')::DATE,
      (v_item->>'exp_date')::DATE,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'purchase_price')::NUMERIC,
      (v_item->>'mrp')::NUMERIC,
      'ACTIVE'
    )
    ON CONFLICT (batch_number, product_id) DO UPDATE
      SET remaining_quantity = inventory_batches.remaining_quantity + (v_item->>'quantity')::INTEGER,
          quantity = inventory_batches.quantity + (v_item->>'quantity')::INTEGER
    RETURNING id INTO v_batch_id;

    -- Create stock transaction
    INSERT INTO stock_transactions (
      transaction_type, product_id, batch_id,
      reference_type, reference_id, reference_number,
      quantity_in, quantity_out, unit_cost, created_by
    ) VALUES (
      'PURCHASE',
      (v_item->>'product_id')::UUID,
      v_batch_id,
      'GRN', p_grn_id, v_grn.grn_number,
      (v_item->>'quantity')::INTEGER, 0,
      (v_item->>'purchase_price')::NUMERIC,
      p_created_by
    );
  END LOOP;

  -- Mark GRN as posted
  UPDATE goods_received_notes SET status = 'POSTED', updated_at = NOW() WHERE id = p_grn_id;
  -- Mark PO as received if linked
  IF v_grn.po_id IS NOT NULL THEN
    UPDATE purchase_orders SET status = 'RECEIVED', updated_at = NOW() WHERE id = v_grn.po_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
