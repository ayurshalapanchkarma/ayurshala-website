-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 004d (FINAL)
-- File: inv2_004d_rls_policies.sql
-- ============================================================
--
-- RLS intentionally disabled for inventory tables.
--
-- Reason:
-- Inventory is only accessed through authenticated Next.js API
-- routes using the Supabase Service Role client (supabaseAdmin).
--
-- Admin access is enforced at the application layer via AdminGuard
-- and the admins table (components/AdminGuard.tsx).
--
-- The Service Role key bypasses RLS unconditionally, so enabling
-- RLS here adds zero security benefit and only creates maintenance
-- overhead and migration failure risk.
--
-- If multi-user inventory access is introduced in the future
-- (pharmacist, store manager, etc.), RLS should be reintroduced
-- with a dedicated migration that adds a role column and policies.
--
-- Run after 004c.
-- ============================================================

BEGIN;

-- Drop any policies left over from previous migration attempts
-- (idempotent — safe to run even if no policies exist)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename LIKE 'inv_%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END;
$$;

-- Disable RLS on every inventory table
ALTER TABLE inv_settings                DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_categories              DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_units                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_tax_master              DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_manufacturers           DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_suppliers               DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_products                DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_product_images          DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_product_documents       DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_warehouses              DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_warehouse_locations     DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_purchase_orders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_purchase_order_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_goods_receipts          DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_goods_receipt_items     DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_product_batches         DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_stock_movements         DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_stock_adjustments       DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_stock_adjustment_items  DISABLE ROW LEVEL SECURITY;
ALTER TABLE inv_audit_log               DISABLE ROW LEVEL SECURITY;

COMMIT;
