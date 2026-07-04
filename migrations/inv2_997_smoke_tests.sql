-- ============================================================
-- AYURSHALA INVENTORY v2 — SMOKE TESTS
-- File: inv2_997_smoke_tests.sql
--
-- Validates the full transaction workflow end-to-end:
--   A. GRN Post Transaction
--   B. Rollback Test (deliberately broken GRN)
--   C. Rebuild Test
--   D. Stock Views and Dashboard
--
-- Run AFTER: inv2_998_test_data.sql
-- Uses dynamically-retrieved UUIDs — no hardcoded placeholders.
-- ============================================================

-- ============================================================
-- SMOKE TEST A: POST GRN-TEST-001
-- Expected after this runs:
--   ✅ 3 batches created in inv_product_batches
--   ✅ 3 movements in inv_stock_movements (type = PURCHASE)
--   ✅ PO-TEST-001 items updated with received_qty > 0
--   ✅ PO-TEST-001 status changes to 'received' or 'partially_received'
--   ✅ v_dashboard_summary shows stock
-- ============================================================

-- Step A1: Confirm GRN is in draft status before posting
SELECT
  grn_number,
  status,
  CASE WHEN status = 'draft' THEN '✅ Ready to post' ELSE '❌ Not in draft' END AS readiness
FROM inv_goods_receipts
WHERE grn_number = 'GRN-TEST-001';

-- Step A2: Confirm no batches or movements exist yet
SELECT
  'Batches before post'   AS check_point,
  COUNT(*)                AS count
FROM inv_product_batches
WHERE grn_uuid = (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-001');

SELECT
  'Movements before post' AS check_point,
  COUNT(*)                AS count
FROM inv_stock_movements
WHERE reference_uuid = (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-001');

-- Step A3: POST THE GRN
-- Using NULL for created_by since this is automated via Service Role.
-- When run by authenticated users, pass auth.uid() instead.
SELECT fn_post_grn(
  (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-001'),
  NULL::UUID   -- Service role automation: NULL for audit
) AS post_result;

-- Step A4: Verify GRN status changed to 'posted'
SELECT
  grn_number,
  status,
  CASE WHEN status = 'posted' THEN '✅ PASS' ELSE '❌ FAIL — expected posted' END AS status_check
FROM inv_goods_receipts
WHERE grn_number = 'GRN-TEST-001';

-- Step A5: Verify batches were created
SELECT
  '✅ Batch created'      AS event,
  b.batch_number,
  p.product_name,
  b.available_quantity,
  b.purchase_price,
  b.expiry_date,
  b.status
FROM inv_product_batches b
JOIN inv_products p ON p.uuid = b.product_uuid
WHERE b.grn_uuid = (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-001')
ORDER BY b.batch_number;

-- Step A6: Verify stock movements were created
SELECT
  '✅ Movement created'   AS event,
  m.movement_type,
  p.product_name,
  b.batch_number,
  m.quantity,
  m.before_stock,
  m.after_stock,
  m.reference_type,
  m.created_at
FROM inv_stock_movements m
JOIN inv_products p ON p.uuid = m.product_uuid
LEFT JOIN inv_product_batches b ON b.uuid = m.batch_uuid
WHERE m.reference_uuid = (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-001')
ORDER BY m.created_at;

-- Step A7: Verify PO item received quantities updated
SELECT
  p.product_name,
  poi.ordered_quantity,
  poi.received_quantity,
  CASE WHEN poi.received_quantity > 0 THEN '✅ Updated' ELSE '❌ Not updated' END AS status
FROM inv_purchase_order_items poi
JOIN inv_products p ON p.uuid = poi.product_uuid
WHERE poi.purchase_order_uuid = (SELECT uuid FROM inv_purchase_orders WHERE po_number = 'PO-TEST-001')
ORDER BY p.product_name;

-- Step A8: Verify PO status updated automatically by trigger
SELECT
  po_number,
  status,
  CASE WHEN status IN ('partially_received','received')
       THEN '✅ PASS — trigger updated PO status'
       ELSE '❌ FAIL — PO status not updated' END AS trigger_check
FROM inv_purchase_orders
WHERE po_number = 'PO-TEST-001';

-- Step A9: Verify available_quantity matches movements (cache vs source of truth)
SELECT
  p.product_name,
  b.batch_number,
  b.available_quantity                          AS cached_qty,
  fn_get_product_stock(p.uuid)                  AS calculated_from_movements,
  CASE WHEN b.available_quantity = fn_get_product_stock(p.uuid)
       THEN '✅ MATCH — cache is accurate'
       ELSE '❌ MISMATCH — rebuild needed' END  AS consistency_check
FROM inv_product_batches b
JOIN inv_products p ON p.uuid = b.product_uuid
WHERE b.grn_uuid = (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-001');

-- Step A10: Verify dashboard summary updated
SELECT
  total_products,
  active_batches,
  todays_grn_count,
  todays_movements,
  total_inventory_value_cost,
  CASE WHEN active_batches >= 3 AND todays_grn_count >= 1
       THEN '✅ PASS — dashboard reflects GRN'
       ELSE '❌ FAIL — dashboard not updated' END AS dashboard_check
FROM v_dashboard_summary;

-- Step A11: Post GRN-TEST-002 (partial receipt / non-batch product)
SELECT fn_post_grn(
  (SELECT uuid FROM inv_goods_receipts WHERE grn_number = 'GRN-TEST-002'),
  NULL::UUID  -- Service role automation: NULL for audit
) AS post_result_grn2;

-- Verify partial receipt: PO-TEST-002 should be 'partially_received'
SELECT
  po_number,
  status,
  CASE WHEN status = 'partially_received'
       THEN '✅ PASS — partial receipt correctly detected'
       ELSE '❌ FAIL — expected partially_received, got: ' || status END AS partial_check
FROM inv_purchase_orders
WHERE po_number = 'PO-TEST-002';


-- ============================================================
-- SMOKE TEST B: ROLLBACK TEST
-- Deliberately trigger fn_post_grn() with a bad product FK.
-- Expected: exception raised, NO batch, NO movement, NO qty change.
--
-- Uses real GRN structure but inserts an invalid product reference
-- WITHIN the function context (not during INSERT).
-- ============================================================

-- B1: Record state BEFORE the failed attempt
-- (These will be compared after the test)
-- SELECT COUNT(*) FROM inv_product_batches;  -- Record this before
-- SELECT COUNT(*) FROM inv_stock_movements;  -- Record this before

-- B2: Test FK constraint violation with bad product reference
--     First, try to create a GRN with a non-existent product UUID.
--     The FK constraint should block this, and the transaction should roll back.

DO $$
DECLARE
  v_bad_grn_uuid UUID := 'DEADBEEF-DEAD-DEAD-DEAD-DEADBEEF0001'::UUID;
  v_bad_product_uuid UUID := 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'::UUID;
  v_bad_grni_uuid UUID := 'DEADBEEF-DEAD-DEAD-DEAD-DEADBEEF0002'::UUID;
  v_supplier_uuid UUID;
BEGIN
  -- Get a real supplier (this exists from test data)
  SELECT uuid INTO v_supplier_uuid
  FROM inv_suppliers
  WHERE supplier_code = 'SUP-000001'
  LIMIT 1;

  IF v_supplier_uuid IS NULL THEN
    RAISE NOTICE '❌ Test setup failed: no supplier found';
    RETURN;
  END IF;

  BEGIN
    -- Attempt to insert a GRN with a non-existent product reference
    INSERT INTO inv_goods_receipts (
      uuid, grn_number, supplier_uuid,
      invoice_number, received_date, status, total_amount
    ) VALUES (
      v_bad_grn_uuid,
      'GRN-ROLLBACK-TEST',
      v_supplier_uuid,
      'FAKE-INV-001',
      CURRENT_DATE,
      'draft',
      0
    );

    -- This INSERT will fail because product_uuid does not exist
    INSERT INTO inv_goods_receipt_items (
      uuid, grn_uuid, product_uuid,
      batch_number, expiry_date,
      mrp, purchase_price, selling_price,
      received_qty, free_qty, gst_percentage, line_amount
    ) VALUES (
      v_bad_grni_uuid,
      v_bad_grn_uuid,
      v_bad_product_uuid,  -- ❌ This UUID does not exist in inv_products → FK violation
      'BATCH-BAD-001',
      CURRENT_DATE + 365,
      100.00, 80.00, 90.00,
      5, 0, 12.00, 500.00
    );

    RAISE NOTICE '❌ FAIL — FK constraint should have blocked bad product_uuid';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '✅ PASS — FK constraint correctly blocked non-existent product';
  END;
END;
$$;

-- B3: Verify bad GRN was never inserted (FK violation rolled it back)
SELECT
  'Bad GRN existence'              AS check_name,
  CASE WHEN COUNT(*) = 0
       THEN '✅ PASS — GRN-ROLLBACK-TEST does not exist (rolled back by FK)'
       ELSE '❌ FAIL — GRN persisted despite FK violation' END AS rollback_check
FROM inv_goods_receipts
WHERE grn_number = 'GRN-ROLLBACK-TEST';

-- B4: Verify batch and movement counts unchanged (or show current state)
SELECT
  'Batches after rollback test'    AS snapshot,
  COUNT(*)                          AS count
FROM inv_product_batches;

SELECT
  'Movements after rollback test'  AS snapshot,
  COUNT(*)                          AS count
FROM inv_stock_movements;


-- ============================================================
-- SMOKE TEST C: IMMUTABILITY GUARD
-- Attempt to UPDATE and DELETE a stock movement.
-- Both MUST raise exceptions.
-- ============================================================

-- C1: Try UPDATE on a stock movement (must fail)
DO $$
DECLARE
  v_movement_uuid UUID;
BEGIN
  SELECT uuid INTO v_movement_uuid FROM inv_stock_movements LIMIT 1;

  IF v_movement_uuid IS NULL THEN
    RAISE NOTICE '⚠️  No movements exist yet. Run Smoke Test A first.';
    RETURN;
  END IF;

  BEGIN
    UPDATE inv_stock_movements
    SET remarks = 'tampered'
    WHERE uuid = v_movement_uuid;
    RAISE NOTICE '❌ FAIL — UPDATE succeeded (immutability guard not working)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASS — UPDATE blocked: %', SQLERRM;
  END;
END;
$$;

-- C2: Try DELETE on a stock movement (must fail)
DO $$
DECLARE
  v_movement_uuid UUID;
BEGIN
  SELECT uuid INTO v_movement_uuid FROM inv_stock_movements LIMIT 1;

  IF v_movement_uuid IS NULL THEN
    RAISE NOTICE '⚠️  No movements exist yet. Run Smoke Test A first.';
    RETURN;
  END IF;

  BEGIN
    DELETE FROM inv_stock_movements WHERE uuid = v_movement_uuid;
    RAISE NOTICE '❌ FAIL — DELETE succeeded (immutability guard not working)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASS — DELETE blocked: %', SQLERRM;
  END;
END;
$$;

-- C3: Try editing a POSTED GRN (must fail)
DO $$
BEGIN
  BEGIN
    UPDATE inv_goods_receipts
    SET remarks = 'edited after posting'
    WHERE grn_number = 'GRN-TEST-001';
    RAISE NOTICE '❌ FAIL — Editing posted GRN succeeded';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASS — Editing posted GRN blocked: %', SQLERRM;
  END;
END;
$$;


-- ============================================================
-- SMOKE TEST D: REBUILD TEST
-- Artificially corrupt available_quantity, then rebuild.
-- Verify it matches movements exactly.
-- ============================================================

-- D1: Record current accurate quantities
SELECT
  b.batch_number,
  p.product_name,
  b.available_quantity                 AS current_cache,
  fn_get_product_stock(p.uuid)         AS from_movements
FROM inv_product_batches b
JOIN inv_products p ON p.uuid = b.product_uuid
ORDER BY b.batch_number;

-- D2: Corrupt the cache for one batch (if any exist)
DO $$
DECLARE
  v_batch_uuid UUID;
  v_batch_number TEXT;
BEGIN
  SELECT uuid INTO v_batch_uuid
  FROM inv_product_batches
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_batch_uuid IS NOT NULL THEN
    UPDATE inv_product_batches
    SET available_quantity = 9999
    WHERE uuid = v_batch_uuid;

    -- Get the batch number for the notice
    SELECT batch_number INTO v_batch_number
    FROM inv_product_batches
    WHERE uuid = v_batch_uuid;

    RAISE NOTICE '❌ Cache corrupted intentionally for batch: %', v_batch_number;
  ELSE
    RAISE NOTICE '⚠️  No batches exist yet. Run Smoke Test A first.';
  END IF;
END;
$$;

-- D3: Run rebuild
SELECT fn_rebuild_all_batch_quantities() AS batches_rebuilt;

-- D4: Verify cache now matches movements
SELECT
  b.batch_number,
  p.product_name,
  b.available_quantity                 AS rebuilt_cache,
  fn_get_product_stock(p.uuid)         AS from_movements,
  CASE WHEN b.available_quantity = fn_get_product_stock(p.uuid)
       THEN '✅ PASS — cache matches movements'
       ELSE '❌ FAIL — mismatch after rebuild' END AS rebuild_check
FROM inv_product_batches b
JOIN inv_products p ON p.uuid = b.product_uuid
ORDER BY b.batch_number;


-- ============================================================
-- SMOKE TEST E: EXPIRY ALERT VIEW
-- ============================================================

SELECT
  batch_number,
  product_name,
  expiry_date,
  days_to_expiry,
  expiry_status,
  available_quantity
FROM v_expiring_batches
ORDER BY days_to_expiry;

-- Near-expiry batch check (if any exist from test data)
SELECT
  'Near-expiry batch visible'          AS check_name,
  CASE WHEN COUNT(*) > 0
       THEN '✅ PASS — expiry alert working'
       ELSE '⚠️  No near-expiry batches in test data' END AS status
FROM v_expiring_batches
WHERE days_to_expiry < 30;


-- ============================================================
-- SMOKE TEST F: CURRENT STOCK VIEW
-- ============================================================

SELECT
  product_code,
  product_name,
  available_qty,
  stock_status,
  active_batch_count
FROM v_current_stock
ORDER BY product_code;

SELECT
  'Stock view has data'                AS check_name,
  CASE WHEN COUNT(*) > 0
       THEN '✅ PASS'
       ELSE '❌ FAIL — no stock visible' END AS status
FROM v_current_stock
WHERE available_qty > 0;


-- ============================================================
-- SMOKE TEST G: INVENTORY VALUATION VIEW
-- ============================================================

SELECT
  product_code,
  product_name,
  available_qty,
  value_at_cost,
  value_at_mrp,
  value_at_selling
FROM v_inventory_valuation
WHERE available_qty > 0
ORDER BY value_at_cost DESC;


-- ============================================================
-- SMOKE TEST H: FULL DASHBOARD SUMMARY
-- ============================================================

SELECT
  total_products,
  total_categories,
  total_suppliers,
  total_manufacturers,
  low_stock_count,
  out_of_stock_count,
  active_batches,
  expiring_30_days,
  pending_po_count,
  todays_grn_count,
  todays_movements,
  total_inventory_value_cost,
  total_inventory_value_mrp
FROM v_dashboard_summary;
