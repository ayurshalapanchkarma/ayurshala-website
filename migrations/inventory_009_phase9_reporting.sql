-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_009_phase9_reporting.sql
-- Phase 9 & 10: Reporting Views + Dashboard Summary
-- ============================================================

BEGIN;

-- ============================================================
-- VIEW: report_stock_summary
-- ============================================================
CREATE OR REPLACE VIEW report_stock_summary AS
SELECT
  p.id                                                            AS product_id,
  p.sku,
  p.name                                                          AS product_name,
  c.name                                                          AS category_name,
  p.unit,
  p.reorder_level,
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0)::INTEGER AS current_stock,
  CASE WHEN COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0) <= p.reorder_level
       THEN TRUE ELSE FALSE END                                   AS is_low_stock,
  COUNT(DISTINCT b.id)                                            AS total_batches,
  COUNT(DISTINCT CASE WHEN b.status = 'ACTIVE' THEN b.id END)    AS active_batches,
  COUNT(DISTINCT CASE WHEN b.status = 'EXPIRED' THEN b.id END)   AS expired_batches,
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0) * p.purchase_price AS inventory_value
FROM inventory_products p
LEFT JOIN inventory_categories c  ON c.id = p.category_id
LEFT JOIN stock_transactions t    ON t.product_id = p.id
LEFT JOIN inventory_batches b     ON b.product_id = p.id AND b.is_deleted = FALSE
WHERE p.is_deleted = FALSE
GROUP BY p.id, p.sku, p.name, c.name, p.unit, p.reorder_level, p.purchase_price;

-- ============================================================
-- VIEW: report_low_stock
-- ============================================================
CREATE OR REPLACE VIEW report_low_stock AS
SELECT
  product_id,
  sku,
  product_name,
  category_name,
  unit,
  current_stock,
  reorder_level,
  (reorder_level - current_stock) AS deficit
FROM report_stock_summary
WHERE is_low_stock = TRUE
ORDER BY deficit DESC;

-- ============================================================
-- VIEW: report_purchase_summary (monthly)
-- ============================================================
CREATE OR REPLACE VIEW report_purchase_summary AS
SELECT
  EXTRACT(YEAR FROM g.received_date)::INTEGER   AS year,
  EXTRACT(MONTH FROM g.received_date)::INTEGER  AS month,
  TO_CHAR(g.received_date, 'Mon YYYY')          AS month_label,
  COUNT(DISTINCT g.id)                           AS total_grns,
  COUNT(DISTINCT po.id)                          AS total_pos,
  COALESCE(SUM(g.invoice_amount), 0)             AS total_invoice_amount
FROM goods_received_notes g
LEFT JOIN purchase_orders po ON po.id = g.po_id
WHERE g.is_deleted = FALSE
GROUP BY
  EXTRACT(YEAR FROM g.received_date),
  EXTRACT(MONTH FROM g.received_date),
  TO_CHAR(g.received_date, 'Mon YYYY')
ORDER BY year DESC, month DESC;

-- ============================================================
-- VIEW: report_sales_summary (monthly)
-- ============================================================
CREATE OR REPLACE VIEW report_sales_summary AS
SELECT
  EXTRACT(YEAR FROM invoice_date)::INTEGER   AS year,
  EXTRACT(MONTH FROM invoice_date)::INTEGER  AS month,
  TO_CHAR(invoice_date, 'Mon YYYY')          AS month_label,
  COUNT(*)                                    AS total_invoices,
  COALESCE(SUM(total_amount), 0)              AS total_revenue,
  COALESCE(SUM(gst_amount), 0)               AS total_gst_collected
FROM sales
WHERE status = 'COMPLETED' AND is_deleted = FALSE
GROUP BY
  EXTRACT(YEAR FROM invoice_date),
  EXTRACT(MONTH FROM invoice_date),
  TO_CHAR(invoice_date, 'Mon YYYY')
ORDER BY year DESC, month DESC;

-- ============================================================
-- VIEW: report_inventory_valuation
-- ============================================================
CREATE OR REPLACE VIEW report_inventory_valuation AS
SELECT
  p.id          AS product_id,
  p.sku,
  p.name        AS product_name,
  c.name        AS category_name,
  p.unit,
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0)::INTEGER AS current_stock,
  p.purchase_price                                                AS avg_purchase_price,
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0) * p.purchase_price AS total_value
FROM inventory_products p
LEFT JOIN inventory_categories c ON c.id = p.category_id
LEFT JOIN stock_transactions t   ON t.product_id = p.id
WHERE p.is_deleted = FALSE AND p.status = 'ACTIVE'
GROUP BY p.id, p.sku, p.name, c.name, p.unit, p.purchase_price
ORDER BY total_value DESC;

-- ============================================================
-- VIEW: report_fast_moving (last 30 days)
-- ============================================================
CREATE OR REPLACE VIEW report_fast_moving AS
SELECT
  p.id          AS product_id,
  p.name        AS product_name,
  c.name        AS category_name,
  p.unit,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE'        THEN t.quantity_out ELSE 0 END), 0) AS total_sold,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'CONSUMPTION' THEN t.quantity_out ELSE 0 END), 0) AS total_consumed,
  COALESCE(SUM(t.quantity_out), 0)                                                               AS total_movement
FROM inventory_products p
LEFT JOIN inventory_categories c ON c.id = p.category_id
LEFT JOIN stock_transactions t   ON t.product_id = p.id
  AND t.transaction_date >= NOW() - INTERVAL '30 days'
  AND t.transaction_type IN ('SALE', 'CONSUMPTION')
WHERE p.is_deleted = FALSE
GROUP BY p.id, p.name, c.name, p.unit
HAVING COALESCE(SUM(t.quantity_out), 0) > 0
ORDER BY total_movement DESC;

-- ============================================================
-- VIEW: report_slow_moving (no movement in last 30 days)
-- ============================================================
CREATE OR REPLACE VIEW report_slow_moving AS
SELECT
  p.id          AS product_id,
  p.name        AS product_name,
  c.name        AS category_name,
  p.unit,
  COALESCE(SUM(t.quantity_in) - SUM(t.quantity_out), 0)::INTEGER AS current_stock,
  MAX(t.transaction_date)                                         AS last_movement_date
FROM inventory_products p
LEFT JOIN inventory_categories c ON c.id = p.category_id
LEFT JOIN stock_transactions t   ON t.product_id = p.id
WHERE p.is_deleted = FALSE AND p.status = 'ACTIVE'
GROUP BY p.id, p.name, c.name, p.unit
HAVING MAX(t.transaction_date) < NOW() - INTERVAL '30 days'
    OR MAX(t.transaction_date) IS NULL
ORDER BY last_movement_date ASC NULLS FIRST;

-- ============================================================
-- VIEW: report_treatment_consumption
-- ============================================================
CREATE OR REPLACE VIEW report_treatment_consumption AS
SELECT
  tr.treatment_name,
  tr.treatment_code,
  EXTRACT(YEAR FROM tc.consumption_date)::INTEGER   AS year,
  EXTRACT(MONTH FROM tc.consumption_date)::INTEGER  AS month,
  TO_CHAR(tc.consumption_date, 'Mon YYYY')          AS month_label,
  COUNT(DISTINCT tc.id)                              AS times_performed,
  COUNT(DISTINCT tci.product_id)                     AS distinct_products_used,
  SUM(tci.quantity)                                  AS total_quantity_consumed
FROM treatment_consumptions tc
JOIN treatment_recipes tr        ON tr.id = tc.treatment_id
LEFT JOIN treatment_consumption_items tci ON tci.consumption_id = tc.id
WHERE tc.status = 'COMPLETED'
GROUP BY
  tr.treatment_name, tr.treatment_code,
  EXTRACT(YEAR FROM tc.consumption_date),
  EXTRACT(MONTH FROM tc.consumption_date),
  TO_CHAR(tc.consumption_date, 'Mon YYYY')
ORDER BY year DESC, month DESC, times_performed DESC;

-- ============================================================
-- VIEW: dashboard_summary (single row — for dashboard cards)
-- ============================================================
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  -- Products
  COUNT(DISTINCT p.id)                                              AS total_products,
  COUNT(DISTINCT CASE WHEN p.status = 'ACTIVE' THEN p.id END)      AS active_products,

  -- Inventory value
  COALESCE(SUM(
    CASE WHEN t.transaction_type IS NOT NULL
    THEN 0 END
  ), 0)                                                              AS _placeholder,  -- computed separately below

  -- Low stock
  (SELECT COUNT(*) FROM report_low_stock)                           AS low_stock_count,

  -- Expired batches with stock remaining
  (SELECT COUNT(*) FROM inventory_batches
   WHERE status = 'EXPIRED' AND remaining_quantity > 0)             AS expired_stock_count,

  -- Expiring in 30 days
  (SELECT COUNT(*) FROM expiry_dashboard
   WHERE expiry_status = 'EXPIRING_30')                             AS expiring_30_count,

  -- Today's consumption
  (SELECT COUNT(*) FROM stock_transactions
   WHERE transaction_type = 'CONSUMPTION'
     AND transaction_date::DATE = CURRENT_DATE)                     AS today_consumption_count,

  -- Today's sales
  (SELECT COUNT(*) FROM sales
   WHERE invoice_date = CURRENT_DATE AND status = 'COMPLETED')      AS today_sales_count,

  -- This month purchases
  (SELECT COALESCE(SUM(invoice_amount), 0) FROM goods_received_notes
   WHERE EXTRACT(MONTH FROM received_date) = EXTRACT(MONTH FROM NOW())
     AND EXTRACT(YEAR FROM received_date) = EXTRACT(YEAR FROM NOW())
     AND status = 'POSTED')                                         AS monthly_purchase_total,

  -- This month revenue
  (SELECT COALESCE(SUM(total_amount), 0) FROM sales
   WHERE EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM NOW())
     AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM NOW())
     AND status = 'COMPLETED')                                      AS monthly_sales_total

FROM inventory_products p
LEFT JOIN stock_transactions t ON t.product_id = p.id
WHERE p.is_deleted = FALSE;

COMMIT;
