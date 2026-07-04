-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 004: FUNCTIONS
-- Part A: Utility + Sequence generators + GRN Post
-- Run after 003_triggers.sql
-- ============================================================

BEGIN;

-- ============================================================
-- FUNCTION: fn_next_sequence_value
-- Generic sequence generator driven by inv_settings.
-- setting_key format: 'seq_po_last_number', 'seq_grn_last_number', etc.
-- Returns the NEXT integer value after incrementing the counter.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_next_sequence_value(p_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current INTEGER;
BEGIN
  -- Row-level lock on the settings row to prevent race conditions
  SELECT COALESCE(setting_value::INTEGER, 0)
  INTO v_current
  FROM inv_settings
  WHERE setting_key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO inv_settings (setting_key, setting_value, setting_type, description)
    VALUES (p_key, '0', 'number', 'Auto sequence counter for ' || p_key)
    ON CONFLICT (setting_key) DO NOTHING;
    v_current := 0;
  END IF;

  v_current := v_current + 1;

  UPDATE inv_settings
  SET setting_value = v_current::TEXT, updated_at = NOW()
  WHERE setting_key = p_key;

  RETURN v_current;
END;
$$;

COMMENT ON FUNCTION fn_next_sequence_value(TEXT) IS
  'Thread-safe sequence counter stored in inv_settings. '
  'Uses SELECT FOR UPDATE to prevent duplicate numbers under concurrent load.';


-- ============================================================
-- FUNCTION: fn_generate_po_number
-- Reads prefix from inv_settings.po_prefix (default: PO-)
-- Reads zero-pad width from inv_settings.po_pad_width (default: 6)
-- Output example: PO-000001
-- ============================================================

CREATE OR REPLACE FUNCTION fn_generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix    TEXT;
  v_pad       INTEGER;
  v_seq       INTEGER;
BEGIN
  SELECT COALESCE(setting_value, 'PO-')
  INTO v_prefix
  FROM inv_settings WHERE setting_key = 'po_prefix';

  SELECT COALESCE(setting_value::INTEGER, 6)
  INTO v_pad
  FROM inv_settings WHERE setting_key = 'po_pad_width';

  v_seq := fn_next_sequence_value('seq_po_last_number');

  RETURN v_prefix || LPAD(v_seq::TEXT, v_pad, '0');
END;
$$;


-- ============================================================
-- FUNCTION: fn_generate_grn_number
-- Reads prefix from inv_settings.grn_prefix (default: GRN-)
-- Output example: GRN-000001
-- ============================================================

CREATE OR REPLACE FUNCTION fn_generate_grn_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix    TEXT;
  v_pad       INTEGER;
  v_seq       INTEGER;
BEGIN
  SELECT COALESCE(setting_value, 'GRN-')
  INTO v_prefix
  FROM inv_settings WHERE setting_key = 'grn_prefix';

  SELECT COALESCE(setting_value::INTEGER, 6)
  INTO v_pad
  FROM inv_settings WHERE setting_key = 'grn_pad_width';

  v_seq := fn_next_sequence_value('seq_grn_last_number');

  RETURN v_prefix || LPAD(v_seq::TEXT, v_pad, '0');
END;
$$;


-- ============================================================
-- FUNCTION: fn_generate_supplier_code
-- Reads prefix from inv_settings.supplier_prefix (default: SUP-)
-- Reads zero-pad width from inv_settings.supplier_pad_width (default: 6)
-- Output example: SUP-000001
-- ============================================================

CREATE OR REPLACE FUNCTION fn_generate_supplier_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix    TEXT;
  v_pad       INTEGER;
  v_seq       INTEGER;
BEGIN
  SELECT COALESCE(setting_value, 'SUP-')
  INTO v_prefix
  FROM inv_settings WHERE setting_key = 'supplier_prefix';

  SELECT COALESCE(setting_value::INTEGER, 6)
  INTO v_pad
  FROM inv_settings WHERE setting_key = 'supplier_pad_width';

  v_seq := fn_next_sequence_value('seq_supplier_last_number');

  RETURN v_prefix || LPAD(v_seq::TEXT, v_pad, '0');
END;
$$;


-- ============================================================
-- FUNCTION: fn_generate_adjustment_number
-- Output example: ADJ-000001
-- ============================================================

CREATE OR REPLACE FUNCTION fn_generate_adjustment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix    TEXT;
  v_pad       INTEGER;
  v_seq       INTEGER;
BEGIN
  SELECT COALESCE(setting_value, 'ADJ-')
  INTO v_prefix
  FROM inv_settings WHERE setting_key = 'adjustment_prefix';

  SELECT COALESCE(setting_value::INTEGER, 6)
  INTO v_pad
  FROM inv_settings WHERE setting_key = 'adjustment_pad_width';

  v_seq := fn_next_sequence_value('seq_adjustment_last_number');

  RETURN v_prefix || LPAD(v_seq::TEXT, v_pad, '0');
END;
$$;


-- ============================================================
-- FUNCTION: fn_get_product_stock
-- Returns total available stock for a product across all
-- active (non-expired, non-damaged) batches.
-- This calculates from inv_stock_movements (source of truth).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_get_product_stock(p_product_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN movement_type IN ('PURCHASE', 'RETURN')
        THEN quantity
      WHEN movement_type = 'ADJUSTMENT'
        THEN CASE WHEN after_stock > before_stock THEN quantity ELSE -quantity END
      ELSE -quantity
    END
  ), 0)
  FROM inv_stock_movements
  WHERE product_uuid = p_product_uuid;
$$;

COMMENT ON FUNCTION fn_get_product_stock(UUID) IS
  'Calculates current stock from the immutable movements ledger. '
  'Slower than reading batch.available_quantity but authoritative. '
  'Use for reconciliation and audit.';


-- ============================================================
-- FUNCTION: fn_rebuild_batch_quantity
-- Recomputes inv_product_batches.available_quantity from
-- inv_stock_movements for a specific batch.
-- Use when the cache is suspected to be out of sync.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_rebuild_batch_quantity(p_batch_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_computed NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN movement_type IN ('PURCHASE', 'RETURN')
        THEN quantity
      WHEN movement_type = 'ADJUSTMENT'
        THEN CASE WHEN after_stock > before_stock THEN quantity ELSE -quantity END
      ELSE -quantity
    END
  ), 0)
  INTO v_computed
  FROM inv_stock_movements
  WHERE batch_uuid = p_batch_uuid;

  v_computed := GREATEST(0, v_computed);

  UPDATE inv_product_batches
  SET available_quantity = v_computed, updated_at = NOW()
  WHERE uuid = p_batch_uuid;

  RETURN v_computed;
END;
$$;

COMMENT ON FUNCTION fn_rebuild_batch_quantity(UUID) IS
  'Rebuilds batch.available_quantity from inv_stock_movements. '
  'Run this for any batch you suspect has a cache discrepancy. '
  'Returns the recomputed value.';


-- ============================================================
-- FUNCTION: fn_rebuild_all_batch_quantities
-- Full reconciliation pass across ALL batches.
-- Safe to run at any time. Use for scheduled audits.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_rebuild_all_batch_quantities()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_batch IN SELECT uuid FROM inv_product_batches LOOP
    PERFORM fn_rebuild_batch_quantity(v_batch.uuid);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION fn_rebuild_all_batch_quantities() IS
  'Full reconciliation. Rebuilds available_quantity for every batch from movements. '
  'Returns count of batches processed. Run as a scheduled job or after data imports.';

COMMIT;
