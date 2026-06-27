-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_007_phase7_oil_tracking.sql
-- Phase 7: Oil Analytics Dashboard
-- ============================================================

BEGIN;

-- ============================================================
-- VIEW: oil_analytics
-- Full oil tracking: purchased, consumed, sold, balance, variance
-- ============================================================
CREATE OR REPLACE VIEW oil_analytics AS
SELECT
  p.id                                                          AS product_id,
  p.sku,
  p.name                                                        AS product_name,
  p.unit,

  -- Total purchased (from PURCHASE transactions)
  COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.quantity_in ELSE 0 END), 0) AS total_purchased,

  -- Total consumed in treatments
  COALESCE(SUM(CASE WHEN t.transaction_type = 'CONSUMPTION' THEN t.quantity_out ELSE 0 END), 0) AS total_consumed,

  -- Total sold at pharmacy
  COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.quantity_out ELSE 0 END), 0) AS total_sold,

  -- Total expired
  COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPIRED' THEN t.quantity_out ELSE 0 END), 0) AS total_expired,

  -- Total damaged/adjusted
  COALESCE(SUM(CASE WHEN t.transaction_type IN ('DAMAGED', 'ADJUSTMENT') THEN t.quantity_out ELSE 0 END), 0) AS total_damaged,

  -- Calculated balance from ledger
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0)        AS ledger_balance,

  -- Physical balance from active batches
  COALESCE((
    SELECT SUM(b.remaining_quantity)
    FROM inventory_batches b
    WHERE b.product_id = p.id AND b.status = 'ACTIVE'
  ), 0)                                                          AS physical_balance,

  -- Variance: should be 0 if everything is properly tracked
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0) -
  COALESCE((
    SELECT SUM(b.remaining_quantity)
    FROM inventory_batches b
    WHERE b.product_id = p.id AND b.status = 'ACTIVE'
  ), 0)                                                          AS variance

FROM inventory_products p
JOIN inventory_categories c     ON c.id = p.category_id AND c.slug = 'oils'
LEFT JOIN stock_transactions t  ON t.product_id = p.id
WHERE p.is_deleted = FALSE
GROUP BY p.id, p.sku, p.name, p.unit;

-- ============================================================
-- VIEW: oil_consumption_report
-- Monthly oil consumption breakdown
-- ============================================================
CREATE OR REPLACE VIEW oil_consumption_report AS
SELECT
  EXTRACT(YEAR FROM t.transaction_date)::INTEGER   AS year,
  EXTRACT(MONTH FROM t.transaction_date)::INTEGER  AS month,
  TO_CHAR(t.transaction_date, 'Mon YYYY')          AS month_label,
  p.name                                            AS product_name,
  p.unit,
  SUM(CASE WHEN t.transaction_type = 'CONSUMPTION' THEN t.quantity_out ELSE 0 END) AS qty_consumed,
  SUM(CASE WHEN t.transaction_type = 'SALE'        THEN t.quantity_out ELSE 0 END) AS qty_sold,
  SUM(t.quantity_out)                               AS total_qty_used
FROM stock_transactions t
JOIN inventory_products p     ON p.id = t.product_id
JOIN inventory_categories c   ON c.id = p.category_id AND c.slug = 'oils'
WHERE t.transaction_type IN ('CONSUMPTION', 'SALE')
GROUP BY
  EXTRACT(YEAR FROM t.transaction_date),
  EXTRACT(MONTH FROM t.transaction_date),
  TO_CHAR(t.transaction_date, 'Mon YYYY'),
  p.id, p.name, p.unit
ORDER BY year DESC, month DESC, product_name;

COMMIT;
