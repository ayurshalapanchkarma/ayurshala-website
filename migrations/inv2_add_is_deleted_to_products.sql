-- ============================================================
-- MIGRATION: Add is_deleted column to inv_products
-- The ProductService expects this column for soft deletes
-- ============================================================

BEGIN;

ALTER TABLE inv_products 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
