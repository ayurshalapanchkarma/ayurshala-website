-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_008_phase8_adjustments.sql
-- Phase 8: Stock Adjustments, Damage Register, Audit Trail
-- ============================================================

BEGIN;

-- ============================================================
-- SEQUENCE: Adjustment number
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS adjustment_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_adjustment_number()
RETURNS TEXT AS $$
  SELECT 'ADJ-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('adjustment_number_seq')::TEXT, 6, '0')
$$ LANGUAGE sql;

-- ============================================================
-- TABLE: stock_adjustments
-- Nothing is deleted — every loss/damage is recorded here
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number TEXT UNIQUE NOT NULL,
  adjustment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  adjustment_type   TEXT NOT NULL CHECK (adjustment_type IN (
                      'DAMAGE', 'BREAKAGE', 'LEAKAGE', 'THEFT',
                      'PHYSICAL_COUNT', 'EXPIRED', 'OTHER'
                    )),
  product_id        UUID NOT NULL REFERENCES inventory_products(id),
  batch_id          UUID REFERENCES inventory_batches(id),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  reason            TEXT NOT NULL,
  remarks           TEXT,
  photo_urls        TEXT[],                     -- optional photos as URL array
  approval_status   TEXT DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by       UUID REFERENCES auth.users(id),
  approved_at       TIMESTAMPTZ,
  created_by        UUID REFERENCES auth.users(id),
  clinic_id         UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
  -- NO is_deleted: adjustments cannot be deleted, ever
);

CREATE INDEX IF NOT EXISTS idx_adj_product  ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_adj_type     ON stock_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_adj_date     ON stock_adjustments(adjustment_date);
CREATE INDEX IF NOT EXISTS idx_adj_status   ON stock_adjustments(approval_status);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adj_select" ON stock_adjustments;
DROP POLICY IF EXISTS "adj_insert" ON stock_adjustments;
DROP POLICY IF EXISTS "adj_update" ON stock_adjustments;

CREATE POLICY "adj_select" ON stock_adjustments
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "adj_insert" ON stock_adjustments
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- Only ADMIN can approve/reject (update approval_status)
CREATE POLICY "adj_update" ON stock_adjustments
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

-- ============================================================
-- FUNCTION: approve_adjustment
-- Approves an adjustment and creates the stock transaction
-- ============================================================
CREATE OR REPLACE FUNCTION approve_adjustment(
  p_adjustment_id UUID,
  p_approved_by   UUID
)
RETURNS VOID AS $$
DECLARE
  v_adj     stock_adjustments%ROWTYPE;
  v_txn_type TEXT;
BEGIN
  SELECT * INTO v_adj FROM stock_adjustments WHERE id = p_adjustment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Adjustment not found: %', p_adjustment_id; END IF;
  IF v_adj.approval_status != 'PENDING' THEN RAISE EXCEPTION 'Adjustment already processed'; END IF;

  -- Map adjustment type to transaction type
  v_txn_type := CASE v_adj.adjustment_type
    WHEN 'DAMAGE'         THEN 'DAMAGED'
    WHEN 'BREAKAGE'       THEN 'DAMAGED'
    WHEN 'LEAKAGE'        THEN 'DAMAGED'
    WHEN 'THEFT'          THEN 'ADJUSTMENT'
    WHEN 'PHYSICAL_COUNT' THEN 'ADJUSTMENT'
    WHEN 'EXPIRED'        THEN 'EXPIRED'
    ELSE 'ADJUSTMENT'
  END;

  -- Create stock transaction
  INSERT INTO stock_transactions (
    transaction_type, product_id, batch_id,
    reference_type, reference_id, reference_number,
    quantity_in, quantity_out, notes, created_by
  ) VALUES (
    v_txn_type,
    v_adj.product_id,
    v_adj.batch_id,
    'ADJUSTMENT', p_adjustment_id, v_adj.adjustment_number,
    0, v_adj.quantity,
    v_adj.adjustment_type || ': ' || v_adj.reason,
    p_approved_by
  );

  -- Update batch remaining quantity
  IF v_adj.batch_id IS NOT NULL THEN
    UPDATE inventory_batches
    SET remaining_quantity = GREATEST(0, remaining_quantity - v_adj.quantity),
        updated_at = NOW()
    WHERE id = v_adj.batch_id;
  END IF;

  -- Mark as approved
  UPDATE stock_adjustments
  SET approval_status = 'APPROVED',
      approved_by = p_approved_by,
      approved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_adjustment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLE: audit_logs (Phase 11 security, created here early)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  action       TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data     JSONB,
  new_data     JSONB,
  changed_by   UUID REFERENCES auth.users(id),
  changed_at   TIMESTAMPTZ DEFAULT NOW(),
  ip_address   TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_table  ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_logs(changed_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;

CREATE POLICY "audit_select" ON audit_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- FUNCTION: Generic audit trigger
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS audit_inventory_products ON inventory_products;
CREATE TRIGGER audit_inventory_products
  AFTER INSERT OR UPDATE ON inventory_products
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_inventory_batches ON inventory_batches;
CREATE TRIGGER audit_inventory_batches
  AFTER INSERT OR UPDATE ON inventory_batches
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_purchase_orders ON purchase_orders;
CREATE TRIGGER audit_purchase_orders
  AFTER INSERT OR UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_sales ON sales;
CREATE TRIGGER audit_sales
  AFTER INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_stock_adjustments ON stock_adjustments;
CREATE TRIGGER audit_stock_adjustments
  AFTER INSERT OR UPDATE ON stock_adjustments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS trg_adj_updated_at ON stock_adjustments;
CREATE TRIGGER trg_adj_updated_at
  BEFORE UPDATE ON stock_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
