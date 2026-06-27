-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_010_phase11_security.sql
-- Phase 11: Roles, RBAC, Soft Deletes
-- ============================================================

BEGIN;

-- ============================================================
-- Add PHARMACIST role to profiles
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ADMIN', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST'));

-- ============================================================
-- FUNCTION: soft_delete_inventory_product
-- Prevents deletion if active batches with stock exist
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_inventory_product(p_id UUID)
RETURNS VOID AS $$
DECLARE
  v_active_stock INTEGER;
BEGIN
  SELECT COALESCE(SUM(remaining_quantity), 0) INTO v_active_stock
  FROM inventory_batches
  WHERE product_id = p_id AND status = 'ACTIVE';

  IF v_active_stock > 0 THEN
    RAISE EXCEPTION 'Cannot delete product: % units still in active batches. Reduce stock first.', v_active_stock;
  END IF;

  UPDATE inventory_products
  SET is_deleted = TRUE, status = 'INACTIVE', updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUTURE-READY: Schema placeholders for Phase 12
-- These columns are added now so schema is extensible
-- ============================================================

-- Multi-clinic: clinic_id already on all tables (nullable)
-- Barcode/QR: add barcode column to products
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Prescription dispensing: link sales to prescription
ALTER TABLE sales ADD COLUMN IF NOT EXISTS prescription_id UUID;

-- Purchase approval workflow: add approver to purchase orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Supplier performance: add rating to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 5);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;

-- Mobile inventory counting: add last_counted fields to products
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS last_counted_at TIMESTAMPTZ;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS last_counted_by UUID REFERENCES auth.users(id);

COMMIT;
