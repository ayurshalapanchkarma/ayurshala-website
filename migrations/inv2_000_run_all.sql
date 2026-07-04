-- ============================================================
-- AYURSHALA INVENTORY v2 — MASTER RUN SCRIPT
-- Run this in Supabase SQL Editor (or psql) to apply the
-- complete inventory schema from scratch.
--
-- Order is mandatory. Each file depends on the previous.
--
-- File                              Purpose
-- ─────────────────────────────     ────────────────────────────────────
-- inv2_001_schema.sql               Drop old tables. Create all 19 tables.
-- inv2_002_indexes.sql              All indexes for performance.
-- inv2_003_triggers.sql             updated_at, immutability guards,
--                                   batch quantity cache, PO status auto-update.
-- inv2_004a_functions_utility.sql   Sequence generators, stock calculation,
--                                   batch quantity rebuild.
-- inv2_004b_functions_grn_adj.sql   fn_post_grn (transactional GRN posting),
--                                   fn_post_stock_adjustment.
-- inv2_004c_functions_views.sql     RLS helper fn_inv_user_role,
--                                   dashboard and report views.
-- inv2_004d_rls_policies.sql        Row-Level Security for all tables.
-- inv2_005_seed_master_data.sql     Categories, units, tax slabs, settings,
--                                   warehouse, locations.
-- ============================================================

-- INSTRUCTIONS:
-- 1. Open Supabase → SQL Editor
-- 2. Paste each file in sequence and run
-- 3. Verify each file completes without errors before running the next
-- 4. After inv2_005, verify with the queries at the bottom of this file

-- ============================================================
-- VERIFICATION QUERIES
-- Run after all migrations complete
-- ============================================================

-- 1. Confirm all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'inv_%'
ORDER BY table_name;
-- Expected: 19 tables

-- 2. Confirm categories seeded
SELECT uuid, name, display_order, color FROM inv_categories ORDER BY display_order;
-- Expected: 16 rows

-- 3. Confirm units seeded
SELECT uuid, name, short_name, decimal_allowed FROM inv_units ORDER BY name;
-- Expected: 19 rows

-- 4. Confirm settings seeded
SELECT setting_key, setting_value FROM inv_settings ORDER BY setting_key;
-- Expected: ~26 rows

-- 5. Confirm tax master seeded
SELECT tax_name, tax_percentage FROM inv_tax_master ORDER BY tax_percentage;
-- Expected: 5 rows

-- 6. Confirm warehouse seeded
SELECT warehouse_name, is_default FROM inv_warehouses;
-- Expected: 1 row, is_default = true

-- 7. Confirm warehouse locations seeded
SELECT location_code, location_name FROM inv_warehouse_locations ORDER BY location_code;
-- Expected: 8 rows

-- 8. Test sequence generation (should return 'PO-000001')
SELECT fn_generate_po_number();

-- 9. Test GRN sequence (should return 'GRN-000001')
SELECT fn_generate_grn_number();

-- 10. Confirm immutability guard on stock_movements
-- This should raise an exception:
-- INSERT INTO inv_stock_movements (...) VALUES (...);
-- Then try: UPDATE inv_stock_movements SET remarks = 'test' WHERE uuid = '<any>';
-- Expected: ERROR: inv_stock_movements is an immutable ledger...

-- 11. Confirm RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'inv_%'
ORDER BY tablename;
-- Expected: rowsecurity = true for all inv_ tables

-- 12. Test dashboard view (no data yet — should return zeros)
SELECT * FROM v_dashboard_summary;

-- 13. Test current stock view (no products yet — should be empty)
SELECT * FROM v_current_stock LIMIT 5;
