-- ============================================================
-- PRODUCTION SEED DATA FOR INVENTORY MODULE
-- Run this script to populate master data in production
-- Run AFTER inv2_001 through inv2_004d have been applied
-- ============================================================

BEGIN;

-- ============================================================
-- SEED inv_units (19 common units)
-- ============================================================

-- NOTE: Do NOT delete existing units if products reference them
-- Only INSERT new units that don't exist yet

INSERT INTO inv_units (uuid, name, short_name, decimal_allowed, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Bottle',        'Btl',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Strip',         'Str',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Tablet',        'Tab',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Capsule',       'Cap',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Box',           'Box',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Piece',         'Pcs',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Pack',          'Pk',     false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Sachet',        'Sach',   false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Vial',          'Vial',   false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Ampoule',       'Amp',    false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Kilogram',      'Kg',     true,  true, NOW(), NOW()),
  (gen_random_uuid(), 'Gram',          'Gm',     true,  true, NOW(), NOW()),
  (gen_random_uuid(), 'Milligram',     'Mg',     true,  true, NOW(), NOW()),
  (gen_random_uuid(), 'Litre',         'L',      true,  true, NOW(), NOW()),
  (gen_random_uuid(), 'Millilitre',    'ml',     true,  true, NOW(), NOW()),
  (gen_random_uuid(), 'Roll',          'Roll',   false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Pair',          'Pair',   false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Sheet',         'Sheet',  false, true, NOW(), NOW()),
  (gen_random_uuid(), 'Nos',           'Nos',    false, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED inv_categories (16 categories for Ayurvedic clinic)
-- ============================================================

-- NOTE: Only INSERT categories that don't exist
-- Preserve existing products linked to categories

INSERT INTO inv_categories (uuid, name, description, display_order, color, icon, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Panchakarma Medicines',   'Medicines used specifically in Panchakarma procedures',         1,  '#7C3AED', '🌿', true, NOW(), NOW()),
  (gen_random_uuid(), 'Ayurvedic Medicines',     'General Ayurvedic formulations and classical medicines',         2,  '#059669', '💊', true, NOW(), NOW()),
  (gen_random_uuid(), 'Oils',                    'Medicated oils: Abhyanga, Shirodhara, massage oils',             3,  '#D97706', '🫙', true, NOW(), NOW()),
  (gen_random_uuid(), 'Ghee & Fats',             'Medicated ghee and fats used in treatments',                    4,  '#B45309', '🧈', true, NOW(), NOW()),
  (gen_random_uuid(), 'Churna (Powders)',        'Ayurvedic medicinal powders',                                   5,  '#0891B2', '🌾', true, NOW(), NOW()),
  (gen_random_uuid(), 'Kashayam (Decoctions)',   'Herbal decoctions and liquid preparations',                     6,  '#0D9488', '🫗', true, NOW(), NOW()),
  (gen_random_uuid(), 'Arishtam & Asavam',       'Fermented herbal preparations',                                 7,  '#7C3AED', '🍶', true, NOW(), NOW()),
  (gen_random_uuid(), 'Tablets',                 'Tablet formulations',                                           8,  '#2563EB', '💊', true, NOW(), NOW()),
  (gen_random_uuid(), 'Capsules',                'Capsule formulations',                                          9,  '#9333EA', '💉', true, NOW(), NOW()),
  (gen_random_uuid(), 'External Applications',   'Creams, ointments, lepam for topical use',                     10, '#0EA5E9', '🧴', true, NOW(), NOW()),
  (gen_random_uuid(), 'Consumables',             'Single-use clinical consumables: gloves, cotton, bandages',    11, '#64748B', '🧻', true, NOW(), NOW()),
  (gen_random_uuid(), 'Clinic Supplies',         'General clinic supplies: syringes, tubes, containers',         12, '#475569', '📦', true, NOW(), NOW()),
  (gen_random_uuid(), 'Equipment',               'Medical and therapy equipment and instruments',                13, '#334155', '🔧', true, NOW(), NOW()),
  (gen_random_uuid(), 'Herbs & Raw Materials',   'Dried herbs, seeds, barks used in compounding',                14, '#65A30D', '🌱', true, NOW(), NOW()),
  (gen_random_uuid(), 'Packaging Materials',     'Bottles, jars, labels, pouches for dispensing',               15, '#78716C', '📦', true, NOW(), NOW()),
  (gen_random_uuid(), 'Other',                   'Miscellaneous items not fitting other categories',             16, '#94A3B8', '📁', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED inv_manufacturers (5 sample manufacturers)
-- ============================================================

-- NOTE: Only INSERT manufacturers that don't exist

INSERT INTO inv_manufacturers (uuid, manufacturer_name, contact_person, email, gst_number, city, state, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Himalaya Wellness',      'Rajesh Kumar',    'sales@himalaya.in',     '27AABCT1234H1Z0',   'Bangalore',  'Karnataka', true, NOW(), NOW()),
  (gen_random_uuid(), 'Baidyanath',            'Ashok Singh',     'info@baidyanath.co.in', '22AACCT1234H1Z0',   'Kolkata',    'West Bengal', true, NOW(), NOW()),
  (gen_random_uuid(), 'Dabur India',           'Priya Sharma',    'export@dabur.com',      '07AABCT1234H1Z0',   'Delhi',      'Delhi', true, NOW(), NOW()),
  (gen_random_uuid(), 'Arjun Naturals',        'Arjun Patel',     'contact@arjunayu.com',  '24AABCT1234H1Z0',   'Ahmedabad',  'Gujarat', true, NOW(), NOW()),
  (gen_random_uuid(), 'Local Compounding',     'Dr. Vaidya',      'local@ayurshala.in',    '27AABCT9999H1Z0',   'Bangalore',  'Karnataka', true, NOW(), NOW())
ON CONFLICT (manufacturer_name) DO NOTHING;

-- ============================================================
-- SEED inv_suppliers (5 sample suppliers)
-- ============================================================

-- NOTE: Only INSERT suppliers that don't exist

INSERT INTO inv_suppliers (uuid, supplier_code, company_name, contact_person, email, mobile, gst_number, city, state, opening_balance, credit_limit, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'SUP-000001', 'Himalaya Supply',      'Rajesh Kumar',   'sales@himalaya.in',      '+91-9876543210', '27AABCT1234H1Z0', 'Bangalore',  'Karnataka', 0, 500000, true, NOW(), NOW()),
  (gen_random_uuid(), 'SUP-000002', 'Baidyanath Distributor', 'Ashok Singh',   'info@baidyanath.co.in',  '+91-9876543211', '22AACCT1234H1Z0', 'Kolkata',    'West Bengal', 0, 300000, true, NOW(), NOW()),
  (gen_random_uuid(), 'SUP-000003', 'Dabur Stockist',       'Priya Sharma',   'export@dabur.com',       '+91-9876543212', '07AABCT1234H1Z0', 'Delhi',      'Delhi', 0, 400000, true, NOW(), NOW()),
  (gen_random_uuid(), 'SUP-000004', 'Herbal Pharma',        'Arjun Patel',    'contact@herbalpharma.in','+91-9876543213', '24AABCT1234H1Z0', 'Ahmedabad',  'Gujarat', 0, 250000, true, NOW(), NOW()),
  (gen_random_uuid(), 'SUP-000005', 'Wellness Distributors', 'Ajay Kumar',     'orders@wellness.in',     '+91-9876543214', '27AABCT5555H1Z0', 'Bangalore',  'Karnataka', 0, 350000, true, NOW(), NOW())
ON CONFLICT (company_name) DO NOTHING;

-- ============================================================
-- SEED inv_tax_master (5 GST slabs)
-- ============================================================

-- NOTE: Only INSERT tax rates that don't exist

INSERT INTO inv_tax_master (uuid, tax_name, tax_code, tax_rate, tax_type, description, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'GST 0%',   'GST0',  0.00,  'GST', 'Nil rated — essential Ayurvedic medicines', true, NOW(), NOW()),
  (gen_random_uuid(), 'GST 5%',   'GST5',  5.00,  'GST', '5% GST — most Ayurvedic formulations', true, NOW(), NOW()),
  (gen_random_uuid(), 'GST 12%',  'GST12', 12.00, 'GST', '12% GST — medicines, consumables', true, NOW(), NOW()),
  (gen_random_uuid(), 'GST 18%',  'GST18', 18.00, 'GST', '18% GST — general medical equipment, supplies', true, NOW(), NOW()),
  (gen_random_uuid(), 'GST 28%',  'GST28', 28.00, 'GST', '28% GST — luxury items (rarely applicable)', true, NOW(), NOW())
ON CONFLICT (tax_name) DO NOTHING;

-- ============================================================
-- SEED inv_warehouses (1 default warehouse)
-- ============================================================

-- NOTE: Only INSERT warehouse if it doesn't exist

INSERT INTO inv_warehouses (uuid, warehouse_code, warehouse_name, location, city, state, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'WH-000001', 'Main Store', 'Primary warehouse', 'Bangalore', 'Karnataka', true, NOW(), NOW())
ON CONFLICT (warehouse_name) DO NOTHING;

-- ============================================================
-- VERIFICATION COUNTS
-- ============================================================

SELECT 'Units' as table_name, COUNT(*) as row_count FROM inv_units
UNION ALL
SELECT 'Categories', COUNT(*) FROM inv_categories
UNION ALL
SELECT 'Manufacturers', COUNT(*) FROM inv_manufacturers
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM inv_suppliers
UNION ALL
SELECT 'Tax Masters', COUNT(*) FROM inv_tax_master
UNION ALL
SELECT 'Warehouses', COUNT(*) FROM inv_warehouses;

COMMIT;
