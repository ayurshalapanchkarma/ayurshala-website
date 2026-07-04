-- ============================================================
-- AYURSHALA INVENTORY v2 — TEST DATA
-- File: inv2_998_test_data.sql
--
-- Inserts realistic Ayurvedic clinic test data for development.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
--
-- ⚠️  DO NOT run on production.
-- ⚠️  Run AFTER all inv2_00X migrations AND inv2_999_verify passes.
--
-- After this script:
-- - Run the smoke tests in the Execution Guide
-- - Run the transaction test (GRN post)
-- - Run the rollback test
-- - Run EXPLAIN ANALYZE queries
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION A: MANUFACTURERS
-- ============================================================

INSERT INTO inv_manufacturers (
  uuid, manufacturer_name, contact_person, mobile, email,
  gst_number, city, state, website, is_active
) VALUES
  (
    '11111111-0001-0001-0001-000000000001',
    'Kottakkal Arya Vaidya Sala',
    'Sales Team', '04833-274221',
    'sales@aryavaidyasala.com',
    '32AABCA1234B1Z5',
    'Kottakkal', 'Kerala',
    'https://www.aryavaidyasala.com', TRUE
  ),
  (
    '11111111-0001-0001-0001-000000000002',
    'Dabur India Ltd',
    'Distributor Desk', '1800-103-1644',
    'consumer@dabur.com',
    '05AABCD1234C1Z4',
    'Ghaziabad', 'Uttar Pradesh',
    'https://www.dabur.com', TRUE
  ),
  (
    '11111111-0001-0001-0001-000000000003',
    'Himalaya Drug Company',
    'Trade Relations', '080-23095494',
    'medical@himalayawellness.com',
    '29AABCH1234D1Z3',
    'Bengaluru', 'Karnataka',
    'https://www.himalayawellness.com', TRUE
  ),
  (
    '11111111-0001-0001-0001-000000000004',
    'Baidyanath Ayurved Bhawan',
    'Trade Desk', '0612-2264736',
    'info@baidyanath.com',
    '10AABCB1234E1Z2',
    'Patna', 'Bihar',
    'https://www.baidyanath.com', TRUE
  )
ON CONFLICT (manufacturer_name) DO NOTHING;


-- ============================================================
-- SECTION B: SUPPLIERS
-- ============================================================

INSERT INTO inv_suppliers (
  uuid, supplier_code, company_name, contact_person,
  mobile, email, gst_number, pan,
  address, city, state, pincode,
  payment_terms, credit_days,
  bank_name, account_number, ifsc,
  opening_balance, credit_limit, is_active
) VALUES
  (
    '22222222-0002-0002-0002-000000000001',
    'SUP-000001',
    'Kerala Ayurvedic Distributors',
    'Rajan Nair',
    '9876543210', 'orders@keralaayu.in',
    '32AABCK1234F1Z1', 'KERAK1234F',
    '45 MG Road', 'Kochi', 'Kerala', '682011',
    'Net 30', 30,
    'State Bank of India', '10012345678', 'SBIN0001234',
    0, 200000, TRUE
  ),
  (
    '22222222-0002-0002-0002-000000000002',
    'SUP-000002',
    'National Pharma Wholesalers',
    'Suresh Mehta',
    '9765432109', 'supply@npwholesale.com',
    '27AABCN1234G1Z0', 'NATPH1234G',
    '12 Industrial Estate', 'Mumbai', 'Maharashtra', '400093',
    'Net 45', 45,
    'HDFC Bank', '50100123456789', 'HDFC0001234',
    5000, 500000, TRUE
  ),
  (
    '22222222-0002-0002-0002-000000000003',
    'SUP-000003',
    'South India Medical Supplies',
    'Priya Krishnan',
    '9654321098', 'priya@simeds.in',
    '33AABCS1234H1Z9', 'SOUIN1234H',
    '88 Anna Salai', 'Chennai', 'Tamil Nadu', '600002',
    'Net 15', 15,
    'Axis Bank', '917010012345678', 'UTIB0001234',
    0, 100000, TRUE
  )
ON CONFLICT (supplier_code) DO NOTHING;

-- Update the sequence counter to avoid conflicts with auto-generated codes
UPDATE inv_settings
SET setting_value = '3'
WHERE setting_key = 'seq_supplier_last_number';


-- ============================================================
-- SECTION C: PRODUCTS
-- (Requires categories and units already seeded by inv2_005)
-- ============================================================

-- Get category and unit UUIDs dynamically for portability
DO $$
DECLARE
  v_cat_panchakarma  UUID;
  v_cat_oils         UUID;
  v_cat_churna       UUID;
  v_cat_tablets      UUID;
  v_cat_consumables  UUID;
  v_unit_bottle      UUID;
  v_unit_ml          UUID;
  v_unit_gm          UUID;
  v_unit_kg          UUID;
  v_unit_nos         UUID;
  v_unit_strip       UUID;
  v_unit_pack        UUID;
  v_mfr_kottakkal    UUID;
  v_mfr_himalaya     UUID;
  v_mfr_dabur        UUID;
  v_sup_kerala       UUID;
  v_sup_national     UUID;
BEGIN

  SELECT uuid INTO v_cat_panchakarma FROM inv_categories WHERE name = 'Panchakarma Medicines' LIMIT 1;
  SELECT uuid INTO v_cat_oils        FROM inv_categories WHERE name = 'Oils'                  LIMIT 1;
  SELECT uuid INTO v_cat_churna      FROM inv_categories WHERE name = 'Churna (Powders)'      LIMIT 1;
  SELECT uuid INTO v_cat_tablets     FROM inv_categories WHERE name = 'Tablets'               LIMIT 1;
  SELECT uuid INTO v_cat_consumables FROM inv_categories WHERE name = 'Consumables'           LIMIT 1;

  SELECT uuid INTO v_unit_bottle FROM inv_units WHERE short_name = 'Btl'  LIMIT 1;
  SELECT uuid INTO v_unit_ml     FROM inv_units WHERE short_name = 'ml'   LIMIT 1;
  SELECT uuid INTO v_unit_gm     FROM inv_units WHERE short_name = 'Gm'   LIMIT 1;
  SELECT uuid INTO v_unit_kg     FROM inv_units WHERE short_name = 'Kg'   LIMIT 1;
  SELECT uuid INTO v_unit_nos    FROM inv_units WHERE short_name = 'Nos'  LIMIT 1;
  SELECT uuid INTO v_unit_strip  FROM inv_units WHERE short_name = 'Str'  LIMIT 1;
  SELECT uuid INTO v_unit_pack   FROM inv_units WHERE short_name = 'Pk'   LIMIT 1;

  SELECT uuid INTO v_mfr_kottakkal FROM inv_manufacturers WHERE manufacturer_name = 'Kottakkal Arya Vaidya Sala' LIMIT 1;
  SELECT uuid INTO v_mfr_himalaya  FROM inv_manufacturers WHERE manufacturer_name = 'Himalaya Drug Company'       LIMIT 1;
  SELECT uuid INTO v_mfr_dabur     FROM inv_manufacturers WHERE manufacturer_name = 'Dabur India Ltd'             LIMIT 1;

  SELECT uuid INTO v_sup_kerala   FROM inv_suppliers WHERE supplier_code = 'SUP-000001' LIMIT 1;
  SELECT uuid INTO v_sup_national FROM inv_suppliers WHERE supplier_code = 'SUP-000002' LIMIT 1;

  INSERT INTO inv_products (
    uuid, product_code, sku, barcode,
    product_name, generic_name,
    category_uuid, manufacturer_uuid, unit_uuid, default_supplier_uuid,
    purchase_price, selling_price, mrp, gst_percentage, hsn_code,
    minimum_stock, reorder_level, maximum_stock,
    minimum_order_qty, lead_time_days,
    storage_location, rack_number, shelf_number,
    batch_tracking, expiry_tracking, is_prescription,
    description, is_active
  ) VALUES
    -- Product 1: Dhanwantharam Tailam
    (
      '33333333-0003-0003-0003-000000000001',
      'PRD-0001', 'KVS-DT-100', '8901234567001',
      'Dhanwantharam Tailam', 'Dhanwantaram Oil',
      v_cat_oils, v_mfr_kottakkal, v_unit_ml, v_sup_kerala,
      185.00, 240.00, 260.00, 12.00, '3004',
      10, 5, 100,
      1, 7,
      'Rack B', 'RACK-B', 'S1',
      TRUE, TRUE, FALSE,
      'Classical Ayurvedic oil used in Abhyanga and Panchakarma treatments', TRUE
    ),
    -- Product 2: Triphala Churna
    (
      '33333333-0003-0003-0003-000000000002',
      'PRD-0002', 'KVS-TC-500', '8901234567002',
      'Triphala Churna', 'Trifala Powder',
      v_cat_churna, v_mfr_kottakkal, v_unit_gm, v_sup_kerala,
      95.00, 130.00, 145.00, 5.00, '3004',
      20, 10, 200,
      1, 7,
      'Rack A', 'RACK-A', 'S2',
      TRUE, TRUE, FALSE,
      'Classical Ayurvedic powder blend of Amalaki, Bibhitaki, and Haritaki', TRUE
    ),
    -- Product 3: Ashwagandha Tablets
    (
      '33333333-0003-0003-0003-000000000003',
      'PRD-0003', 'HIM-AW-60', '8901234567003',
      'Ashwagandha Tablets', 'Withania somnifera',
      v_cat_tablets, v_mfr_himalaya, v_unit_strip, v_sup_national,
      130.00, 175.00, 190.00, 12.00, '3004',
      15, 8, 150,
      1, 10,
      'Rack A', 'RACK-A', 'S3',
      TRUE, TRUE, FALSE,
      'Adaptogenic herb tablets for stress relief and vitality', TRUE
    ),
    -- Product 4: Ksheerabala Tailam
    (
      '33333333-0003-0003-0003-000000000004',
      'PRD-0004', 'KVS-KB-200', '8901234567004',
      'Ksheerabala Tailam', 'Kshirabala Oil',
      v_cat_oils, v_mfr_kottakkal, v_unit_ml, v_sup_kerala,
      210.00, 280.00, 300.00, 12.00, '3004',
      5, 3, 50,
      1, 7,
      'Rack B', 'RACK-B', 'S2',
      TRUE, TRUE, FALSE,
      'Medicated oil for Shirodhara and Nasya treatments', TRUE
    ),
    -- Product 5: Disposable Gloves (Consumable — no batch/expiry tracking)
    (
      '33333333-0003-0003-0003-000000000005',
      'PRD-0005', 'CONS-GL-L', '8901234567005',
      'Disposable Examination Gloves (Large)', 'Latex Examination Gloves L',
      v_cat_consumables, NULL, v_unit_pack, v_sup_national,
      85.00, 110.00, 120.00, 18.00, '4015',
      50, 20, 500,
      10, 3,
      'Rack D', 'RACK-D', 'S1',
      FALSE, FALSE, FALSE,
      'Box of 100 latex examination gloves, large size', TRUE
    ),
    -- Product 6: Mahanarayan Tailam
    (
      '33333333-0003-0003-0003-000000000006',
      'PRD-0006', 'KVS-MN-450', '8901234567006',
      'Mahanarayan Tailam', 'Mahanараyana Oil',
      v_cat_panchakarma, v_mfr_kottakkal, v_unit_ml, v_sup_kerala,
      420.00, 560.00, 600.00, 12.00, '3004',
      5, 3, 30,
      1, 14,
      'Rack B', 'RACK-B', 'S3',
      TRUE, TRUE, FALSE,
      'Special Panchakarma oil for joint and muscle treatments', TRUE
    )
  ON CONFLICT (product_code) DO NOTHING;

END;
$$;


-- ============================================================
-- SECTION D: PURCHASE ORDER
-- ============================================================

DO $$
DECLARE
  v_sup_kerala  UUID;
  v_po_uuid     UUID := '44444444-0004-0004-0004-000000000001';
  v_prod1       UUID := '33333333-0003-0003-0003-000000000001'; -- Dhanwantharam
  v_prod2       UUID := '33333333-0003-0003-0003-000000000002'; -- Triphala
  v_prod4       UUID := '33333333-0003-0003-0003-000000000004'; -- Ksheerabala
BEGIN
  SELECT uuid INTO v_sup_kerala FROM inv_suppliers WHERE supplier_code = 'SUP-000001';

  INSERT INTO inv_purchase_orders (
    uuid, po_number, supplier_uuid,
    order_date, expected_delivery_date,
    status,
    subtotal_amount, tax_amount, total_amount,
    remarks
  ) VALUES (
    v_po_uuid,
    'PO-TEST-001',
    v_sup_kerala,
    CURRENT_DATE - 5,
    CURRENT_DATE + 2,
    'approved',
    3650.00, 438.00, 4088.00,
    'Test PO for Phase 2 verification'
  )
  ON CONFLICT (po_number) DO NOTHING;

  -- PO Line Items
  INSERT INTO inv_purchase_order_items (
    uuid, purchase_order_uuid, product_uuid,
    ordered_quantity, received_quantity,
    unit_rate, gst_percentage, line_amount
  ) VALUES
    (
      '44444444-0004-0004-0004-000000000011',
      v_po_uuid, v_prod1,
      10, 0,
      185.00, 12.00, 1850.00
    ),
    (
      '44444444-0004-0004-0004-000000000012',
      v_po_uuid, v_prod2,
      20, 0,
      95.00, 5.00, 1900.00
    ),
    (
      '44444444-0004-0004-0004-000000000013',
      v_po_uuid, v_prod4,
      5, 0,
      210.00, 12.00, 1050.00
    )
  ON CONFLICT DO NOTHING;

END;
$$;


-- ============================================================
-- SECTION E: GOODS RECEIPT NOTE (DRAFT — ready to post)
-- ============================================================

DO $$
DECLARE
  v_sup_kerala  UUID;
  v_po_uuid     UUID := '44444444-0004-0004-0004-000000000001';
  v_grn_uuid    UUID := '55555555-0005-0005-0005-000000000001';
  v_poi1        UUID := '44444444-0004-0004-0004-000000000011';
  v_poi2        UUID := '44444444-0004-0004-0004-000000000012';
  v_poi3        UUID := '44444444-0004-0004-0004-000000000013';
  v_prod1       UUID := '33333333-0003-0003-0003-000000000001';
  v_prod2       UUID := '33333333-0003-0003-0003-000000000002';
  v_prod4       UUID := '33333333-0003-0003-0003-000000000004';
BEGIN
  SELECT uuid INTO v_sup_kerala FROM inv_suppliers WHERE supplier_code = 'SUP-000001';

  INSERT INTO inv_goods_receipts (
    uuid, grn_number, purchase_order_uuid, supplier_uuid,
    invoice_number, invoice_date, received_date,
    status, total_amount, remarks
  ) VALUES (
    v_grn_uuid,
    'GRN-TEST-001',
    v_po_uuid,
    v_sup_kerala,
    'KVS-INV-2026-4501',
    CURRENT_DATE - 1,
    CURRENT_DATE,
    'draft',
    4088.00,
    'Test GRN for Phase 2 verification'
  )
  ON CONFLICT (grn_number) DO NOTHING;

  INSERT INTO inv_goods_receipt_items (
    uuid, grn_uuid, product_uuid, po_item_uuid,
    batch_number, manufacturing_date, expiry_date,
    mrp, purchase_price, selling_price,
    received_qty, free_qty, gst_percentage, line_amount
  ) VALUES
    -- Dhanwantharam Tailam — batch from Jan 2026, expires Jan 2029
    (
      '55555555-0005-0005-0005-000000000011',
      v_grn_uuid, v_prod1, v_poi1,
      'BATCH-DT-2026-01',
      '2026-01-15', '2029-01-14',
      260.00, 185.00, 240.00,
      10, 1,
      12.00, 2035.00
    ),
    -- Triphala Churna — two-year shelf life
    (
      '55555555-0005-0005-0005-000000000012',
      v_grn_uuid, v_prod2, v_poi2,
      'BATCH-TC-2026-03',
      '2026-03-01', '2028-02-28',
      145.00, 95.00, 130.00,
      20, 2,
      5.00, 1995.00
    ),
    -- Ksheerabala Tailam — near expiry batch (for expiry alert testing)
    (
      '55555555-0005-0005-0005-000000000013',
      v_grn_uuid, v_prod4, v_poi3,
      'BATCH-KB-2024-06',
      '2024-06-01', '2026-07-25',   -- expires in ~21 days from July 4 2026
      300.00, 210.00, 280.00,
      5, 0,
      12.00, 1155.00
    )
  ON CONFLICT DO NOTHING;

END;
$$;


-- ============================================================
-- SECTION F: SECOND GRN FOR PARTIAL RECEIPT TESTING
-- This GRN is for the gloves (no-batch product, different supplier)
-- ============================================================

DO $$
DECLARE
  v_sup_national UUID;
  v_grn2_uuid    UUID := '55555555-0005-0005-0005-000000000002';
  v_prod5        UUID := '33333333-0003-0003-0003-000000000005'; -- Gloves
BEGIN
  SELECT uuid INTO v_sup_national FROM inv_suppliers WHERE supplier_code = 'SUP-000002';

  -- PO for gloves
  INSERT INTO inv_purchase_orders (
    uuid, po_number, supplier_uuid,
    order_date, expected_delivery_date,
    status, subtotal_amount, tax_amount, total_amount
  ) VALUES (
    '44444444-0004-0004-0004-000000000002',
    'PO-TEST-002',
    v_sup_national,
    CURRENT_DATE - 3,
    CURRENT_DATE + 1,
    'approved',
    8500.00, 1530.00, 10030.00
  )
  ON CONFLICT (po_number) DO NOTHING;

  INSERT INTO inv_purchase_order_items (
    uuid, purchase_order_uuid, product_uuid,
    ordered_quantity, received_quantity,
    unit_rate, gst_percentage, line_amount
  ) VALUES (
    '44444444-0004-0004-0004-000000000021',
    '44444444-0004-0004-0004-000000000002',
    v_prod5,
    100, 0,
    85.00, 18.00, 8500.00
  )
  ON CONFLICT DO NOTHING;

  -- GRN for partial receipt of 60 packs (out of 100 ordered)
  INSERT INTO inv_goods_receipts (
    uuid, grn_number, purchase_order_uuid, supplier_uuid,
    invoice_number, invoice_date, received_date,
    status, total_amount, remarks
  ) VALUES (
    v_grn2_uuid,
    'GRN-TEST-002',
    '44444444-0004-0004-0004-000000000002',
    v_sup_national,
    'NPW-2026-7892',
    CURRENT_DATE,
    CURRENT_DATE,
    'draft',
    6018.00,
    'Partial receipt — 60 of 100 packs'
  )
  ON CONFLICT (grn_number) DO NOTHING;

  -- Non-batch product: batch_number still required by schema
  -- Use a convention: NOBATCH-{product_code}-{date}
  INSERT INTO inv_goods_receipt_items (
    uuid, grn_uuid, product_uuid, po_item_uuid,
    batch_number, manufacturing_date, expiry_date,
    mrp, purchase_price, selling_price,
    received_qty, free_qty, gst_percentage, line_amount
  ) VALUES (
    '55555555-0005-0005-0005-000000000021',
    v_grn2_uuid, v_prod5,
    '44444444-0004-0004-0004-000000000021',
    'NOBATCH-PRD-0005-20260704',
    NULL, NULL,
    120.00, 85.00, 110.00,
    60, 0,
    18.00, 6018.00
  )
  ON CONFLICT DO NOTHING;

END;
$$;

COMMIT;

-- ============================================================
-- VERIFICATION: Confirm test data inserted
-- ============================================================

SELECT '--- TEST DATA VERIFICATION ---' AS section;

SELECT 'Manufacturers'  AS entity, COUNT(*) AS count FROM inv_manufacturers;
SELECT 'Suppliers'      AS entity, COUNT(*) AS count FROM inv_suppliers;
SELECT 'Products'       AS entity, COUNT(*) AS count FROM inv_products;
SELECT 'Purchase Orders'AS entity, COUNT(*) AS count FROM inv_purchase_orders;
SELECT 'PO Items'       AS entity, COUNT(*) AS count FROM inv_purchase_order_items;
SELECT 'GRNs (draft)'   AS entity, COUNT(*) AS count FROM inv_goods_receipts WHERE status = 'draft';
SELECT 'GRN Items'      AS entity, COUNT(*) AS count FROM inv_goods_receipt_items;

SELECT '--- Products created ---' AS section;
SELECT product_code, product_name, purchase_price, selling_price, batch_tracking, expiry_tracking
FROM inv_products
ORDER BY product_code;

SELECT '--- GRN items ready to post ---' AS section;
SELECT
  grn_number, g.status,
  i.batch_number, p.product_name,
  i.received_qty, i.free_qty,
  i.expiry_date,
  (CURRENT_DATE - i.expiry_date) * -1 AS days_to_expiry
FROM inv_goods_receipts g
JOIN inv_goods_receipt_items i ON i.grn_uuid = g.uuid
JOIN inv_products p ON p.uuid = i.product_uuid
ORDER BY grn_number, i.batch_number;
