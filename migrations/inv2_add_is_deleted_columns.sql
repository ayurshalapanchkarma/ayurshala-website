-- ============================================================
-- MIGRATION: Add is_deleted column to all inventory tables
-- This column was missing from the schema but the services
-- expect it for soft-delete functionality.
-- ============================================================

BEGIN;

-- Add is_deleted to inv_categories if not exists
ALTER TABLE inv_categories 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_deleted to inv_units if not exists
ALTER TABLE inv_units 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_deleted to inv_manufacturers if not exists
ALTER TABLE inv_manufacturers 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_deleted to inv_suppliers if not exists
ALTER TABLE inv_suppliers 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_deleted to inv_tax_master if not exists
ALTER TABLE inv_tax_master 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
