-- Phase 7: Finance & Billing Engine
-- Invoices, Payments, Refunds, Revenue

-- Enums
CREATE TYPE invoice_type AS ENUM ('CONSULTATION', 'PHARMACY', 'PANCHAKARMA', 'LAB', 'PACKAGE', 'MIXED');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASHFREE', 'CHEQUE', 'MIXED_PAYMENT');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE discount_type AS ENUM ('FLAT', 'PERCENTAGE');

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  patient_id UUID NOT NULL,
  invoice_type invoice_type NOT NULL,
  status invoice_status DEFAULT 'DRAFT',
  consultation_id UUID,
  treatment_plan_id UUID,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  discount_type discount_type,
  gst_amount NUMERIC(12, 2) DEFAULT 0,
  gst_slab NUMERIC(5, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  outstanding_amount NUMERIC(12, 2) NOT NULL,
  due_date DATE,
  issued_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  notes TEXT,
  created_by UUID NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_total CHECK (total_amount > 0),
  CONSTRAINT valid_paid CHECK (paid_amount <= total_amount)
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  item_type VARCHAR(50) NOT NULL,
  product_id UUID,
  service_name VARCHAR(255),
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  gst_amount NUMERIC(12, 2) DEFAULT 0,
  gst_slab NUMERIC(5, 2) DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL,
  reference_id VARCHAR(100),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_unit_price CHECK (unit_price > 0)
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number VARCHAR(20) NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  patient_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'PENDING',
  transaction_id VARCHAR(100),
  reference_number VARCHAR(100),
  payment_date TIMESTAMP DEFAULT NOW(),
  received_by UUID NOT NULL,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Payment Allocations (track which payments settle which invoices)
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  allocated_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_allocation CHECK (allocated_amount > 0)
);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number VARCHAR(20) NOT NULL UNIQUE,
  invoice_id UUID REFERENCES invoices(id),
  payment_id UUID REFERENCES payments(id),
  patient_id UUID NOT NULL,
  refund_amount NUMERIC(12, 2) NOT NULL,
  refund_reason VARCHAR(100) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  refund_method payment_method,
  transaction_id VARCHAR(100),
  processed_by UUID NOT NULL,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_refund CHECK (refund_amount > 0)
);

-- Refund Items (detailed breakdown)
CREATE TABLE refund_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES refunds(id),
  invoice_item_id UUID REFERENCES invoice_items(id),
  item_description VARCHAR(255),
  refund_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit Notes (for various adjustments)
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number VARCHAR(20) NOT NULL UNIQUE,
  invoice_id UUID REFERENCES invoices(id),
  patient_id UUID NOT NULL,
  reason VARCHAR(255) NOT NULL,
  credit_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_credit CHECK (credit_amount > 0)
);

-- Debit Notes
CREATE TABLE debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number VARCHAR(20) NOT NULL UNIQUE,
  invoice_id UUID REFERENCES invoices(id),
  patient_id UUID NOT NULL,
  reason VARCHAR(255) NOT NULL,
  debit_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_debit CHECK (debit_amount > 0)
);

-- Packages (Panchakarma packages)
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name VARCHAR(255) NOT NULL,
  package_type VARCHAR(50),
  description TEXT,
  sessions_count INTEGER NOT NULL,
  price_per_session NUMERIC(12, 2) NOT NULL,
  total_package_price NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  gst_amount NUMERIC(12, 2) DEFAULT 0,
  package_total NUMERIC(12, 2) NOT NULL,
  validity_days INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Package Purchases (patient buys a package)
CREATE TABLE package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id),
  patient_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  sessions_purchased INTEGER NOT NULL,
  sessions_consumed INTEGER DEFAULT 0,
  sessions_remaining INTEGER NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_package_purchases_updated_at BEFORE UPDATE ON package_purchases FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Indices
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);
CREATE INDEX idx_refunds_invoice ON refunds(invoice_id);
CREATE INDEX idx_refunds_patient ON refunds(patient_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_credit_notes_patient ON credit_notes(patient_id);
CREATE INDEX idx_debit_notes_patient ON debit_notes(patient_id);
CREATE INDEX idx_package_purchases_patient ON package_purchases(patient_id);
CREATE INDEX idx_package_purchases_active ON package_purchases(is_active);
