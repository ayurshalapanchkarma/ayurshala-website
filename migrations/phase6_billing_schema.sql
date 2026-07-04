-- ============================================================
-- PHASE 6: HOSPITAL BILLING & FINANCIAL OPERATIONS
-- Namespace: bill_ (billing)
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: bill_invoices (Master Invoice Record)
-- ============================================================
CREATE TABLE bill_invoices (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        TEXT        NOT NULL UNIQUE,
  patient_uuid          UUID        NOT NULL,
  appointment_uuid      UUID,                           -- Link to appointment (if applicable)
  doctor_uuid           UUID,                           -- Consulting doctor
  invoice_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  invoice_time          TIME        NOT NULL DEFAULT CURRENT_TIME,
  invoice_type          TEXT        NOT NULL,  -- OPD, IPD, PACKAGE, PHARMACY, PROCEDURE, CONSULTATION
  bill_period_from      DATE,
  bill_period_to        DATE,
  subtotal_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due           NUMERIC(12,2) NOT NULL DEFAULT 0,
  invoice_status        TEXT        NOT NULL DEFAULT 'DRAFT',  -- DRAFT, UNPAID, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED
  payment_status        TEXT        NOT NULL DEFAULT 'PENDING',
  due_date              DATE,
  notes                 TEXT,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by            UUID,
  updated_by            UUID,
  is_deleted            BOOLEAN     DEFAULT FALSE,
  deleted_at            TIMESTAMP
);

CREATE INDEX idx_bill_invoices_number ON bill_invoices(invoice_number);
CREATE INDEX idx_bill_invoices_patient ON bill_invoices(patient_uuid);
CREATE INDEX idx_bill_invoices_date ON bill_invoices(invoice_date);
CREATE INDEX idx_bill_invoices_status ON bill_invoices(invoice_status);
CREATE INDEX idx_bill_invoices_doctor ON bill_invoices(doctor_uuid);

-- ============================================================
-- TABLE: bill_invoice_items (Line Items)
-- ============================================================
CREATE TABLE bill_invoice_items (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_uuid          UUID        NOT NULL REFERENCES bill_invoices(uuid) ON DELETE CASCADE,
  item_type             TEXT        NOT NULL,  -- CONSULTATION, PROCEDURE, MEDICINE, CONSUMABLE, TREATMENT, ROOM, PACKAGE, LAB, MISC
  reference_uuid        UUID,                  -- Link to original transaction (appointment, sale, etc.)
  description           TEXT        NOT NULL,
  quantity              NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_rate             NUMERIC(10,2) NOT NULL,
  discount_type         TEXT,                  -- PERCENTAGE, FIXED, NONE
  discount_value        NUMERIC(10,2) DEFAULT 0,
  discount_percent      NUMERIC(5,2) DEFAULT 0,
  line_amount_before_tax NUMERIC(12,2) NOT NULL,
  gst_percentage        NUMERIC(5,2) DEFAULT 0,
  gst_amount            NUMERIC(10,2) DEFAULT 0,
  cgst_amount           NUMERIC(10,2) DEFAULT 0,
  sgst_amount           NUMERIC(10,2) DEFAULT 0,
  igst_amount           NUMERIC(10,2) DEFAULT 0,
  hsn_code              TEXT,
  line_amount           NUMERIC(12,2) NOT NULL,
  remarks               TEXT,
  created_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_bill_invoice_items_invoice ON bill_invoice_items(invoice_uuid);
CREATE INDEX idx_bill_invoice_items_type ON bill_invoice_items(item_type);

-- ============================================================
-- TABLE: bill_payments (Payment Records)
-- ============================================================
CREATE TABLE bill_payments (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_uuid          UUID        NOT NULL REFERENCES bill_invoices(uuid) ON DELETE CASCADE,
  payment_mode          TEXT        NOT NULL,  -- CASH, UPI, CARD, CHEQUE, BANK_TRANSFER, CREDIT
  amount_paid           NUMERIC(12,2) NOT NULL,
  reference_number      TEXT,                  -- UPI ref, card auth, cheque number, etc.
  payment_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  payment_time          TIME        NOT NULL DEFAULT CURRENT_TIME,
  payment_status        TEXT        DEFAULT 'SUCCESS',  -- SUCCESS, PENDING, FAILED, REFUNDED
  created_by            UUID,
  notes                 TEXT,
  created_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_bill_payments_invoice ON bill_payments(invoice_uuid);
CREATE INDEX idx_bill_payments_mode ON bill_payments(payment_mode);
CREATE INDEX idx_bill_payments_date ON bill_payments(payment_date);

-- ============================================================
-- TABLE: bill_payment_allocations (Payment to Invoice Mapping)
-- ============================================================
CREATE TABLE bill_payment_allocations (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_uuid          UUID        NOT NULL REFERENCES bill_invoices(uuid),
  payment_uuid          UUID        NOT NULL REFERENCES bill_payments(uuid),
  allocated_amount      NUMERIC(12,2) NOT NULL,
  allocation_date       TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_bill_allocations_invoice ON bill_payment_allocations(invoice_uuid);
CREATE INDEX idx_bill_allocations_payment ON bill_payment_allocations(payment_uuid);

-- ============================================================
-- TABLE: bill_refunds (Refund Transactions)
-- ============================================================
CREATE TABLE bill_refunds (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number         TEXT        NOT NULL UNIQUE,
  invoice_uuid          UUID        NOT NULL REFERENCES bill_invoices(uuid),
  patient_uuid          UUID        NOT NULL,
  refund_date           DATE        NOT NULL DEFAULT CURRENT_DATE,
  refund_type           TEXT        NOT NULL,  -- FULL, PARTIAL, CANCELLED_INVOICE, MEDICINE_RETURN, TREATMENT_CANCELLATION
  reason                TEXT,
  original_amount       NUMERIC(12,2) NOT NULL,
  refund_amount         NUMERIC(12,2) NOT NULL,
  refund_mode           TEXT,                  -- CASH, CREDIT, BANK_TRANSFER, etc.
  refund_status         TEXT        DEFAULT 'COMPLETED',  -- DRAFT, COMPLETED, CANCELLED
  approved_by           UUID,
  approved_at           TIMESTAMP,
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW(),
  created_by            UUID,
  is_deleted            BOOLEAN     DEFAULT FALSE
);

CREATE INDEX idx_bill_refunds_number ON bill_refunds(refund_number);
CREATE INDEX idx_bill_refunds_invoice ON bill_refunds(invoice_uuid);
CREATE INDEX idx_bill_refunds_patient ON bill_refunds(patient_uuid);

-- ============================================================
-- TABLE: bill_patient_ledger (Patient Financial History)
-- ============================================================
CREATE TABLE bill_patient_ledger (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL,
  transaction_type      TEXT        NOT NULL,  -- OPENING_BALANCE, CHARGE, PAYMENT, REFUND, CREDIT_NOTE, DEBIT_NOTE, WRITE_OFF
  reference_uuid        UUID,                  -- Invoice, payment, refund, etc.
  description           TEXT,
  debit_amount          NUMERIC(12,2) DEFAULT 0,
  credit_amount         NUMERIC(12,2) DEFAULT 0,
  balance_before        NUMERIC(12,2) NOT NULL,
  balance_after         NUMERIC(12,2) NOT NULL,
  transaction_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_bill_ledger_patient ON bill_patient_ledger(patient_uuid);
CREATE INDEX idx_bill_ledger_date ON bill_patient_ledger(transaction_date);
CREATE INDEX idx_bill_ledger_type ON bill_patient_ledger(transaction_type);

-- ============================================================
-- TABLE: bill_packages (Package Definitions)
-- ============================================================
CREATE TABLE bill_packages (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name          TEXT        NOT NULL,
  package_code          TEXT        UNIQUE,
  package_type          TEXT        NOT NULL,  -- PANCHAKARMA, THERAPY, HEALTH, CUSTOM
  description           TEXT,
  package_price         NUMERIC(10,2) NOT NULL,
  discount_percent      NUMERIC(5,2) DEFAULT 0,
  validity_days         INT,                   -- How long package is valid for
  total_sessions        INT,                   -- Total sessions included
  included_services     JSONB,                 -- Array of service descriptions
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW(),
  created_by            UUID,
  is_active             BOOLEAN     DEFAULT TRUE,
  is_deleted            BOOLEAN     DEFAULT FALSE
);

-- ============================================================
-- TABLE: bill_package_usage (Track Package Consumption)
-- ============================================================
CREATE TABLE bill_package_usage (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_uuid          UUID        NOT NULL REFERENCES bill_invoices(uuid),
  package_uuid          UUID        NOT NULL REFERENCES bill_packages(uuid),
  patient_uuid          UUID        NOT NULL,
  sessions_purchased    INT         NOT NULL,
  sessions_remaining    INT         NOT NULL,
  sessions_used         INT         DEFAULT 0,
  validity_from         DATE        NOT NULL,
  validity_to           DATE        NOT NULL,
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_bill_package_usage_patient ON bill_package_usage(patient_uuid);
CREATE INDEX idx_bill_package_usage_invoice ON bill_package_usage(invoice_uuid);

-- ============================================================
-- TABLE: bill_discounts (Discount Audit Trail)
-- ============================================================
CREATE TABLE bill_discounts (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_uuid          UUID        REFERENCES bill_invoices(uuid) ON DELETE CASCADE,
  invoice_item_uuid     UUID        REFERENCES bill_invoice_items(uuid) ON DELETE CASCADE,
  discount_type         TEXT        NOT NULL,  -- PERCENTAGE, AMOUNT, DOCTOR_DISCOUNT, EMPLOYEE, SENIOR_CITIZEN, PROMOTIONAL, CORPORATE, PACKAGE
  discount_value        NUMERIC(10,2) NOT NULL,
  discount_percent      NUMERIC(5,2),
  reason                TEXT,
  approved_by           UUID,
  approval_status       TEXT        DEFAULT 'APPROVED',  -- PENDING, APPROVED, REJECTED
  created_at            TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- TABLE: bill_credit_notes (Credit Memos)
-- ============================================================
CREATE TABLE bill_credit_notes (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number    TEXT        NOT NULL UNIQUE,
  invoice_uuid          UUID        NOT NULL REFERENCES bill_invoices(uuid),
  patient_uuid          UUID        NOT NULL,
  reason                TEXT,
  credit_amount         NUMERIC(12,2) NOT NULL,
  created_at            TIMESTAMP   DEFAULT NOW(),
  created_by            UUID
);

-- ============================================================
-- TABLE: bill_tax_configuration (GST Configuration)
-- ============================================================
CREATE TABLE bill_tax_configuration (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name          TEXT        NOT NULL,  -- OPD, IPD, PHARMACY, PROCEDURE, etc.
  hsn_code              TEXT,
  tax_rate              NUMERIC(5,2) NOT NULL,
  tax_type              TEXT,                  -- CGST, SGST, IGST
  is_active             BOOLEAN     DEFAULT TRUE,
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- TABLE: bill_daily_closure (End-of-Day Closing)
-- ============================================================
CREATE TABLE bill_daily_closure (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_date          DATE        NOT NULL UNIQUE,
  cash_collected        NUMERIC(12,2) NOT NULL DEFAULT 0,
  upi_collected         NUMERIC(12,2) NOT NULL DEFAULT 0,
  card_collected        NUMERIC(12,2) NOT NULL DEFAULT 0,
  bank_collected        NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit_issued         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_revenue         NUMERIC(12,2) NOT NULL DEFAULT 0,
  refunds_issued        NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_collection        NUMERIC(12,2) NOT NULL DEFAULT 0,
  variance              NUMERIC(12,2),
  closed_by             UUID,
  closed_at             TIMESTAMP,
  is_locked             BOOLEAN     DEFAULT FALSE,
  created_at            TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- TABLE: bill_cash_drawer (Cash Management)
-- ============================================================
CREATE TABLE bill_cash_drawer (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_date           DATE        NOT NULL,
  cashier_uuid          UUID        NOT NULL,
  opening_balance       NUMERIC(12,2) NOT NULL,
  cash_in               NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_out              NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance       NUMERIC(12,2) NOT NULL,
  variance              NUMERIC(12,2),
  shift_status          TEXT,                  -- OPEN, CLOSED, AUDITED
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW()
);

-- ============================================================
-- TABLE: bill_audit_log (Comprehensive Audit Trail)
-- ============================================================
CREATE TABLE bill_audit_log (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_uuid          UUID        REFERENCES bill_invoices(uuid) ON DELETE CASCADE,
  action                TEXT        NOT NULL,  -- CREATE, UPDATE, FINALIZE, PAYMENT, REFUND, DISCOUNT, CANCELLATION, ADJUSTMENT
  changed_fields        JSONB,
  old_value             JSONB,
  new_value             JSONB,
  user_uuid             UUID,
  user_role             TEXT,
  ip_address            TEXT,
  performed_at          TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_bill_audit_log_invoice ON bill_audit_log(invoice_uuid);
CREATE INDEX idx_bill_audit_log_date ON bill_audit_log(performed_at);

-- ============================================================
-- TABLE: bill_invoice_counters (Auto-Increment)
-- ============================================================
CREATE TABLE bill_invoice_counters (
  key                   TEXT        PRIMARY KEY,
  last_number           INT         NOT NULL DEFAULT 0,
  prefix                TEXT,
  updated_at            TIMESTAMP   DEFAULT NOW()
);

INSERT INTO bill_invoice_counters (key, prefix, last_number)
VALUES
  ('invoice_number', 'INV', 0),
  ('refund_number', 'RFD', 0),
  ('credit_note_number', 'CN', 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RPC FUNCTION: Generate Invoice Number
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_number INT;
  v_invoice_number TEXT;
BEGIN
  UPDATE bill_invoice_counters
  SET last_number = last_number + 1,
      updated_at = NOW()
  WHERE key = 'invoice_number'
  RETURNING last_number INTO v_new_number;

  v_invoice_number := 'INV-' || LPAD(v_new_number::TEXT, 6, '0');
  RETURN v_invoice_number;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Generate Refund Number
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_refund_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_number INT;
BEGIN
  UPDATE bill_invoice_counters
  SET last_number = last_number + 1
  WHERE key = 'refund_number'
  RETURNING last_number INTO v_new_number;

  RETURN 'RFD-' || LPAD(v_new_number::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- RPC FUNCTION: fn_finalize_invoice (ATOMIC)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_finalize_invoice(
  p_invoice_uuid UUID,
  p_user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice              bill_invoices%ROWTYPE;
  v_opening_balance      NUMERIC(12,2);
  v_new_balance          NUMERIC(12,2);
BEGIN

  -- Lock and validate invoice
  SELECT * INTO v_invoice
  FROM bill_invoices
  WHERE uuid = p_invoice_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found: %', p_invoice_uuid;
  END IF;

  IF v_invoice.invoice_status != 'DRAFT' THEN
    RAISE EXCEPTION 'Only draft invoices can be finalized. Current status: %', v_invoice.invoice_status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bill_invoice_items WHERE invoice_uuid = p_invoice_uuid) THEN
    RAISE EXCEPTION 'Invoice has no items.';
  END IF;

  -- Get patient's opening balance
  SELECT COALESCE(balance_after, 0) INTO v_opening_balance
  FROM bill_patient_ledger
  WHERE patient_uuid = v_invoice.patient_uuid
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;

  IF v_opening_balance IS NULL THEN
    v_opening_balance := 0;
  END IF;

  -- Create ledger entry for invoice
  v_new_balance := v_opening_balance + v_invoice.total_amount;

  INSERT INTO bill_patient_ledger (
    patient_uuid, transaction_type, reference_uuid, description,
    debit_amount, credit_amount, balance_before, balance_after,
    transaction_date
  )
  VALUES (
    v_invoice.patient_uuid,
    'CHARGE',
    p_invoice_uuid,
    'Invoice: ' || v_invoice.invoice_number,
    v_invoice.total_amount,
    0,
    v_opening_balance,
    v_new_balance,
    CURRENT_DATE
  );

  -- Update invoice status
  UPDATE bill_invoices
  SET
    invoice_status = 'UNPAID',
    payment_status = 'PENDING',
    balance_due = v_invoice.total_amount,
    updated_at = NOW(),
    updated_by = p_user_uuid
  WHERE uuid = p_invoice_uuid;

  -- Audit log
  INSERT INTO bill_audit_log (invoice_uuid, action, new_value, user_uuid)
  VALUES (
    p_invoice_uuid,
    'FINALIZE',
    jsonb_build_object(
      'invoice_number', v_invoice.invoice_number,
      'total_amount', v_invoice.total_amount,
      'patient_balance', v_new_balance
    ),
    p_user_uuid
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'invoice_number', v_invoice.invoice_number,
    'total_amount', v_invoice.total_amount,
    'patient_balance', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'fn_finalize_invoice failed: %', SQLERRM;
END;
$$;

COMMIT;
