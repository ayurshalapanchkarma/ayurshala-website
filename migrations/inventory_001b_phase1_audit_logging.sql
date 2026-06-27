-- ============================================================
-- PHASE 1 HARDENING: Audit Logging System
-- Migration: inventory_001b_phase1_audit_logging.sql
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: inventory_audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_audit_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name            TEXT NOT NULL,
  action                TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  record_id             UUID NOT NULL,
  old_values            JSONB,
  new_values            JSONB,
  performed_by          UUID REFERENCES auth.users(id),
  performed_at          TIMESTAMPTZ DEFAULT NOW(),
  ip_address            TEXT,
  user_agent            TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON inventory_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON inventory_audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON inventory_audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON inventory_audit_logs(performed_at DESC);

ALTER TABLE inventory_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_admin" ON inventory_audit_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

CREATE POLICY "audit_insert_system" ON inventory_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- FUNCTION: Log audit trail
-- ============================================================
CREATE OR REPLACE FUNCTION log_inventory_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_performed_by UUID;
BEGIN
  -- Get current user ID
  v_performed_by := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO inventory_audit_logs (table_name, action, record_id, new_values, performed_by)
    VALUES (TG_TABLE_NAME, 'CREATE', NEW.id, row_to_json(NEW), v_performed_by);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO inventory_audit_logs (table_name, action, record_id, old_values, new_values, performed_by)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW), v_performed_by);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO inventory_audit_logs (table_name, action, record_id, old_values, performed_by)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, row_to_json(OLD), v_performed_by);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ATTACH AUDIT TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_categories ON inventory_categories;
CREATE TRIGGER trg_audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON inventory_categories
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_products ON inventory_products;
CREATE TRIGGER trg_audit_products
  AFTER INSERT OR UPDATE OR DELETE ON inventory_products
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_suppliers ON suppliers;
CREATE TRIGGER trg_audit_suppliers
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_manufacturers ON manufacturers;
CREATE TRIGGER trg_audit_manufacturers
  AFTER INSERT OR UPDATE OR DELETE ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

COMMIT;
