-- ============================================================
-- AYURSHALA INVENTORY v2 — PRODUCTION SEED DATA
-- Safely populates all master data lookup tables.
-- Safe to run multiple times - uses ON CONFLICT for duplicates.
-- ============================================================

BEGIN;

-- ============================================================
-- INSERT inv_units (19 common units)
-- ============================================================

INSERT INTO inv_units (name, short_name, decimal_allowed) VALUES
  ('Bottle',        'Btl',    false),
  ('Strip',         'Str',    false),
  ('Tablet',        'Tab',    false),
  ('Capsule',       'Cap',    false),
  ('Box',           'Box',    false),
  ('Piece',         'Pcs',    false),
  ('Pack',          'Pk',     false),
  ('Sachet',        'Sach',   false),
  ('Vial',          'Vial',   false),
  ('Ampoule',       'Amp',    false),
  ('Kilogram',      'Kg',     true),
  ('Gram',          'Gm',     true),
  ('Milligram',     'Mg',     true),
  ('Litre',         'L',      true),
  ('Millilitre',    'ml',     true),
  ('Roll',          'Roll',   false),
  ('Pair',          'Pair',   false),
  ('Sheet',         'Sheet',  false),
  ('Nos',           'Nos',    false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- INSERT inv_categories (16 categories)
-- ============================================================

INSERT INTO inv_categories (name, description, display_order, color, icon) VALUES
  ('Panchakarma Medicines',   'Medicines used specifically in Panchakarma procedures',         1,  '#7C3AED', '🌿'),
  ('Ayurvedic Medicines',     'General Ayurvedic formulations and classical medicines',         2,  '#059669', '💊'),
  ('Oils',                    'Medicated oils: Abhyanga, Shirodhara, massage oils',             3,  '#D97706', '🫙'),
  ('Ghee & Fats',             'Medicated ghee and fats used in treatments',                    4,  '#B45309', '🧈'),
  ('Churna (Powders)',        'Ayurvedic medicinal powders',                                   5,  '#0891B2', '🌾'),
  ('Kashayam (Decoctions)',   'Herbal decoctions and liquid preparations',                     6,  '#0D9488', '🫗'),
  ('Arishtam & Asavam',       'Fermented herbal preparations',                                 7,  '#7C3AED', '🍶'),
  ('Tablets',                 'Tablet formulations',                                           8,  '#2563EB', '💊'),
  ('Capsules',                'Capsule formulations',                                          9,  '#9333EA', '💉'),
  ('External Applications',   'Creams, ointments, lepam for topical use',                     10, '#0EA5E9', '🧴'),
  ('Consumables',             'Single-use clinical consumables: gloves, cotton, bandages',    11, '#64748B', '🧻'),
  ('Clinic Supplies',         'General clinic supplies: syringes, tubes, containers',         12, '#475569', '📦'),
  ('Equipment',               'Medical and therapy equipment and instruments',                13, '#334155', '🔧'),
  ('Herbs & Raw Materials',   'Dried herbs, seeds, barks used in compounding',                14, '#65A30D', '🌱'),
  ('Packaging Materials',     'Bottles, jars, labels, pouches for dispensing',               15, '#78716C', '📦'),
  ('Other',                   'Miscellaneous items not fitting other categories',             16, '#94A3B8', '📁')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- INSERT inv_manufacturers (5 sample manufacturers)
-- ============================================================

INSERT INTO inv_manufacturers (manufacturer_name, contact_person, email, gst_number, city, state) VALUES
  ('Himalaya Wellness',      'Rajesh Kumar',    'sales@himalaya.in',     '27AABCT1234H1Z0',   'Bangalore',  'Karnataka'),
  ('Baidyanath',            'Ashok Singh',     'info@baidyanath.co.in', '22AACCT1234H1Z0',   'Kolkata',    'West Bengal'),
  ('Dabur India',           'Priya Sharma',    'export@dabur.com',      '07AABCT1234H1Z0',   'Delhi',      'Delhi'),
  ('Arjun Naturals',        'Arjun Patel',     'contact@arjunayu.com',  '24AABCT1234H1Z0',   'Ahmedabad',  'Gujarat'),
  ('Local Compounding',     'Dr. Vaidya',      'local@ayurshala.in',    '27AABCT9999H1Z0',   'Bangalore',  'Karnataka')
ON CONFLICT (manufacturer_name) DO NOTHING;

-- ============================================================
-- INSERT inv_suppliers (5 sample suppliers)
-- ============================================================

INSERT INTO inv_suppliers (supplier_code, company_name, contact_person, email, mobile, gst_number, city, state) VALUES
  ('SUP-000001', 'Himalaya Supply',      'Rajesh Kumar',   'sales@himalaya.in',      '+91-9876543210', '27AABCT1234H1Z0', 'Bangalore',  'Karnataka'),
  ('SUP-000002', 'Baidyanath Distributor', 'Ashok Singh',   'info@baidyanath.co.in',  '+91-9876543211', '22AACCT1234H1Z0', 'Kolkata',    'West Bengal'),
  ('SUP-000003', 'Dabur Stockist',       'Priya Sharma',   'export@dabur.com',       '+91-9876543212', '07AABCT1234H1Z0', 'Delhi',      'Delhi'),
  ('SUP-000004', 'Herbal Pharma',        'Arjun Patel',    'contact@herbalpharma.in','+91-9876543213', '24AABCT1234H1Z0', 'Ahmedabad',  'Gujarat'),
  ('SUP-000005', 'Wellness Distributors', 'Ajay Kumar',     'orders@wellness.in',     '+91-9876543214', '27AABCT5555H1Z0', 'Bangalore',  'Karnataka')
ON CONFLICT (supplier_code) DO NOTHING;

-- ============================================================
-- INSERT inv_tax_master (5 GST slabs)
-- NOTE: Column is tax_percentage, NOT tax_rate
-- ============================================================

INSERT INTO inv_tax_master (tax_name, tax_percentage, description) VALUES
  ('GST 0%',   0.00,  'Nil rated — essential Ayurvedic medicines'),
  ('GST 5%',   5.00,  '5% GST — most Ayurvedic formulations'),
  ('GST 12%',  12.00, '12% GST — medicines, consumables'),
  ('GST 18%',  18.00, '18% GST — general medical equipment, supplies'),
  ('GST 28%',  28.00, '28% GST — luxury items (rarely applicable)')
ON CONFLICT (tax_name) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================

SELECT 'Units' as table_name, COUNT(*) as row_count FROM inv_units
UNION ALL
SELECT 'Categories', COUNT(*) FROM inv_categories
UNION ALL
SELECT 'Manufacturers', COUNT(*) FROM inv_manufacturers
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM inv_suppliers
UNION ALL
SELECT 'Tax Masters', COUNT(*) FROM inv_tax_master;

COMMIT;
