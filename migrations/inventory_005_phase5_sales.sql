-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_005_phase5_sales.sql
-- Phase 5: Sales & Dispensing
-- ============================================================

BEGIN;

-- ============================================================
-- SEQUENCE: Invoice number
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
  SELECT 'INV-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0')
$$ LANGUAGE sql;

-- ============================================================
-- TABLE: sales
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    TEXT UNIQUE NOT NULL,
  invoice_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  patient_name      TEXT,
  patient_id        UUID,                       -- references auth.users if registered
  doctor_id         UUID,                       -- prescribing doctor
  payment_method    TEXT DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'ONLINE', 'CREDIT')),
  subtotal          NUMERIC(12,2) DEFAULT 0,
  discount_percent  NUMERIC(5,2) DEFAULT 0,
  discount_amount   NUMERIC(10,2) DEFAULT 0,
  gst_amount        NUMERIC(10,2) DEFAULT 0,
  total_amount      NUMERIC(12,2) NOT NULL,
  amount_paid       NUMERIC(12,2) DEFAULT 0,
  balance_due       NUMERIC(12,2) DEFAULT 0,
  status            TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  clinic_id         UUID,
  is_deleted        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice    ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_patient    ON sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_date       ON sales(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_status     ON sales(status, is_deleted);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert" ON sales;
DROP POLICY IF EXISTS "sales_update" ON sales;

CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST', 'DOCTOR')
  );

CREATE POLICY "sales_insert" ON sales
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST')
  );

CREATE POLICY "sales_update" ON sales
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST')
  );

-- ============================================================
-- TABLE: sale_items
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id          UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES inventory_products(id),
  batch_id         UUID REFERENCES inventory_batches(id),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price       NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  mrp              NUMERIC(10,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount  NUMERIC(10,2) DEFAULT 0,
  gst_percent      NUMERIC(5,2) DEFAULT 0,
  gst_amount       NUMERIC(10,2) DEFAULT 0,
  total_amount     NUMERIC(10,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "si_select" ON sale_items;
DROP POLICY IF EXISTS "si_insert" ON sale_items;
DROP POLICY IF EXISTS "si_update" ON sale_items;

CREATE POLICY "si_select" ON sale_items
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST', 'DOCTOR')
  );

CREATE POLICY "si_insert" ON sale_items
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST')
  );

CREATE POLICY "si_update" ON sale_items
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST')
  );

-- ============================================================
-- FUNCTION: complete_sale
-- Completes a sale: creates stock transactions, updates batches
-- ============================================================
CREATE OR REPLACE FUNCTION complete_sale(p_sale_id UUID, p_completed_by UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_sale  sales%ROWTYPE;
  v_item  sale_items%ROWTYPE;
BEGIN
  SELECT * INTO v_sale FROM sales WHERE id = p_sale_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found: %', p_sale_id; END IF;
  IF v_sale.status != 'DRAFT' THEN RAISE EXCEPTION 'Sale is not in DRAFT state'; END IF;

  -- Create stock transactions for each item
  FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    INSERT INTO stock_transactions (
      transaction_type, product_id, batch_id,
      reference_type, reference_id, reference_number,
      quantity_in, quantity_out, unit_cost, created_by
    ) VALUES (
      'SALE',
      v_item.product_id,
      v_item.batch_id,
      'SALE', p_sale_id, v_sale.invoice_number,
      0, v_item.quantity,
      v_item.unit_price,
      p_completed_by
    );

    -- Update batch remaining quantity
    IF v_item.batch_id IS NOT NULL THEN
      UPDATE inventory_batches
      SET remaining_quantity = remaining_quantity - v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.batch_id;

      -- Auto-mark batch as consumed if empty
      UPDATE inventory_batches
      SET status = 'CONSUMED'
      WHERE id = v_item.batch_id AND remaining_quantity <= 0;
    END IF;
  END LOOP;

  -- Mark sale as completed
  UPDATE sales
  SET status = 'COMPLETED', updated_at = NOW()
  WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sales_updated_at ON sales;
CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
