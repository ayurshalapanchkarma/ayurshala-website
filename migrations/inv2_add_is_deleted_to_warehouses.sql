-- ============================================================
-- MIGRATION: Add is_deleted column to inv_warehouses
-- ============================================================

BEGIN;

ALTER TABLE inv_warehouses 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
