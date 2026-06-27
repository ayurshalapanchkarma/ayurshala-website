-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_004_phase4_batch_expiry.sql
-- Phase 4: FIFO Engine + Expiry Management
-- ============================================================

BEGIN;

-- ============================================================
-- FUNCTION: get_fifo_batches
-- Returns ordered batches for FIFO dispensing
-- Returns: array of {batch_id, batch_number, available_qty, exp_date}
-- ============================================================
CREATE OR REPLACE FUNCTION get_fifo_batches(
  p_product_id UUID,
  p_quantity   INTEGER
)
RETURNS TABLE (
  batch_id        UUID,
  batch_number    TEXT,
  available_qty   INTEGER,
  exp_date        DATE,
  purchase_price  NUMERIC
) AS $$
DECLARE
  v_remaining INTEGER := p_quantity;
  v_batch     RECORD;
BEGIN
  FOR v_batch IN
    SELECT id, batch_number AS bn, remaining_quantity AS rq, exp_date AS ed, purchase_price AS pp
    FROM inventory_batches
    WHERE product_id = p_product_id
      AND status = 'ACTIVE'
      AND remaining_quantity > 0
    ORDER BY
      CASE WHEN exp_date IS NULL THEN 1 ELSE 0 END,  -- nulls last
      exp_date ASC,                                    -- oldest expiry first (FIFO)
      created_at ASC
  LOOP
    IF v_remaining <= 0 THEN EXIT; END IF;

    batch_id        := v_batch.id;
    batch_number    := v_batch.bn;
    available_qty   := LEAST(v_batch.rq, v_remaining);
    exp_date        := v_batch.ed;
    purchase_price  := v_batch.pp;

    v_remaining := v_remaining - available_qty;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- FUNCTION: expire_old_batches
-- Marks expired batches and creates EXPIRED transactions
-- Run daily via cron or manually
-- ============================================================
CREATE OR REPLACE FUNCTION expire_old_batches()
RETURNS INTEGER AS $$
DECLARE
  v_batch   RECORD;
  v_count   INTEGER := 0;
BEGIN
  FOR v_batch IN
    SELECT * FROM inventory_batches
    WHERE exp_date < CURRENT_DATE
      AND status = 'ACTIVE'
      AND remaining_quantity > 0
  LOOP
    -- Create expiry transaction
    INSERT INTO stock_transactions (
      transaction_type, product_id, batch_id,
      reference_type, reference_id, reference_number,
      quantity_in, quantity_out, notes
    ) VALUES (
      'EXPIRED',
      v_batch.product_id,
      v_batch.id,
      'BATCH', v_batch.id, v_batch.batch_number,
      0, v_batch.remaining_quantity,
      'Auto-expired: batch past expiry date'
    );

    -- Update batch status
    UPDATE inventory_batches
    SET status = 'EXPIRED', remaining_quantity = 0, updated_at = NOW()
    WHERE id = v_batch.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEW: expiry_dashboard
-- ============================================================
CREATE OR REPLACE VIEW expiry_dashboard AS
SELECT
  b.id            AS batch_id,
  b.batch_number,
  p.id            AS product_id,
  p.name          AS product_name,
  p.sku,
  c.name          AS category_name,
  p.unit,
  b.remaining_quantity,
  b.exp_date,
  (b.exp_date - CURRENT_DATE)::INTEGER AS days_to_expiry,
  CASE
    WHEN b.exp_date < CURRENT_DATE                                       THEN 'EXPIRED'
    WHEN b.exp_date <= CURRENT_DATE + INTERVAL '30 days'                 THEN 'EXPIRING_30'
    WHEN b.exp_date <= CURRENT_DATE + INTERVAL '60 days'                 THEN 'EXPIRING_60'
    WHEN b.exp_date <= CURRENT_DATE + INTERVAL '90 days'                 THEN 'EXPIRING_90'
    ELSE 'OK'
  END AS expiry_status,
  b.status        AS batch_status
FROM inventory_batches b
JOIN inventory_products p     ON p.id = b.product_id
LEFT JOIN inventory_categories c ON c.id = p.category_id
WHERE b.is_deleted = FALSE
  AND b.remaining_quantity > 0
ORDER BY b.exp_date ASC NULLS LAST;

-- To enable auto daily expiry (requires pg_cron extension):
-- SELECT cron.schedule('expire-batches-daily', '0 0 * * *', 'SELECT expire_old_batches()');

COMMIT;
