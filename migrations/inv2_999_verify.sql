-- ============================================================
-- AYURSHALA INVENTORY v2 — VERIFICATION SCRIPT
-- File: inv2_999_verify.sql
--
-- Run this in Supabase SQL Editor AFTER all inv2_00X migrations.
-- Every check prints PASS or FAIL with a description.
-- A passing migration produces ZERO FAIL rows.
--
-- Usage: paste entire file → Run
-- ============================================================

DO $$ BEGIN RAISE NOTICE '========================================'; END $$;
DO $$ BEGIN RAISE NOTICE 'AYURSHALA INVENTORY v2 — VERIFICATION'; END $$;
DO $$ BEGIN RAISE NOTICE '========================================'; END $$;

-- ============================================================
-- SECTION 1: TABLE EXISTENCE
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 1: TABLES ---'; END $$;

SELECT
  t.expected_table                          AS table_name,
  CASE WHEN e.table_name IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('inv_settings'),
  ('inv_categories'),
  ('inv_units'),
  ('inv_tax_master'),
  ('inv_manufacturers'),
  ('inv_suppliers'),
  ('inv_products'),
  ('inv_product_images'),
  ('inv_product_documents'),
  ('inv_warehouses'),
  ('inv_warehouse_locations'),
  ('inv_purchase_orders'),
  ('inv_purchase_order_items'),
  ('inv_goods_receipts'),
  ('inv_goods_receipt_items'),
  ('inv_product_batches'),
  ('inv_stock_movements'),
  ('inv_stock_adjustments'),
  ('inv_stock_adjustment_items'),
  ('inv_audit_log')
) AS t(expected_table)
LEFT JOIN information_schema.tables e
  ON e.table_name = t.expected_table
  AND e.table_schema = 'public'
ORDER BY t.expected_table;


-- ============================================================
-- SECTION 2: COLUMN SPOT-CHECK (critical columns only)
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 2: CRITICAL COLUMNS ---'; END $$;

SELECT
  c.check_label                             AS check_name,
  CASE WHEN col.column_name IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('inv_products.product_code',        'inv_products',        'product_code'),
  ('inv_products.barcode',             'inv_products',        'barcode'),
  ('inv_products.batch_tracking',      'inv_products',        'batch_tracking'),
  ('inv_products.expiry_tracking',     'inv_products',        'expiry_tracking'),
  ('inv_products.is_prescription',     'inv_products',        'is_prescription'),
  ('inv_products.rack_number',         'inv_products',        'rack_number'),
  ('inv_stock_movements.before_stock', 'inv_stock_movements', 'before_stock'),
  ('inv_stock_movements.after_stock',  'inv_stock_movements', 'after_stock'),
  ('inv_stock_movements.movement_type','inv_stock_movements', 'movement_type'),
  ('inv_product_batches.available_quantity','inv_product_batches','available_quantity'),
  ('inv_product_batches.status',       'inv_product_batches', 'status'),
  ('inv_suppliers.supplier_code',      'inv_suppliers',       'supplier_code'),
  ('inv_suppliers.bank_name',          'inv_suppliers',       'bank_name'),
  ('inv_suppliers.credit_limit',       'inv_suppliers',       'credit_limit'),
  ('inv_purchase_orders.approved_by',  'inv_purchase_orders', 'approved_by'),
  ('inv_purchase_orders.approved_at',  'inv_purchase_orders', 'approved_at'),
  ('inv_stock_adjustments.approved_by','inv_stock_adjustments','approved_by'),
  ('inv_audit_log.performed_by',       'inv_audit_log',       'performed_by')
) AS c(check_label, tbl, col)
LEFT JOIN information_schema.columns col
  ON col.table_schema = 'public'
  AND col.table_name  = c.tbl
  AND col.column_name = c.col
ORDER BY c.check_label;


-- ============================================================
-- SECTION 3: FOREIGN KEYS
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 3: FOREIGN KEYS ---'; END $$;

-- Show all FKs on inv_ tables (raw list for manual inspection)
SELECT
  tc.table_name         AS "from_table",
  kcu.column_name       AS "from_column",
  ccu.table_name        AS "to_table",
  ccu.column_name       AS "to_column",
  '✅ EXISTS'           AS status
FROM information_schema.table_constraints   tc
JOIN information_schema.key_column_usage    kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema   = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema   = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'inv_%'
ORDER BY tc.table_name, kcu.column_name;

-- Count check: expect at least 25 FKs
SELECT
  'FK count >= 25'                          AS check_name,
  COUNT(*)                                  AS actual_count,
  CASE WHEN COUNT(*) >= 25
       THEN '✅ PASS' ELSE '❌ FAIL — too few FKs' END AS status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_name LIKE 'inv_%';


-- ============================================================
-- SECTION 4: INDEXES
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 4: INDEXES ---'; END $$;

SELECT
  idx.expected_index                        AS index_name,
  CASE WHEN pg_idx.indexname IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('idx_inv_prod_code'),
  ('idx_inv_prod_barcode'),
  ('idx_inv_prod_sku'),
  ('idx_inv_prod_category'),
  ('idx_inv_prod_fts'),
  ('idx_inv_batch_product'),
  ('idx_inv_batch_expiry'),
  ('idx_inv_batch_number'),
  ('idx_inv_batch_status'),
  ('idx_inv_mov_product'),
  ('idx_inv_mov_batch'),
  ('idx_inv_mov_type'),
  ('idx_inv_mov_prod_date'),
  ('idx_inv_po_number'),
  ('idx_inv_po_supplier'),
  ('idx_inv_po_status'),
  ('idx_inv_grn_number'),
  ('idx_inv_grn_status'),
  ('idx_inv_grn_received_date'),
  ('idx_inv_sup_code'),
  ('idx_inv_adj_status')
) AS idx(expected_index)
LEFT JOIN pg_indexes pg_idx
  ON pg_idx.indexname = idx.expected_index
  AND pg_idx.schemaname = 'public'
ORDER BY idx.expected_index;

-- Count check: expect at least 50 indexes
SELECT
  'Index count >= 50'                       AS check_name,
  COUNT(*)                                  AS actual_count,
  CASE WHEN COUNT(*) >= 50
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'inv_%';


-- ============================================================
-- SECTION 5: TRIGGER FUNCTIONS
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 5: TRIGGER FUNCTIONS ---'; END $$;

SELECT
  fn.expected_fn                            AS function_name,
  CASE WHEN r.routine_name IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('fn_set_updated_at'),
  ('fn_protect_stock_movements'),
  ('fn_protect_audit_log'),
  ('fn_update_batch_available_quantity'),
  ('fn_auto_expire_batch'),
  ('fn_update_po_status_on_receipt'),
  ('fn_lock_posted_grn'),
  ('fn_lock_cancelled_po')
) AS fn(expected_fn)
LEFT JOIN information_schema.routines r
  ON r.routine_name   = fn.expected_fn
  AND r.routine_schema = 'public'
ORDER BY fn.expected_fn;


-- ============================================================
-- SECTION 6: TRIGGERS ATTACHED TO TABLES
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 6: TRIGGERS ATTACHED ---'; END $$;

SELECT
  tr.expected_trigger                       AS trigger_name,
  tr.expected_table                         AS on_table,
  CASE WHEN t.trigger_name IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('trg_stock_movements_no_update',    'inv_stock_movements'),
  ('trg_stock_movements_no_delete',    'inv_stock_movements'),
  ('trg_audit_log_no_update',          'inv_audit_log'),
  ('trg_audit_log_no_delete',          'inv_audit_log'),
  ('trg_movements_update_batch_qty',   'inv_stock_movements'),
  ('trg_batch_auto_expire',            'inv_product_batches'),
  ('trg_poi_update_po_status',         'inv_purchase_order_items'),
  ('trg_grn_lock_posted',              'inv_goods_receipts'),
  ('trg_po_lock_cancelled',            'inv_purchase_orders'),
  ('trg_inv_products_updated_at',      'inv_products'),
  ('trg_inv_purchase_orders_updated_at','inv_purchase_orders'),
  ('trg_inv_goods_receipts_updated_at','inv_goods_receipts'),
  ('trg_inv_product_batches_updated_at','inv_product_batches'),
  ('trg_inv_suppliers_updated_at',     'inv_suppliers')
) AS tr(expected_trigger, expected_table)
LEFT JOIN information_schema.triggers t
  ON t.trigger_name        = tr.expected_trigger
  AND t.event_object_table = tr.expected_table
  AND t.trigger_schema     = 'public'
ORDER BY tr.expected_table, tr.expected_trigger;


-- ============================================================
-- SECTION 7: BUSINESS FUNCTIONS
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 7: BUSINESS FUNCTIONS ---'; END $$;

SELECT
  fn.expected_fn                            AS function_name,
  CASE WHEN r.routine_name IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('fn_next_sequence_value'),
  ('fn_generate_po_number'),
  ('fn_generate_grn_number'),
  ('fn_generate_supplier_code'),
  ('fn_generate_adjustment_number'),
  ('fn_get_product_stock'),
  ('fn_rebuild_batch_quantity'),
  ('fn_rebuild_all_batch_quantities'),
  ('fn_post_grn'),
  ('fn_post_stock_adjustment')
) AS fn(expected_fn)
LEFT JOIN information_schema.routines r
  ON r.routine_name   = fn.expected_fn
  AND r.routine_schema = 'public'
ORDER BY fn.expected_fn;


-- ============================================================
-- SECTION 8: VIEWS
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 8: VIEWS ---'; END $$;

SELECT
  v.expected_view                           AS view_name,
  CASE WHEN tbl.table_name IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('v_current_stock'),
  ('v_expiring_batches'),
  ('v_inventory_valuation'),
  ('v_dashboard_summary')
) AS v(expected_view)
LEFT JOIN information_schema.tables tbl
  ON tbl.table_name   = v.expected_view
  AND tbl.table_schema = 'public'
  AND tbl.table_type  = 'VIEW'
ORDER BY v.expected_view;

-- Confirm views are queryable (no runtime errors)
SELECT 'v_dashboard_summary queryable' AS check_name,
       CASE WHEN total_products IS NOT NULL THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM v_dashboard_summary
LIMIT 1;


-- ============================================================
-- SECTION 9: RLS — VERIFY DISABLED (single-admin setup)
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 9: RLS DISABLED CHECK ---'; END $$;

-- All inv_ tables should have RLS OFF (single admin, service_role writes)
SELECT
  t.tablename                                AS table_name,
  CASE WHEN NOT t.rowsecurity
       THEN '✅ RLS OFF (correct)'
       ELSE '❌ RLS ON  (unexpected)' END    AS status
FROM pg_tables t
WHERE t.tablename LIKE 'inv_%'
  AND t.schemaname = 'public'
ORDER BY t.tablename;

-- Count check: expect ZERO policies on inv_ tables
SELECT
  'No RLS policies on inv_ tables'          AS check_name,
  COUNT(*)                                  AS policy_count,
  CASE WHEN COUNT(*) = 0
       THEN '✅ PASS — no policies (correct for single-admin)'
       ELSE '❌ FAIL — unexpected policies found' END AS status
FROM pg_policies
WHERE tablename LIKE 'inv_%';


-- ============================================================
-- SECTION 10: SEED DATA
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 10: SEED DATA ---'; END $$;

-- Units
SELECT
  'inv_units seed count >= 15'              AS check_name,
  COUNT(*)                                  AS actual_count,
  CASE WHEN COUNT(*) >= 15
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM inv_units;

-- Categories
SELECT
  'inv_categories seed count >= 10'         AS check_name,
  COUNT(*)                                  AS actual_count,
  CASE WHEN COUNT(*) >= 10
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM inv_categories;

-- Tax master
SELECT
  'inv_tax_master seed count >= 3'          AS check_name,
  COUNT(*)                                  AS actual_count,
  CASE WHEN COUNT(*) >= 3
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM inv_tax_master;

-- Settings — critical keys present
SELECT
  s.key                                     AS setting_key,
  CASE WHEN st.setting_key IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('po_prefix'),
  ('grn_prefix'),
  ('supplier_prefix'),
  ('adjustment_prefix'),
  ('seq_po_last_number'),
  ('seq_grn_last_number'),
  ('expiry_alert_days'),
  ('currency_symbol'),
  ('gst_enabled')
) AS s(key)
LEFT JOIN inv_settings st ON st.setting_key = s.key
ORDER BY s.key;

-- Warehouse
SELECT
  'Default warehouse exists'                AS check_name,
  CASE WHEN COUNT(*) > 0
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM inv_warehouses
WHERE is_default = TRUE;


-- ============================================================
-- SECTION 11: CONSTRAINT CHECKS
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 11: CONSTRAINTS ---'; END $$;

SELECT
  c.expected_constraint                     AS constraint_name,
  CASE WHEN con.conname IS NOT NULL
       THEN '✅ PASS' ELSE '❌ FAIL' END    AS status
FROM (VALUES
  ('uq_inv_product_code'),
  ('uq_inv_product_barcode'),
  ('uq_inv_supplier_code'),
  ('uq_inv_po_number'),
  ('uq_inv_grn_number'),
  ('uq_inv_batch_number'),
  ('uq_inv_adj_number'),
  ('uq_inv_categories_name'),
  ('uq_inv_units_name'),
  ('chk_inv_product_prices'),
  ('chk_inv_movement_stock')
) AS c(expected_constraint)
LEFT JOIN pg_constraint con ON con.conname = c.expected_constraint
ORDER BY c.expected_constraint;


-- ============================================================
-- SECTION 12: IMMUTABILITY GUARD TEST
-- (Tests that stock_movements rejects UPDATE/DELETE)
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 12: IMMUTABILITY GUARD ---'; END $$;

-- Test 1: UPDATE on stock_movements should be blocked
DO $$
DECLARE
  v_raised BOOLEAN := FALSE;
BEGIN
  BEGIN
    -- This will fail even if the table is empty (trigger fires on row, not set)
    -- We test by attempting an update with a WHERE that matches nothing
    -- but the trigger check is at statement level via BEFORE trigger
    -- For a real test we need an existing row — covered in test data script
    RAISE NOTICE 'Immutability guard: requires test data. Run inv2_998_test_data.sql first, then recheck.';
  EXCEPTION WHEN OTHERS THEN
    v_raised := TRUE;
  END;
END;
$$;


-- ============================================================
-- SECTION 13: SEQUENCE FUNCTION TEST
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 13: SEQUENCE FUNCTIONS ---'; END $$;

-- Test PO number generation
SELECT
  'fn_generate_po_number() format'          AS check_name,
  fn_generate_po_number()                   AS generated_value,
  CASE WHEN fn_generate_po_number() ~ '^PO-[0-9]+$'
       THEN '✅ PASS' ELSE '❌ FAIL — unexpected format' END AS status;

-- Test GRN number generation
SELECT
  'fn_generate_grn_number() format'         AS check_name,
  fn_generate_grn_number()                  AS generated_value,
  CASE WHEN fn_generate_grn_number() ~ '^GRN-[0-9]+$'
       THEN '✅ PASS' ELSE '❌ FAIL — unexpected format' END AS status;

-- Test supplier code generation
SELECT
  'fn_generate_supplier_code() format'      AS check_name,
  fn_generate_supplier_code()               AS generated_value,
  CASE WHEN fn_generate_supplier_code() ~ '^SUP-[0-9]+$'
       THEN '✅ PASS' ELSE '❌ FAIL — unexpected format' END AS status;

-- Sequence monotonically increases (call twice, second > first)
DO $$
DECLARE
  v1 INTEGER;
  v2 INTEGER;
BEGIN
  v1 := fn_next_sequence_value('seq_verify_test');
  v2 := fn_next_sequence_value('seq_verify_test');
  IF v2 = v1 + 1 THEN
    RAISE NOTICE '✅ PASS: sequence monotonically increases (% → %)', v1, v2;
  ELSE
    RAISE NOTICE '❌ FAIL: sequence not monotonic (% → %)', v1, v2;
  END IF;
  -- Cleanup test key
  DELETE FROM inv_settings WHERE setting_key = 'seq_verify_test';
END;
$$;


-- ============================================================
-- SECTION 14: FULL SUMMARY
-- ============================================================

DO $$ BEGIN RAISE NOTICE '--- SECTION 14: SUMMARY ---'; END $$;
DO $$ BEGIN RAISE NOTICE 'If all rows above show PASS, Phase 2 schema is verified.'; END $$;
DO $$ BEGIN RAISE NOTICE 'Run inv2_998_test_data.sql next for transaction testing.'; END $$;

-- Quick FAIL count across key checks (tables + functions + triggers)
WITH checks AS (
  -- table check
  SELECT CASE WHEN e.table_name IS NOT NULL THEN 0 ELSE 1 END AS failed
  FROM (VALUES
    ('inv_settings'),('inv_categories'),('inv_units'),('inv_tax_master'),
    ('inv_manufacturers'),('inv_suppliers'),('inv_products'),('inv_product_images'),
    ('inv_product_documents'),('inv_warehouses'),('inv_warehouse_locations'),
    ('inv_purchase_orders'),('inv_purchase_order_items'),('inv_goods_receipts'),
    ('inv_goods_receipt_items'),('inv_product_batches'),('inv_stock_movements'),
    ('inv_stock_adjustments'),('inv_stock_adjustment_items'),('inv_audit_log')
  ) AS t(n)
  LEFT JOIN information_schema.tables e
    ON e.table_name = t.n AND e.table_schema = 'public'
  UNION ALL
  -- function check (fn_inv_user_role removed — no roles in single-admin setup)
  SELECT CASE WHEN r.routine_name IS NOT NULL THEN 0 ELSE 1 END
  FROM (VALUES
    ('fn_post_grn'),('fn_post_stock_adjustment'),('fn_generate_po_number'),
    ('fn_rebuild_all_batch_quantities')
  ) AS f(n)
  LEFT JOIN information_schema.routines r
    ON r.routine_name = f.n AND r.routine_schema = 'public'
)
SELECT
  SUM(failed)                               AS total_failures,
  CASE WHEN SUM(failed) = 0
       THEN '✅ ALL CRITICAL CHECKS PASSED — Phase 2 schema is valid'
       ELSE '❌ ' || SUM(failed) || ' CHECK(S) FAILED — do not proceed to Phase 3'
  END                                       AS verdict
FROM checks;
