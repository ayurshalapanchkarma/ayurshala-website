-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 005: SEED MASTER DATA
-- Pre-populates all lookup tables.
-- No hardcoded values in the application — everything comes
-- from the database via API.
-- Run after 004d_rls_policies.sql
-- ============================================================

BEGIN;

-- ============================================================
-- SEED: inv_settings
-- All configurable values for the inventory system.
-- ============================================================

INSERT INTO inv_settings (setting_key, setting_value, setting_type, description) VALUES

  -- Clinic identity
  ('clinic_name',              'Ayurshala Panchakarma',  'text',    'Clinic name shown on POs and GRNs'),
  ('clinic_address',           '',                        'text',    'Clinic address for printed documents'),
  ('clinic_gst_number',        '',                        'text',    'Clinic GST registration number'),
  ('clinic_phone',             '',                        'text',    'Clinic phone for PO/GRN documents'),

  -- Feature flags
  ('gst_enabled',              'true',   'boolean', 'Enable GST calculations on purchase orders'),
  ('batch_tracking_default',   'true',   'boolean', 'Default batch_tracking setting for new products'),
  ('expiry_tracking_default',  'true',   'boolean', 'Default expiry_tracking setting for new products'),

  -- Currency
  ('currency_symbol',          '₹',      'text',    'Currency symbol shown in UI and reports'),
  ('currency_code',            'INR',    'text',    'ISO 4217 currency code'),

  -- Document prefixes (all configurable)
  ('po_prefix',                'PO-',    'text',    'Purchase order number prefix'),
  ('po_pad_width',             '6',      'number',  'Zero-padding width for PO numbers'),
  ('grn_prefix',               'GRN-',   'text',    'Goods receipt note number prefix'),
  ('grn_pad_width',            '6',      'number',  'Zero-padding width for GRN numbers'),
  ('supplier_prefix',          'SUP-',   'text',    'Supplier code prefix'),
  ('supplier_pad_width',       '6',      'number',  'Zero-padding width for supplier codes'),
  ('adjustment_prefix',        'ADJ-',   'text',    'Stock adjustment number prefix'),
  ('adjustment_pad_width',     '6',      'number',  'Zero-padding width for adjustment numbers'),

  -- Sequence counters (start at 0; fn_next_sequence_value increments before returning)
  ('seq_po_last_number',         '0', 'number', 'Last PO sequence number'),
  ('seq_grn_last_number',        '0', 'number', 'Last GRN sequence number'),
  ('seq_supplier_last_number',   '0', 'number', 'Last supplier code sequence number'),
  ('seq_adjustment_last_number', '0', 'number', 'Last stock adjustment sequence number'),

  -- Stock alert thresholds
  ('low_stock_alert_days',    '7',   'number', 'Days of stock remaining to trigger low-stock alert'),
  ('expiry_alert_days',       '30',  'number', 'Days to expiry to show in near-expiry alerts'),
  ('dead_stock_days',         '180', 'number', 'Days without movement to flag as dead stock'),

  -- Barcode
  ('barcode_format',           'CODE128', 'text', 'Default barcode format: CODE128 / EAN13 / QR'),

  -- Default tax
  ('default_gst_percentage',   '12',  'number', 'Default GST percentage for new products'),

  -- Partial receipt tolerance
  ('po_over_receipt_tolerance', '5', 'number', 'Allowed over-receipt % on PO items (default 5%)')

ON CONFLICT (setting_key) DO NOTHING;


-- ============================================================
-- SEED: inv_units
-- Complete list of units used in Ayurvedic pharmacy.
-- ============================================================

INSERT INTO inv_units (name, short_name, decimal_allowed) VALUES
  ('Bottle',        'Btl',    FALSE),
  ('Strip',         'Str',    FALSE),
  ('Tablet',        'Tab',    FALSE),
  ('Capsule',       'Cap',    FALSE),
  ('Box',           'Box',    FALSE),
  ('Piece',         'Pcs',    FALSE),
  ('Pack',          'Pk',     FALSE),
  ('Sachet',        'Sach',   FALSE),
  ('Vial',          'Vial',   FALSE),
  ('Ampoule',       'Amp',    FALSE),
  ('Kilogram',      'Kg',     TRUE),
  ('Gram',          'Gm',     TRUE),
  ('Milligram',     'Mg',     TRUE),
  ('Litre',         'L',      TRUE),
  ('Millilitre',    'ml',     TRUE),
  ('Roll',          'Roll',   FALSE),
  ('Pair',          'Pair',   FALSE),
  ('Sheet',         'Sheet',  FALSE),
  ('Nos',           'Nos',    FALSE)
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- SEED: inv_categories
-- Ayurvedic clinic product categories.
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
-- SEED: inv_tax_master
-- Standard GST slabs applicable to Ayurvedic medicines.
-- ============================================================

INSERT INTO inv_tax_master (tax_name, tax_percentage, description) VALUES
  ('GST 0%',   0.00,  'Nil rated — essential Ayurvedic medicines'),
  ('GST 5%',   5.00,  '5% GST — most Ayurvedic formulations'),
  ('GST 12%',  12.00, '12% GST — medicines, consumables'),
  ('GST 18%',  18.00, '18% GST — general medical equipment, supplies'),
  ('GST 28%',  28.00, '28% GST — luxury items (rarely applicable)')
ON CONFLICT (tax_name) DO NOTHING;


-- ============================================================
-- SEED: inv_warehouses
-- Default single warehouse for a single-location clinic.
-- ============================================================

INSERT INTO inv_warehouses (warehouse_name, address, is_default) VALUES
  ('Main Store', 'Ayurshala Panchakarma Clinic', TRUE)
ON CONFLICT (warehouse_name) DO NOTHING;


-- ============================================================
-- SEED: inv_warehouse_locations
-- Standard pharmacy storage locations.
-- ============================================================

WITH wh AS (
  SELECT uuid FROM inv_warehouses WHERE warehouse_name = 'Main Store' LIMIT 1
)
INSERT INTO inv_warehouse_locations (warehouse_uuid, location_code, location_name)
SELECT wh.uuid, loc.code, loc.name FROM wh, (VALUES
  ('RACK-A',    'Rack A — Ayurvedic Medicines'),
  ('RACK-B',    'Rack B — Oils & Ghee'),
  ('RACK-C',    'Rack C — Panchakarma Medicines'),
  ('RACK-D',    'Rack D — Consumables'),
  ('RACK-E',    'Rack E — Equipment'),
  ('FRIDGE-1',  'Refrigerator 1 — Cold Storage'),
  ('DISPENSE',  'Dispensing Counter'),
  ('STORE-RM',  'Storage Room')
) AS loc(code, name)
ON CONFLICT (warehouse_uuid, location_code) DO NOTHING;

COMMIT;
