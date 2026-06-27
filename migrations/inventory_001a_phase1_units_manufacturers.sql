-- ============================================================
-- PHASE 1 HARDENING: Units Master & Manufacturers
-- Migration: inventory_001a_phase1_units_manufacturers.sql
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: inventory_units
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_units (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  symbol                TEXT NOT NULL UNIQUE,
  base_unit             TEXT,
  conversion_factor     DECIMAL(10,4) DEFAULT 1,
  status                TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_units_name ON inventory_units(name);
CREATE INDEX IF NOT EXISTS idx_inv_units_symbol ON inventory_units(symbol);

ALTER TABLE inventory_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_select" ON inventory_units
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "units_admin" ON inventory_units
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() = 'ADMIN');

CREATE POLICY "units_admin_update" ON inventory_units
  FOR UPDATE USING (auth.role() = 'service_role' OR auth_user_role() = 'ADMIN');

CREATE POLICY "units_admin_delete" ON inventory_units
  FOR DELETE USING (auth.role() = 'service_role' OR auth_user_role() = 'ADMIN');

-- Seed units
INSERT INTO inventory_units (name, symbol, base_unit, conversion_factor) VALUES
  ('Millilitre', 'ml', 'litre', 0.001),
  ('Litre', 'L', 'litre', 1),
  ('Gram', 'g', 'kilogram', 0.001),
  ('Kilogram', 'kg', 'kilogram', 1),
  ('Bottle', 'bottle', NULL, 1),
  ('Packet', 'pkt', NULL, 1),
  ('Piece', 'pc', NULL, 1),
  ('Strip', 'strip', NULL, 1),
  ('Box', 'box', NULL, 1),
  ('Tube', 'tube', NULL, 1),
  ('Jar', 'jar', NULL, 1)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABLE: manufacturers
-- ============================================================
CREATE TABLE IF NOT EXISTS manufacturers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  gstin                 TEXT UNIQUE,
  contact_person        TEXT,
  email                 TEXT,
  phone                 TEXT,
  website               TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  pincode               TEXT,
  status                TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED')),
  is_deleted            BOOLEAN DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON manufacturers(name);
CREATE INDEX IF NOT EXISTS idx_manufacturers_gstin ON manufacturers(gstin);
CREATE INDEX IF NOT EXISTS idx_manufacturers_active ON manufacturers(status, is_deleted);

ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manufacturers_select" ON manufacturers
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "manufacturers_admin" ON manufacturers
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

CREATE POLICY "manufacturers_admin_update" ON manufacturers
  FOR UPDATE USING (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

CREATE POLICY "manufacturers_admin_delete" ON manufacturers
  FOR DELETE USING (auth.role() = 'service_role' OR auth_user_role() = 'ADMIN');

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
DROP TRIGGER IF EXISTS trg_inv_units_updated_at ON inventory_units;
CREATE TRIGGER trg_inv_units_updated_at
  BEFORE UPDATE ON inventory_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_manufacturers_updated_at ON manufacturers;
CREATE TRIGGER trg_manufacturers_updated_at
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
