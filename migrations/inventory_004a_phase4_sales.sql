-- ============================================================
-- PHASE 4: Sales & Dispensing
-- Migration: inventory_004a_phase4_sales.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ENUM: Customer Type
-- ============================================================
CREATE TYPE customer_type AS ENUM (
  'PATIENT',
  'WALK_IN',
  'EMPLOYEE',
  'INTERNAL_USE'
);

-- ============================================================
-- ENUM: Sale Status
-- ============================================================
CREATE TYPE sale_status AS ENUM (
  'DRAFT',
  'PENDING_PAYMENT',
  'PAID',
  'PARTIALLY_PAID',
  'CANCELLED',
  'REFUNDED'
);

-- ============================================================
-- ENUM: Payment Status
-- ============================================================
CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED'
);

-- ============================================================
-- ENUM: Payment Method
-- ============================================================
CREATE TYPE payment_method AS ENUM (
  'CASH',
  'UPI',
  'CARD',
  'BANK_TRANSFER',
  'ONLINE',
  'MIXED'
);

-- ============================================================
-- TABLE: sales
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        TEXT UNIQUE NOT NULL,
  customer_type         customer_type NOT NULL,
  patient_id            UUID REFERENCES auth.users(id),
  customer_name         TEXT,
  customer_phone        TEXT,
  sale_date             TIMESTAMPTZ DEFAULT NOW(),
  total_items           INTEGER DEFAULT 0,
  subtotal              NUMERIC(12,2) DEFAULT 0,
  gst_amount            NUMERIC(12,2) DEFAULT 0,
  discount_percent      NUMERIC(5,2) DEFAULT 0,
  discount_amount       NUMERIC(12,2) DEFAULT 0,
  total_amount          NUMERIC(12,2) DEFAULT 0,
  paid_amount           NUMERIC(12,2) DEFAULT 0,
  status                sale_status DEFAULT 'DRAFT',
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id),
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sale_patient ON sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_sale_status ON sales(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_sale_date ON sales(sale_date DESC);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

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
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id               UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID REFERENCES inventory_batches(id),
  quantity              NUMERIC(12,4) NOT NULL,
  mrp                   NUMERIC(10,2) NOT NULL,
  selling_price         NUMERIC(10,2) NOT NULL,
  gst_percent           NUMERIC(5,2) DEFAULT 0,
  discount_percent      NUMERIC(5,2) DEFAULT 0,
  line_total            NUMERIC(12,2),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_batch ON sale_items(batch_id);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "sale_items_admin" ON sale_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST'));

-- ============================================================
-- TABLE: sale_payments
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id               UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method        payment_method NOT NULL,
  amount                NUMERIC(12,2) NOT NULL,
  status                payment_status DEFAULT 'PENDING',
  reference_number      TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_sale ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON sale_payments(status);

ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_select" ON sale_payments
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "payment_admin" ON sale_payments
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST'));

-- ============================================================
-- ENUM: Return Reason
-- ============================================================
CREATE TYPE return_reason AS ENUM (
  'WRONG_MEDICINE',
  'EXPIRED',
  'DAMAGED',
  'PATIENT_RETURNED',
  'BILLING_ERROR'
);

-- ============================================================
-- TABLE: sale_returns
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_returns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number         TEXT UNIQUE NOT NULL,
  sale_id               UUID NOT NULL REFERENCES sales(id),
  return_date           TIMESTAMPTZ DEFAULT NOW(),
  reason                return_reason NOT NULL,
  notes                 TEXT,
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_number ON sale_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_return_sale ON sale_returns(sale_id);

ALTER TABLE sale_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "returns_select" ON sale_returns
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "returns_admin" ON sale_returns
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

-- ============================================================
-- TABLE: sale_return_items
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_return_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_return_id        UUID NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
  sale_item_id          UUID REFERENCES sale_items(id),
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  batch_id              UUID REFERENCES inventory_batches(id),
  quantity              NUMERIC(12,4) NOT NULL,
  refund_amount         NUMERIC(12,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_items_return ON sale_return_items(sale_return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product ON sale_return_items(product_id);

ALTER TABLE sale_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "return_items_admin" ON sale_return_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('ADMIN', 'PHARMACIST'));

-- ============================================================
-- FUNCTION: Generate Invoice Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, 9, 6) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM sales
  WHERE invoice_number LIKE 'INV-' || v_year || '-%';
  
  RETURN 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Generate Return Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number, 8, 6) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM sale_returns
  WHERE return_number LIKE 'RET-' || v_year || '-%';
  
  RETURN 'RET-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================
DROP TRIGGER IF EXISTS trg_sales_updated_at ON sales;
CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sale_items_updated_at ON sale_items;
CREATE TRIGGER trg_sale_items_updated_at
  BEFORE UPDATE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sale_payments_updated_at ON sale_payments;
CREATE TRIGGER trg_sale_payments_updated_at
  BEFORE UPDATE ON sale_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sale_returns_updated_at ON sale_returns;
CREATE TRIGGER trg_sale_returns_updated_at
  BEFORE UPDATE ON sale_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGERS: Audit logging
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_sales ON sales;
CREATE TRIGGER trg_audit_sales
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_sale_items ON sale_items;
CREATE TRIGGER trg_audit_sale_items
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_sale_returns ON sale_returns;
CREATE TRIGGER trg_audit_sale_returns
  AFTER INSERT OR UPDATE OR DELETE ON sale_returns
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

COMMIT;
