-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 004c (FINAL)
-- File: inv2_004c_functions_views.sql
--
-- Creates the 4 reporting views used by the inventory dashboard.
-- No role functions. No profiles. No fn_inv_user_role.
--
-- Auth model for this project:
--   All inventory writes → /api/inventory/* routes
--   All routes use supabaseAdmin (SUPABASE_SERVICE_ROLE_KEY)
--   Service role bypasses RLS — no policies needed
--   Admin identity enforced by AdminGuard (admins table check)
--
-- Run after 004b.
-- ============================================================

BEGIN;

-- ============================================================
-- VIEW: v_current_stock
-- Per-product available stock using the batch quantity cache.
-- ============================================================

CREATE OR REPLACE VIEW v_current_stock AS
SELECT
  p.uuid                                         AS product_uuid,
  p.product_code,
  p.product_name,
  p.generic_name,
  p.barcode,
  c.name                                         AS category_name,
  u.short_name                                   AS unit,
  m.manufacturer_name,
  COALESCE(SUM(
    CASE WHEN b.status = 'good' THEN b.available_quantity ELSE 0 END
  ), 0)                                          AS available_qty,
  COALESCE(SUM(b.available_quantity), 0)         AS total_qty_all_batches,
  COUNT(DISTINCT b.uuid)
    FILTER (WHERE b.status = 'good')             AS active_batch_count,
  p.reorder_level,
  p.minimum_stock,
  p.maximum_stock,
  CASE
    WHEN COALESCE(SUM(
      CASE WHEN b.status = 'good' THEN b.available_quantity ELSE 0 END
    ), 0) = 0                                    THEN 'OUT_OF_STOCK'
    WHEN COALESCE(SUM(
      CASE WHEN b.status = 'good' THEN b.available_quantity ELSE 0 END
    ), 0) <= p.reorder_level                     THEN 'LOW_STOCK'
    ELSE                                              'OK'
  END                                            AS stock_status,
  p.purchase_price,
  p.selling_price,
  p.mrp,
  p.is_active
FROM inv_products p
LEFT JOIN inv_categories      c ON c.uuid = p.category_uuid
LEFT JOIN inv_units            u ON u.uuid = p.unit_uuid
LEFT JOIN inv_manufacturers    m ON m.uuid = p.manufacturer_uuid
LEFT JOIN inv_product_batches  b ON b.product_uuid = p.uuid AND b.is_active = TRUE
WHERE p.is_active = TRUE
GROUP BY
  p.uuid, p.product_code, p.product_name, p.generic_name,
  p.barcode, c.name, u.short_name, m.manufacturer_name,
  p.reorder_level, p.minimum_stock, p.maximum_stock,
  p.purchase_price, p.selling_price, p.mrp, p.is_active;

COMMENT ON VIEW v_current_stock IS
  'Current stock per product from batch cache. '
  'For authoritative figures use fn_get_product_stock(product_uuid).';


-- ============================================================
-- VIEW: v_expiring_batches
-- Batches expiring within 30 days, or already expired with remaining stock.
-- ============================================================

CREATE OR REPLACE VIEW v_expiring_batches AS
SELECT
  b.uuid                             AS batch_uuid,
  b.batch_number,
  p.uuid                             AS product_uuid,
  p.product_code,
  p.product_name,
  b.expiry_date,
  b.manufacturing_date,
  b.available_quantity,
  b.mrp,
  b.selling_price,
  b.status,
  s.company_name                     AS supplier_name,
  (b.expiry_date - CURRENT_DATE)     AS days_to_expiry,
  CASE
    WHEN b.expiry_date < CURRENT_DATE                   THEN 'EXPIRED'
    WHEN (b.expiry_date - CURRENT_DATE) <= 7            THEN 'CRITICAL'
    WHEN (b.expiry_date - CURRENT_DATE) <= 30           THEN 'WARNING'
    ELSE                                                     'OK'
  END                                AS expiry_status
FROM inv_product_batches  b
JOIN  inv_products         p ON p.uuid = b.product_uuid
LEFT JOIN inv_suppliers    s ON s.uuid = b.supplier_uuid
WHERE
  b.is_active = TRUE
  AND b.available_quantity > 0
  AND b.expiry_date IS NOT NULL
  AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY b.expiry_date ASC;

COMMENT ON VIEW v_expiring_batches IS
  'Batches expiring within 30 days. Used by dashboard and expiry report.';


-- ============================================================
-- VIEW: v_inventory_valuation
-- Per-product stock value at cost, MRP, and selling price.
-- ============================================================

CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT
  p.uuid                                            AS product_uuid,
  p.product_code,
  p.product_name,
  c.name                                            AS category_name,
  COALESCE(SUM(
    CASE WHEN b.status = 'good' THEN b.available_quantity            ELSE 0 END
  ), 0)                                             AS available_qty,
  COALESCE(SUM(
    CASE WHEN b.status = 'good' THEN b.available_quantity * b.purchase_price ELSE 0 END
  ), 0)                                             AS value_at_cost,
  COALESCE(SUM(
    CASE WHEN b.status = 'good' THEN b.available_quantity * b.mrp            ELSE 0 END
  ), 0)                                             AS value_at_mrp,
  COALESCE(SUM(
    CASE WHEN b.status = 'good' THEN b.available_quantity * b.selling_price  ELSE 0 END
  ), 0)                                             AS value_at_selling
FROM inv_products p
LEFT JOIN inv_categories      c ON c.uuid = p.category_uuid
LEFT JOIN inv_product_batches b ON b.product_uuid = p.uuid AND b.is_active = TRUE
WHERE p.is_active = TRUE
GROUP BY p.uuid, p.product_code, p.product_name, c.name;

COMMENT ON VIEW v_inventory_valuation IS
  'Inventory valuation per product at cost, MRP, and selling price.';


-- ============================================================
-- VIEW: v_dashboard_summary
-- Single-row KPI summary. Calculated live — nothing stored.
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM inv_products      WHERE is_active = TRUE)  AS total_products,
  (SELECT COUNT(*) FROM inv_categories    WHERE is_active = TRUE)  AS total_categories,
  (SELECT COUNT(*) FROM inv_suppliers     WHERE is_active = TRUE)  AS total_suppliers,
  (SELECT COUNT(*) FROM inv_manufacturers WHERE is_active = TRUE)  AS total_manufacturers,

  (SELECT COUNT(*) FROM v_current_stock WHERE stock_status = 'LOW_STOCK')    AS low_stock_count,
  (SELECT COUNT(*) FROM v_current_stock WHERE stock_status = 'OUT_OF_STOCK') AS out_of_stock_count,

  (SELECT COUNT(*) FROM inv_product_batches
   WHERE is_active = TRUE AND status = 'good')                     AS active_batches,

  (SELECT COUNT(*) FROM inv_product_batches
   WHERE is_active = TRUE AND status = 'good'
     AND expiry_date IS NOT NULL
     AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
                                                                   AS expiring_30_days,

  (SELECT COUNT(*) FROM inv_product_batches
   WHERE is_active = TRUE
     AND expiry_date < CURRENT_DATE
     AND available_quantity > 0)                                    AS expired_stock_count,

  (SELECT COUNT(*) FROM inv_product_batches
   WHERE is_active = TRUE AND status = 'damaged'
     AND available_quantity > 0)                                    AS damaged_stock_count,

  (SELECT COUNT(*) FROM inv_purchase_orders
   WHERE status IN ('draft','pending','approved') AND is_active = TRUE) AS pending_po_count,

  (SELECT COUNT(*) FROM inv_purchase_orders
   WHERE status = 'approved' AND is_active = TRUE)                 AS approved_po_count,

  (SELECT COUNT(*) FROM inv_goods_receipts
   WHERE received_date = CURRENT_DATE AND status = 'posted')       AS todays_grn_count,

  (SELECT COUNT(*) FROM inv_stock_movements
   WHERE DATE(created_at) = CURRENT_DATE)                          AS todays_movements,

  (SELECT COALESCE(SUM(value_at_cost), 0) FROM v_inventory_valuation) AS total_inventory_value_cost,
  (SELECT COALESCE(SUM(value_at_mrp),  0) FROM v_inventory_valuation) AS total_inventory_value_mrp;

COMMENT ON VIEW v_dashboard_summary IS
  'All inventory dashboard KPI cards in one row. Fully calculated live.';

COMMIT;
