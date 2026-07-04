-- ============================================================
-- AYURSHALA INVENTORY v2 — PERFORMANCE TESTS (EXPLAIN ANALYZE)
-- File: inv2_996_performance.sql
--
-- Run AFTER inv2_997_smoke_tests.sql (requires data to exist).
-- Each EXPLAIN ANALYZE shows whether indexes are being used.
--
-- What to look for:
--   ✅ "Index Scan" or "Bitmap Index Scan" → index used
--   ⚠️  "Seq Scan" on large tables → may need index tuning
--   ✅ "cost=" numbers should be low for common queries
--
-- Run each section separately in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- PERF 1: Current Stock Query
-- Expected: Index Scan on idx_inv_prod_active + idx_inv_batch_prod_status
-- ============================================================

EXPLAIN ANALYZE
SELECT
  p.product_code,
  p.product_name,
  SUM(CASE WHEN b.status = 'good' THEN b.available_quantity ELSE 0 END) AS available_qty,
  COUNT(DISTINCT b.uuid) FILTER (WHERE b.status = 'good') AS batch_count
FROM inv_products p
LEFT JOIN inv_product_batches b
  ON b.product_uuid = p.uuid AND b.is_active = TRUE
WHERE p.is_active = TRUE
GROUP BY p.product_code, p.product_name
ORDER BY p.product_code;

-- ============================================================
-- PERF 2: Current Stock View
-- ============================================================

EXPLAIN ANALYZE
SELECT * FROM v_current_stock
ORDER BY product_code;

-- ============================================================
-- PERF 3: Expiring Stock (next 30 days)
-- Expected: Index Scan on idx_inv_batch_expiry
-- ============================================================

EXPLAIN ANALYZE
SELECT * FROM v_expiring_batches
ORDER BY days_to_expiry;

-- Direct query version (without view)
EXPLAIN ANALYZE
SELECT
  b.batch_number,
  p.product_name,
  b.expiry_date,
  b.available_quantity,
  (b.expiry_date - CURRENT_DATE) AS days_to_expiry
FROM inv_product_batches b
JOIN inv_products p ON p.uuid = b.product_uuid
WHERE
  b.is_active = TRUE
  AND b.available_quantity > 0
  AND b.expiry_date IS NOT NULL
  AND b.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY b.expiry_date;

-- ============================================================
-- PERF 4: Inventory Valuation View
-- ============================================================

EXPLAIN ANALYZE
SELECT * FROM v_inventory_valuation
ORDER BY value_at_cost DESC;

-- ============================================================
-- PERF 5: Stock Movements by Product (Product Ledger)
-- Expected: Index Scan on idx_inv_mov_prod_date
-- ============================================================

EXPLAIN ANALYZE
SELECT
  m.movement_type,
  m.quantity,
  m.before_stock,
  m.after_stock,
  m.reference_type,
  m.created_at
FROM inv_stock_movements m
WHERE m.product_uuid = '33333333-0003-0003-0003-000000000001'
ORDER BY m.created_at DESC;

-- ============================================================
-- PERF 6: Product Search by Name (Full-text)
-- Expected: Bitmap Index Scan on idx_inv_prod_fts
-- ============================================================

EXPLAIN ANALYZE
SELECT product_code, product_name, generic_name
FROM inv_products
WHERE to_tsvector('english', product_name || ' ' || COALESCE(generic_name,''))
      @@ plainto_tsquery('english', 'oil')
  AND is_active = TRUE;

-- ============================================================
-- PERF 7: Product Search by Code/Barcode
-- Expected: Index Scan on idx_inv_prod_code or idx_inv_prod_barcode
-- ============================================================

EXPLAIN ANALYZE
SELECT * FROM inv_products
WHERE product_code = 'PRD-0001';

EXPLAIN ANALYZE
SELECT * FROM inv_products
WHERE barcode = '8901234567001';

-- ============================================================
-- PERF 8: Batch search by batch number
-- Expected: Index Scan on idx_inv_batch_number
-- ============================================================

EXPLAIN ANALYZE
SELECT * FROM inv_product_batches
WHERE batch_number = 'BATCH-DT-2026-01';

-- ============================================================
-- PERF 9: Purchase Orders by Supplier + Status
-- Expected: Index Scan on idx_inv_po_supplier + idx_inv_po_status
-- ============================================================

EXPLAIN ANALYZE
SELECT *
FROM inv_purchase_orders
WHERE supplier_uuid = '22222222-0002-0002-0002-000000000001'
  AND status = 'approved'
ORDER BY order_date DESC;

-- ============================================================
-- PERF 10: Stock Movements for a Batch (FIFO query pattern)
-- Expected: Index Scan on idx_inv_mov_batch_type
-- ============================================================

EXPLAIN ANALYZE
SELECT
  batch_uuid,
  movement_type,
  quantity,
  before_stock,
  after_stock,
  created_at
FROM inv_stock_movements
WHERE batch_uuid = (
  SELECT uuid FROM inv_product_batches WHERE batch_number = 'BATCH-DT-2026-01'
)
ORDER BY created_at ASC;

-- ============================================================
-- PERF 11: Dashboard Summary View
-- ============================================================

EXPLAIN ANALYZE
SELECT * FROM v_dashboard_summary;

-- ============================================================
-- PERF 12: Low Stock Products
-- Expected: uses idx_inv_prod_active + batch indexes
-- ============================================================

EXPLAIN ANALYZE
SELECT product_code, product_name, available_qty, reorder_level, stock_status
FROM v_current_stock
WHERE stock_status IN ('LOW_STOCK', 'OUT_OF_STOCK')
ORDER BY available_qty ASC;
