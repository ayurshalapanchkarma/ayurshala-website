-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 003: TRIGGERS
-- Run after 002_indexes.sql
-- ============================================================

BEGIN;

-- ============================================================
-- UTILITY: updated_at auto-stamp trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to every mutable table
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'inv_settings',
    'inv_categories',
    'inv_units',
    'inv_tax_master',
    'inv_manufacturers',
    'inv_suppliers',
    'inv_products',
    'inv_warehouses',
    'inv_warehouse_locations',
    'inv_purchase_orders',
    'inv_purchase_order_items',
    'inv_goods_receipts',
    'inv_product_batches',
    'inv_stock_adjustments'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END;
$$;


-- ============================================================
-- TRIGGER: Protect inv_stock_movements — APPEND ONLY
-- No UPDATE. No DELETE. Ever.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_protect_stock_movements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'inv_stock_movements is an immutable ledger. '
    'UPDATE and DELETE operations are not permitted. '
    'Correction: create a new movement with the opposite effect.';
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_movements_no_update ON inv_stock_movements;
CREATE TRIGGER trg_stock_movements_no_update
  BEFORE UPDATE ON inv_stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_protect_stock_movements();

DROP TRIGGER IF EXISTS trg_stock_movements_no_delete ON inv_stock_movements;
CREATE TRIGGER trg_stock_movements_no_delete
  BEFORE DELETE ON inv_stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_protect_stock_movements();


-- ============================================================
-- TRIGGER: Protect inv_audit_log — APPEND ONLY
-- ============================================================

CREATE OR REPLACE FUNCTION fn_protect_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'inv_audit_log is an immutable audit trail. '
    'UPDATE and DELETE are not permitted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON inv_audit_log;
CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE ON inv_audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_protect_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON inv_audit_log;
CREATE TRIGGER trg_audit_log_no_delete
  BEFORE DELETE ON inv_audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_protect_audit_log();


-- ============================================================
-- TRIGGER: Maintain inv_product_batches.available_quantity
-- Fires on EVERY INSERT into inv_stock_movements.
-- Updates the batch cache atomically in the same transaction.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_batch_available_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_delta NUMERIC(12,2);
BEGIN
  -- Skip if no batch is linked (non-batch-tracked products)
  IF NEW.batch_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine direction: IN types increase stock, OUT types decrease it
  CASE NEW.movement_type
    WHEN 'PURCHASE' THEN v_delta :=  NEW.quantity;
    WHEN 'RETURN'   THEN v_delta :=  NEW.quantity;
    WHEN 'SALE'         THEN v_delta := -NEW.quantity;
    WHEN 'CONSUMPTION'  THEN v_delta := -NEW.quantity;
    WHEN 'EXPIRED'      THEN v_delta := -NEW.quantity;
    WHEN 'DAMAGED'      THEN v_delta := -NEW.quantity;
    WHEN 'TRANSFER'     THEN v_delta := -NEW.quantity;  -- source side
    WHEN 'ADJUSTMENT'   THEN
      -- ADJUSTMENT: if after_stock > before_stock it's an increase
      IF NEW.after_stock > NEW.before_stock THEN
        v_delta :=  NEW.quantity;
      ELSE
        v_delta := -NEW.quantity;
      END IF;
    ELSE
      v_delta := 0;
  END CASE;

  UPDATE inv_product_batches
  SET
    available_quantity = GREATEST(0, available_quantity + v_delta),
    updated_at         = NOW()
  WHERE uuid = NEW.batch_uuid;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_movements_update_batch_qty ON inv_stock_movements;
CREATE TRIGGER trg_movements_update_batch_qty
  AFTER INSERT ON inv_stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_update_batch_available_quantity();


-- ============================================================
-- TRIGGER: Auto-set batch status to EXPIRED
-- Fires on INSERT/UPDATE of inv_product_batches.
-- Sets status = 'expired' if expiry_date < CURRENT_DATE.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_auto_expire_batch()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_batch_auto_expire ON inv_product_batches;
CREATE TRIGGER trg_batch_auto_expire
  BEFORE INSERT OR UPDATE ON inv_product_batches
  FOR EACH ROW EXECUTE FUNCTION fn_auto_expire_batch();


-- ============================================================
-- TRIGGER: PO status auto-update based on received quantities
-- Fires AFTER UPDATE on inv_purchase_order_items.
-- Recalculates PO status:
--   - All items received → 'received'
--   - Some items received → 'partially_received'
--   - No change if status is 'cancelled'
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_po_status_on_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_po_uuid       UUID;
  v_total_items   INTEGER;
  v_fully_rcvd    INTEGER;
  v_any_rcvd      INTEGER;
  v_current_status TEXT;
BEGIN
  v_po_uuid := NEW.purchase_order_uuid;

  SELECT status INTO v_current_status
  FROM inv_purchase_orders
  WHERE uuid = v_po_uuid;

  -- Don't touch cancelled POs
  IF v_current_status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*)                                                        AS total,
    COUNT(*) FILTER (WHERE received_quantity >= ordered_quantity)   AS fully_rcvd,
    COUNT(*) FILTER (WHERE received_quantity > 0)                   AS any_rcvd
  INTO v_total_items, v_fully_rcvd, v_any_rcvd
  FROM inv_purchase_order_items
  WHERE purchase_order_uuid = v_po_uuid;

  IF v_fully_rcvd = v_total_items AND v_total_items > 0 THEN
    UPDATE inv_purchase_orders
    SET status = 'received', updated_at = NOW()
    WHERE uuid = v_po_uuid AND status NOT IN ('received','cancelled');

  ELSIF v_any_rcvd > 0 THEN
    UPDATE inv_purchase_orders
    SET status = 'partially_received', updated_at = NOW()
    WHERE uuid = v_po_uuid AND status NOT IN ('received','partially_received','cancelled');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_poi_update_po_status ON inv_purchase_order_items;
CREATE TRIGGER trg_poi_update_po_status
  AFTER UPDATE OF received_quantity ON inv_purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_po_status_on_receipt();


-- ============================================================
-- TRIGGER: Prevent editing a POSTED GRN
-- ============================================================

CREATE OR REPLACE FUNCTION fn_lock_posted_grn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'posted' AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION
      'GRN % is already posted and cannot be modified. '
      'Create a new adjustment if a correction is needed.',
      OLD.grn_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grn_lock_posted ON inv_goods_receipts;
CREATE TRIGGER trg_grn_lock_posted
  BEFORE UPDATE ON inv_goods_receipts
  FOR EACH ROW EXECUTE FUNCTION fn_lock_posted_grn();


-- ============================================================
-- TRIGGER: Prevent editing a CANCELLED document
-- Applies to POs and GRNs.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_lock_cancelled_po()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION
      'Purchase Order % is cancelled and cannot be modified.',
      OLD.po_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_po_lock_cancelled ON inv_purchase_orders;
CREATE TRIGGER trg_po_lock_cancelled
  BEFORE UPDATE ON inv_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION fn_lock_cancelled_po();

COMMIT;
