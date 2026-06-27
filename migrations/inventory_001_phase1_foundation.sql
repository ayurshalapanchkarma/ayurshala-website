-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_001_phase1_foundation.sql
-- Phase 1: Master Data — Categories, Products, Suppliers
-- ============================================================

BEGIN;

-- ============================================================
-- HELPER: Role check function
-- ============================================================
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TABLE: inventory_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  icon          TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  is_deleted    BOOLEAN DEFAULT FALSE,
  clinic_id     UUID,                          -- future multi-clinic
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_categories_slug ON inventory_categories(slug);
CREATE INDEX IF NOT EXISTS idx_inv_categories_active ON inventory_categories(is_active, is_deleted);

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_cat_select" ON inventory_categories;
DROP POLICY IF EXISTS "inv_cat_insert" ON inventory_categories;
DROP POLICY IF EXISTS "inv_cat_update" ON inventory_categories;
DROP POLICY IF EXISTS "inv_cat_delete" ON inventory_categories;

CREATE POLICY "inv_cat_select" ON inventory_categories
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "inv_cat_insert" ON inventory_categories
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "inv_cat_update" ON inventory_categories
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "inv_cat_delete" ON inventory_categories
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

-- Seed categories
INSERT INTO inventory_categories (name, slug, icon, sort_order) VALUES
  ('Medicines',    'medicines',    '💊', 1),
  ('Oils',         'oils',         '🫙', 2),
  ('Churna',       'churna',       '🌿', 3),
  ('Tablets',      'tablets',      '💊', 4),
  ('Capsules',     'capsules',     '💉', 5),
  ('Consumables',  'consumables',  '🧴', 6),
  ('Equipment',    'equipment',    '🔧', 7),
  ('Herbs',        'herbs',        '🌱', 8),
  ('Packaging',    'packaging',    '📦', 9),
  ('Other',        'other',        '📁', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TABLE: inventory_products
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku               TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  category_id       UUID REFERENCES inventory_categories(id),
  unit              TEXT NOT NULL DEFAULT 'nos',  -- ml, gm, nos, litre, pack, kg, etc.
  purchase_price    NUMERIC(10,2) DEFAULT 0,
  sale_price        NUMERIC(10,2) DEFAULT 0,
  mrp               NUMERIC(10,2) DEFAULT 0,
  gst_percent       NUMERIC(5,2) DEFAULT 0,
  hsn_code          TEXT,
  reorder_level     INTEGER DEFAULT 0,
  reorder_quantity  INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED')),
  notes             TEXT,
  clinic_id         UUID,
  is_deleted        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_products_sku       ON inventory_products(sku);
CREATE INDEX IF NOT EXISTS idx_inv_products_category  ON inventory_products(category_id);
CREATE INDEX IF NOT EXISTS idx_inv_products_status    ON inventory_products(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_inv_products_name      ON inventory_products USING gin(to_tsvector('english', name));

ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_prod_select" ON inventory_products;
DROP POLICY IF EXISTS "inv_prod_insert" ON inventory_products;
DROP POLICY IF EXISTS "inv_prod_update" ON inventory_products;
DROP POLICY IF EXISTS "inv_prod_delete" ON inventory_products;

CREATE POLICY "inv_prod_select" ON inventory_products
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "inv_prod_insert" ON inventory_products
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "inv_prod_update" ON inventory_products
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "inv_prod_delete" ON inventory_products
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

-- ============================================================
-- TABLE: suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name    TEXT NOT NULL,
  contact_person   TEXT,
  mobile           TEXT,
  email            TEXT,
  gstin            TEXT,
  address          TEXT,
  city             TEXT,
  state            TEXT,
  pincode          TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  notes            TEXT,
  clinic_id        UUID,
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name   ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active, is_deleted);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;

CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth_user_role() = 'ADMIN'
  );

-- ============================================================
-- TABLE: product_suppliers (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_suppliers (
  product_id    UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  supplier_id   UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  is_preferred  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_product_suppliers_product  ON product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON product_suppliers(supplier_id);

ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prod_sup_select" ON product_suppliers;
DROP POLICY IF EXISTS "prod_sup_insert" ON product_suppliers;
DROP POLICY IF EXISTS "prod_sup_delete" ON product_suppliers;

CREATE POLICY "prod_sup_select" ON product_suppliers
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "prod_sup_insert" ON product_suppliers
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

CREATE POLICY "prod_sup_delete" ON product_suppliers
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inv_categories_updated_at ON inventory_categories;
CREATE TRIGGER trg_inv_categories_updated_at
  BEFORE UPDATE ON inventory_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_inv_products_updated_at ON inventory_products;
CREATE TRIGGER trg_inv_products_updated_at
  BEFORE UPDATE ON inventory_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
