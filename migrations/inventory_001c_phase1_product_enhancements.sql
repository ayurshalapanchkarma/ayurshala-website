-- ============================================================
-- PHASE 1 HARDENING: Product Status Enum & Images
-- Migration: inventory_001c_phase1_product_enhancements.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ENUM: Product Status
-- ============================================================
CREATE TYPE product_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'DISCONTINUED',
  'OUT_OF_STOCK',
  'RECALLED'
);

-- ============================================================
-- TABLE: product_images
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  image_type            TEXT NOT NULL CHECK (image_type IN ('PRIMARY', 'GALLERY', 'LABEL', 'MANUFACTURER')),
  image_url             TEXT NOT NULL,
  alt_text              TEXT,
  sort_order            INTEGER DEFAULT 0,
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_type ON product_images(image_type);
CREATE INDEX IF NOT EXISTS idx_product_images_active ON product_images(is_deleted);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select" ON product_images
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "product_images_insert" ON product_images
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "product_images_update" ON product_images
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "product_images_delete" ON product_images
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

DROP TRIGGER IF EXISTS trg_product_images_updated_at ON product_images;
CREATE TRIGGER trg_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_audit_product_images ON product_images;
CREATE TRIGGER trg_audit_product_images
  AFTER INSERT OR UPDATE OR DELETE ON product_images
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

-- ============================================================
-- ALTER: inventory_products — Add manufacturer_id
-- ============================================================
ALTER TABLE inventory_products
  ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES manufacturers(id);

ALTER TABLE inventory_products
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES inventory_units(id);

CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON inventory_products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_unit ON inventory_products(unit_id);

COMMIT;
