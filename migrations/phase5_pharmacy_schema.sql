-- ============================================================
-- PHASE 5: PHARMACY BILLING & POS
-- Namespace: ph_ (pharmacy)
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: ph_bills (Sales/Transactions)
-- ============================================================
CREATE TABLE ph_bills (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number           TEXT        NOT NULL UNIQUE,
  patient_uuid          UUID,                           -- Can be NULL for walk-in
  doctor_uuid           UUID,
  cashier_uuid          UUID        NOT NULL,
  bill_date             DATE        NOT NULL DEFAULT CURRENT_DATE,
  bill_time             TIME        NOT NULL DEFAULT CURRENT_TIME,
  bill_type             TEXT        DEFAULT 'PHARMACY',  -- PHARMACY, OPD, IPD, PACKAGE
  subtotal_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due           NUMERIC(12,2) NOT NULL DEFAULT 0,
  bill_status           TEXT        NOT NULL DEFAULT 'DRAFT',  -- DRAFT, COMPLETED, CANCELLED, RETURNED
  payment_status        TEXT        NOT NULL DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID, OVERPAID
  notes                 TEXT,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by            UUID,
  updated_by            UUID,
  is_deleted            BOOLEAN     DEFAULT FALSE,
  deleted_at            TIMESTAMP
);

CREATE INDEX idx_ph_bills_bill_number ON ph_bills(bill_number);
CREATE INDEX idx_ph_bills_patient ON ph_bills(patient_uuid);
CREATE INDEX idx_ph_bills_date ON ph_bills(bill_date);
CREATE INDEX idx_ph_bills_status ON ph_bills(bill_status);
CREATE INDEX idx_ph_bills_cashier ON ph_bills(cashier_uuid);

-- ============================================================
-- TABLE: ph_bill_items (Line Items)
-- ============================================================
CREATE TABLE ph_bill_items (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_uuid             UUID        NOT NULL REFERENCES ph_bills(uuid) ON DELETE CASCADE,
  product_uuid          UUID        NOT NULL,
  batch_uuid            UUID,                           -- FIFO batch selected
  quantity              NUMERIC(10,2) NOT NULL,
  unit_rate             NUMERIC(10,2) NOT NULL,
  discount_type         TEXT,                           -- PERCENTAGE, FIXED, NONE
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
  created_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_ph_bill_items_bill ON ph_bill_items(bill_uuid);
CREATE INDEX idx_ph_bill_items_product ON ph_bill_items(product_uuid);
CREATE INDEX idx_ph_bill_items_batch ON ph_bill_items(batch_uuid);

-- ============================================================
-- TABLE: ph_bill_payments (Payment Records)
-- ============================================================
CREATE TABLE ph_bill_payments (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_uuid             UUID        NOT NULL REFERENCES ph_bills(uuid) ON DELETE CASCADE,
  payment_mode          TEXT        NOT NULL,  -- CASH, UPI, CARD, NET_BANKING, CREDIT, SPLIT
  amount_paid           NUMERIC(12,2) NOT NULL,
  reference_number      TEXT,                  -- UPI ref, card auth code, etc.
  payment_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  payment_time          TIME        NOT NULL DEFAULT CURRENT_TIME,
  payment_status        TEXT        DEFAULT 'SUCCESS',  -- SUCCESS, PENDING, FAILED
  notes                 TEXT,
  created_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_ph_bill_payments_bill ON ph_bill_payments(bill_uuid);
CREATE INDEX idx_ph_bill_payments_mode ON ph_bill_payments(payment_mode);

-- ============================================================
-- TABLE: ph_bill_returns (Return Transactions)
-- ============================================================
CREATE TABLE ph_bill_returns (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number         TEXT        NOT NULL UNIQUE,
  original_bill_uuid    UUID        NOT NULL REFERENCES ph_bills(uuid),
  patient_uuid          UUID,
  return_date           DATE        NOT NULL DEFAULT CURRENT_DATE,
  return_time           TIME        NOT NULL DEFAULT CURRENT_TIME,
  return_type           TEXT        NOT NULL,  -- FULL, PARTIAL, DAMAGED, EXPIRED
  reason                TEXT,
  total_return_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_mode           TEXT,                  -- CASH, CREDIT, etc.
  return_status         TEXT        DEFAULT 'COMPLETED',  -- DRAFT, COMPLETED, CANCELLED
  approved_by           UUID,
  approved_at           TIMESTAMP,
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW(),
  created_by            UUID,
  is_deleted            BOOLEAN     DEFAULT FALSE
);

CREATE INDEX idx_ph_bill_returns_number ON ph_bill_returns(return_number);
CREATE INDEX idx_ph_bill_returns_original_bill ON ph_bill_returns(original_bill_uuid);
CREATE INDEX idx_ph_bill_returns_patient ON ph_bill_returns(patient_uuid);

-- ============================================================
-- TABLE: ph_bill_return_items (Returned Items)
-- ============================================================
CREATE TABLE ph_bill_return_items (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  return_uuid           UUID        NOT NULL REFERENCES ph_bill_returns(uuid) ON DELETE CASCADE,
  bill_item_uuid        UUID,                  -- Link to original bill item
  product_uuid          UUID        NOT NULL,
  batch_uuid            UUID,
  quantity_returned     NUMERIC(10,2) NOT NULL,
  reason                TEXT,                  -- EXPIRED, DAMAGED, WRONG_ITEM, etc.
  refund_value          NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_ph_bill_return_items_return ON ph_bill_return_items(return_uuid);
CREATE INDEX idx_ph_bill_return_items_product ON ph_bill_return_items(product_uuid);

-- ============================================================
-- TABLE: ph_bill_discounts (Discount Audit)
-- ============================================================
CREATE TABLE ph_bill_discounts (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_uuid             UUID        REFERENCES ph_bills(uuid) ON DELETE CASCADE,
  bill_item_uuid        UUID        REFERENCES ph_bill_items(uuid) ON DELETE CASCADE,
  discount_type         TEXT        NOT NULL,  -- PERCENTAGE, FIXED, DOCTOR, EMPLOYEE, SENIOR_CITIZEN
  discount_value        NUMERIC(10,2) NOT NULL,
  discount_percent      NUMERIC(5,2),
  reason                TEXT,
  approved_by           UUID,
  created_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_ph_bill_discounts_bill ON ph_bill_discounts(bill_uuid);

-- ============================================================
-- TABLE: ph_bill_print_logs (Print History)
-- ============================================================
CREATE TABLE ph_bill_print_logs (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_uuid             UUID        NOT NULL REFERENCES ph_bills(uuid) ON DELETE CASCADE,
  print_type            TEXT        NOT NULL,  -- A4, THERMAL, LABEL, QR
  print_count           INT         DEFAULT 1,
  printed_by            UUID,
  printed_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_ph_bill_print_logs_bill ON ph_bill_print_logs(bill_uuid);

-- ============================================================
-- TABLE: ph_bill_audit_log (Complete Audit Trail)
-- ============================================================
CREATE TABLE ph_bill_audit_log (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_uuid             UUID        REFERENCES ph_bills(uuid) ON DELETE CASCADE,
  action                TEXT        NOT NULL,  -- CREATE, UPDATE, COMPLETE, CANCEL, RETURN, PRINT
  changed_fields        JSONB,                 -- What changed
  new_value             JSONB,
  old_value             JSONB,
  performed_by          UUID,
  performed_at          TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_ph_bill_audit_log_bill ON ph_bill_audit_log(bill_uuid);

-- ============================================================
-- TABLE: ph_bill_counters (Auto-Increment Helpers)
-- ============================================================
CREATE TABLE ph_bill_counters (
  key                   TEXT        PRIMARY KEY,
  last_number           INT         NOT NULL DEFAULT 0,
  prefix                TEXT,
  updated_at            TIMESTAMP   DEFAULT NOW()
);

INSERT INTO ph_bill_counters (key, prefix, last_number) 
VALUES ('bill_number', 'BILL', 0) ON CONFLICT DO NOTHING;

-- ============================================================
-- RPC FUNCTION: Generate Bill Number
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_bill_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_number INT;
  v_new_number INT;
  v_bill_number TEXT;
BEGIN
  -- Lock and increment counter
  UPDATE ph_bill_counters
  SET last_number = last_number + 1,
      updated_at = NOW()
  WHERE key = 'bill_number'
  RETURNING last_number INTO v_new_number;

  -- Format: BILL-000001
  v_bill_number := 'BILL-' || LPAD(v_new_number::TEXT, 6, '0');
  
  RETURN v_bill_number;
END;
$$;

-- ============================================================
-- RPC FUNCTION: Generate Return Number
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_return_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_counter INT;
  v_return_number TEXT;
BEGIN
  -- Get and increment counter for returns
  UPDATE ph_bill_counters
  SET last_number = last_number + 1
  WHERE key = 'bill_number'
  RETURNING last_number INTO v_counter;

  v_return_number := 'RET-' || LPAD(v_counter::TEXT, 6, '0');
  RETURN v_return_number;
END;
$$;

-- ============================================================
-- RPC FUNCTION: fn_post_sale (CRITICAL - Atomic Billing)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_post_sale(
  p_bill_uuid UUID,
  p_user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_bill                ph_bills%ROWTYPE;
  v_item                ph_bill_items%ROWTYPE;
  v_batch               inv_product_batches%ROWTYPE;
  v_before_stock        NUMERIC(12,2);
  v_after_stock         NUMERIC(12,2);
  v_items_processed     INTEGER := 0;
  v_movements_created   INTEGER := 0;
BEGIN

  -- -------------------------------------------------------
  -- 1. Lock and validate bill
  -- -------------------------------------------------------
  SELECT * INTO v_bill
  FROM ph_bills
  WHERE uuid = p_bill_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found: %', p_bill_uuid;
  END IF;

  IF v_bill.bill_status != 'DRAFT' THEN
    RAISE EXCEPTION 'Only draft bills can be posted. Current status: %', v_bill.bill_status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM ph_bill_items WHERE bill_uuid = p_bill_uuid) THEN
    RAISE EXCEPTION 'Bill % has no items. Add items before completing sale.', v_bill.bill_number;
  END IF;

  -- -------------------------------------------------------
  -- 2. Process each bill item (FIFO deduction)
  -- -------------------------------------------------------
  FOR v_item IN
    SELECT * FROM ph_bill_items
    WHERE bill_uuid = p_bill_uuid
    ORDER BY created_at
  LOOP
    
    -- Get oldest good batch for this product (FIFO)
    SELECT * INTO v_batch
    FROM inv_product_batches
    WHERE product_uuid = v_item.product_uuid
      AND status = 'good'
      AND is_active = TRUE
      AND available_quantity > 0
      AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    ORDER BY created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No available batch for product %', v_item.product_uuid;
    END IF;

    -- Verify sufficient quantity
    IF v_batch.available_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock. Product: %, Available: %, Requested: %',
        v_item.product_uuid, v_batch.available_quantity, v_item.quantity;
    END IF;

    -- Record before stock
    v_before_stock := v_batch.available_quantity;

    -- Create stock movement (CONSUMPTION/SALE)
    INSERT INTO inv_stock_movements (
      product_uuid, batch_uuid, movement_type, quantity,
      before_stock, after_stock, reference_type, reference_uuid, remarks,
      created_by, is_active
    )
    VALUES (
      v_item.product_uuid,
      v_batch.uuid,
      'SALE',
      v_item.quantity,
      v_before_stock,
      v_before_stock - v_item.quantity,
      'BILL',
      p_bill_uuid,
      'Sale: ' || v_bill.bill_number,
      p_user_uuid,
      TRUE
    );

    v_movements_created := v_movements_created + 1;

    -- Update batch available quantity
    UPDATE inv_product_batches
    SET available_quantity = available_quantity - v_item.quantity,
        updated_at = NOW()
    WHERE uuid = v_batch.uuid;

    -- Update bill item with batch info
    UPDATE ph_bill_items
    SET batch_uuid = v_batch.uuid
    WHERE uuid = v_item.uuid;

    v_items_processed := v_items_processed + 1;

  END LOOP;

  -- -------------------------------------------------------
  -- 3. Mark bill as completed
  -- -------------------------------------------------------
  UPDATE ph_bills
  SET
    bill_status = 'COMPLETED',
    payment_status = CASE 
      WHEN paid_amount >= total_amount THEN 'PAID'
      WHEN paid_amount > 0 THEN 'PARTIAL'
      ELSE 'PENDING'
    END,
    balance_due = total_amount - paid_amount,
    updated_at = NOW(),
    updated_by = p_user_uuid
  WHERE uuid = p_bill_uuid;

  -- -------------------------------------------------------
  -- 4. Audit log
  -- -------------------------------------------------------
  INSERT INTO ph_bill_audit_log (bill_uuid, action, new_value, performed_by)
  VALUES (
    p_bill_uuid,
    'COMPLETE_SALE',
    jsonb_build_object(
      'bill_number', v_bill.bill_number,
      'items_processed', v_items_processed,
      'movements_created', v_movements_created,
      'total_amount', v_bill.total_amount
    ),
    p_user_uuid
  );

  -- -------------------------------------------------------
  -- 5. Return result
  -- -------------------------------------------------------
  RETURN jsonb_build_object(
    'success', TRUE,
    'bill_number', v_bill.bill_number,
    'items_processed', v_items_processed,
    'movements_created', v_movements_created,
    'total_amount', v_bill.total_amount
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'fn_post_sale failed for bill %: %', p_bill_uuid, SQLERRM;
END;
$$;

COMMENT ON FUNCTION fn_post_sale(UUID, UUID) IS
  'Posts a completed sale bill. Atomically: selects FIFO batches, creates stock movements, '
  'updates batch quantities, and marks bill as completed. All operations in one transaction.';

-- ============================================================
-- RPC FUNCTION: fn_post_return (Atomic Return Processing)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_post_return(
  p_return_uuid UUID,
  p_user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_return           ph_bill_returns%ROWTYPE;
  v_item             ph_bill_return_items%ROWTYPE;
  v_batch            inv_product_batches%ROWTYPE;
  v_before_stock     NUMERIC(12,2);
  v_after_stock      NUMERIC(12,2);
  v_items_processed  INTEGER := 0;
BEGIN

  -- Validate return
  SELECT * INTO v_return
  FROM ph_bill_returns
  WHERE uuid = p_return_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return not found: %', p_return_uuid;
  END IF;

  -- Process each returned item
  FOR v_item IN
    SELECT * FROM ph_bill_return_items
    WHERE return_uuid = p_return_uuid
  LOOP

    -- Get the batch that was originally sold
    SELECT * INTO v_batch
    FROM inv_product_batches
    WHERE uuid = v_item.batch_uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Batch not found for return item';
    END IF;

    v_before_stock := v_batch.available_quantity;

    -- Create stock movement for return (REVERSAL)
    INSERT INTO inv_stock_movements (
      product_uuid, batch_uuid, movement_type, quantity,
      before_stock, after_stock, reference_type, reference_uuid, remarks,
      created_by, is_active
    )
    VALUES (
      v_item.product_uuid,
      v_item.batch_uuid,
      'RETURN',
      v_item.quantity_returned,
      v_before_stock,
      v_before_stock + v_item.quantity_returned,
      'RETURN',
      p_return_uuid,
      'Return: ' || v_return.return_number || ' - ' || v_return.reason,
      p_user_uuid,
      TRUE
    );

    -- Restore batch quantity
    UPDATE inv_product_batches
    SET available_quantity = available_quantity + v_item.quantity_returned,
        updated_at = NOW()
    WHERE uuid = v_item.batch_uuid;

    v_items_processed := v_items_processed + 1;

  END LOOP;

  -- Mark return as completed
  UPDATE ph_bill_returns
  SET
    return_status = 'COMPLETED',
    approved_by = p_user_uuid,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE uuid = p_return_uuid;

  -- Audit log
  INSERT INTO ph_bill_audit_log (bill_uuid, action, new_value, performed_by)
  VALUES (
    v_return.original_bill_uuid,
    'PROCESS_RETURN',
    jsonb_build_object(
      'return_number', v_return.return_number,
      'items_restored', v_items_processed,
      'refund_amount', v_return.refund_amount
    ),
    p_user_uuid
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'return_number', v_return.return_number,
    'items_restored', v_items_processed,
    'refund_amount', v_return.refund_amount
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'fn_post_return failed: %', SQLERRM;
END;
$$;

COMMIT;
