-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 002: INDEXES
-- Run after 001_schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- inv_settings
-- ============================================================
CREATE INDEX idx_inv_settings_key        ON inv_settings(setting_key);

-- ============================================================
-- inv_categories
-- ============================================================
CREATE INDEX idx_inv_categories_active   ON inv_categories(is_active);
CREATE INDEX idx_inv_categories_order    ON inv_categories(display_order);

-- ============================================================
-- inv_units
-- ============================================================
CREATE INDEX idx_inv_units_active        ON inv_units(is_active);

-- ============================================================
-- inv_tax_master
-- ============================================================
CREATE INDEX idx_inv_tax_active          ON inv_tax_master(is_active);

-- ============================================================
-- inv_manufacturers
-- ============================================================
CREATE INDEX idx_inv_mfr_name            ON inv_manufacturers(manufacturer_name);
CREATE INDEX idx_inv_mfr_active          ON inv_manufacturers(is_active);

-- ============================================================
-- inv_suppliers
-- ============================================================
CREATE INDEX idx_inv_sup_code            ON inv_suppliers(supplier_code);
CREATE INDEX idx_inv_sup_company         ON inv_suppliers(company_name);
CREATE INDEX idx_inv_sup_active          ON inv_suppliers(is_active);

-- ============================================================
-- inv_products  — most critical for search and filtering
-- ============================================================
CREATE INDEX idx_inv_prod_code           ON inv_products(product_code);
CREATE INDEX idx_inv_prod_barcode        ON inv_products(barcode);
CREATE INDEX idx_inv_prod_sku            ON inv_products(sku);
CREATE INDEX idx_inv_prod_category       ON inv_products(category_uuid);
CREATE INDEX idx_inv_prod_manufacturer   ON inv_products(manufacturer_uuid);
CREATE INDEX idx_inv_prod_supplier       ON inv_products(default_supplier_uuid);
CREATE INDEX idx_inv_prod_unit           ON inv_products(unit_uuid);
CREATE INDEX idx_inv_prod_active         ON inv_products(is_active);
-- Full-text search on product_name + generic_name
CREATE INDEX idx_inv_prod_fts            ON inv_products
  USING GIN(to_tsvector('english', product_name || ' ' || COALESCE(generic_name,'')));

-- ============================================================
-- inv_product_batches
-- ============================================================
CREATE INDEX idx_inv_batch_product       ON inv_product_batches(product_uuid);
CREATE INDEX idx_inv_batch_number        ON inv_product_batches(batch_number);
CREATE INDEX idx_inv_batch_expiry        ON inv_product_batches(expiry_date);
CREATE INDEX idx_inv_batch_status        ON inv_product_batches(status);
CREATE INDEX idx_inv_batch_grn           ON inv_product_batches(grn_uuid);
CREATE INDEX idx_inv_batch_supplier      ON inv_product_batches(supplier_uuid);
-- Composite: product + status — used for current stock queries
CREATE INDEX idx_inv_batch_prod_status   ON inv_product_batches(product_uuid, status);

-- ============================================================
-- inv_purchase_orders
-- ============================================================
CREATE INDEX idx_inv_po_number           ON inv_purchase_orders(po_number);
CREATE INDEX idx_inv_po_supplier         ON inv_purchase_orders(supplier_uuid);
CREATE INDEX idx_inv_po_status           ON inv_purchase_orders(status);
CREATE INDEX idx_inv_po_date             ON inv_purchase_orders(order_date);
CREATE INDEX idx_inv_po_active           ON inv_purchase_orders(is_active);

-- ============================================================
-- inv_purchase_order_items
-- ============================================================
CREATE INDEX idx_inv_poi_po              ON inv_purchase_order_items(purchase_order_uuid);
CREATE INDEX idx_inv_poi_product         ON inv_purchase_order_items(product_uuid);

-- ============================================================
-- inv_goods_receipts
-- ============================================================
CREATE INDEX idx_inv_grn_number          ON inv_goods_receipts(grn_number);
CREATE INDEX idx_inv_grn_po              ON inv_goods_receipts(purchase_order_uuid);
CREATE INDEX idx_inv_grn_supplier        ON inv_goods_receipts(supplier_uuid);
CREATE INDEX idx_inv_grn_status          ON inv_goods_receipts(status);
CREATE INDEX idx_inv_grn_received_date   ON inv_goods_receipts(received_date);
CREATE INDEX idx_inv_grn_active          ON inv_goods_receipts(is_active);

-- ============================================================
-- inv_goods_receipt_items
-- ============================================================
CREATE INDEX idx_inv_grni_grn            ON inv_goods_receipt_items(grn_uuid);
CREATE INDEX idx_inv_grni_product        ON inv_goods_receipt_items(product_uuid);
CREATE INDEX idx_inv_grni_batch          ON inv_goods_receipt_items(batch_number);
CREATE INDEX idx_inv_grni_expiry         ON inv_goods_receipt_items(expiry_date);

-- ============================================================
-- inv_stock_movements  — most read-heavy table
-- ============================================================
CREATE INDEX idx_inv_mov_product         ON inv_stock_movements(product_uuid);
CREATE INDEX idx_inv_mov_batch           ON inv_stock_movements(batch_uuid);
CREATE INDEX idx_inv_mov_type            ON inv_stock_movements(movement_type);
CREATE INDEX idx_inv_mov_ref_type        ON inv_stock_movements(reference_type);
CREATE INDEX idx_inv_mov_ref_uuid        ON inv_stock_movements(reference_uuid);
CREATE INDEX idx_inv_mov_created_at      ON inv_stock_movements(created_at);
CREATE INDEX idx_inv_mov_created_by      ON inv_stock_movements(created_by);
-- Composite: product + created_at — for product ledger report
CREATE INDEX idx_inv_mov_prod_date       ON inv_stock_movements(product_uuid, created_at DESC);
-- Composite: batch + type — for FIFO consumption queries
CREATE INDEX idx_inv_mov_batch_type      ON inv_stock_movements(batch_uuid, movement_type);

-- ============================================================
-- inv_stock_adjustments
-- ============================================================
CREATE INDEX idx_inv_adj_number          ON inv_stock_adjustments(adjustment_number);
CREATE INDEX idx_inv_adj_status          ON inv_stock_adjustments(status);
CREATE INDEX idx_inv_adj_date            ON inv_stock_adjustments(adjustment_date);
CREATE INDEX idx_inv_adj_active          ON inv_stock_adjustments(is_active);

-- ============================================================
-- inv_stock_adjustment_items
-- ============================================================
CREATE INDEX idx_inv_adji_adj            ON inv_stock_adjustment_items(adjustment_uuid);
CREATE INDEX idx_inv_adji_product        ON inv_stock_adjustment_items(product_uuid);
CREATE INDEX idx_inv_adji_batch          ON inv_stock_adjustment_items(batch_uuid);

-- ============================================================
-- inv_audit_log
-- ============================================================
CREATE INDEX idx_inv_audit_module        ON inv_audit_log(module);
CREATE INDEX idx_inv_audit_action        ON inv_audit_log(action);
CREATE INDEX idx_inv_audit_record        ON inv_audit_log(record_uuid);
CREATE INDEX idx_inv_audit_performed_by  ON inv_audit_log(performed_by);
CREATE INDEX idx_inv_audit_performed_at  ON inv_audit_log(performed_at DESC);

-- ============================================================
-- inv_warehouses / inv_warehouse_locations
-- ============================================================
CREATE INDEX idx_inv_wh_active           ON inv_warehouses(is_active);
CREATE INDEX idx_inv_whl_warehouse       ON inv_warehouse_locations(warehouse_uuid);
CREATE INDEX idx_inv_whl_code            ON inv_warehouse_locations(location_code);

COMMIT;
