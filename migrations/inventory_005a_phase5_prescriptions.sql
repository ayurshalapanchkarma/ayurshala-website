-- ============================================================
-- PHASE 5: Doctor Prescriptions & Treatment Planning
-- Migration: inventory_005a_phase5_prescriptions.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ENUM: Prescription Status
-- ============================================================
CREATE TYPE prescription_status AS ENUM (
  'DRAFT',
  'ACTIVE',
  'PARTIALLY_DISPENSED',
  'DISPENSED',
  'COMPLETED',
  'CANCELLED'
);

-- ============================================================
-- ENUM: Frequency
-- ============================================================
CREATE TYPE dosage_frequency AS ENUM (
  'ONCE_DAILY',
  'TWICE_DAILY',
  'THRICE_DAILY',
  'FOUR_TIMES_DAILY',
  'ALTERNATE_DAYS',
  'EVERY_OTHER_DAY',
  'WEEKLY',
  'AS_NEEDED'
);

-- ============================================================
-- ENUM: Timing
-- ============================================================
CREATE TYPE medicine_timing AS ENUM (
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'NIGHT',
  'BEFORE_FOOD',
  'AFTER_FOOD',
  'WITH_FOOD'
);

-- ============================================================
-- TABLE: prescriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_number   TEXT UNIQUE NOT NULL,
  patient_id            UUID NOT NULL REFERENCES auth.users(id),
  doctor_id             UUID NOT NULL REFERENCES auth.users(id),
  appointment_id        UUID,
  diagnosis             TEXT NOT NULL,
  chief_complaint       TEXT,
  clinical_notes        TEXT,
  advice                TEXT,
  diet_instructions     TEXT,
  lifestyle_recommendations TEXT,
  follow_up_date        DATE,
  status                prescription_status DEFAULT 'DRAFT',
  is_deleted            BOOLEAN DEFAULT FALSE,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rx_number ON prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS idx_rx_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_rx_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_rx_status ON prescriptions(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_rx_date ON prescriptions(created_at DESC);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rx_select" ON prescriptions
  FOR SELECT USING (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );

CREATE POLICY "rx_insert" ON prescriptions
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth_user_role() = 'DOCTOR'
  );

CREATE POLICY "rx_update" ON prescriptions
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    (auth_user_role() = 'DOCTOR' AND doctor_id = auth.uid())
  );

-- ============================================================
-- TABLE: prescription_items (Medicines)
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id       UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES inventory_products(id),
  dosage                NUMERIC(10,2),
  dosage_unit           TEXT,
  frequency             dosage_frequency,
  duration_days         INTEGER,
  quantity_morning      NUMERIC(12,4) DEFAULT 0,
  quantity_afternoon    NUMERIC(12,4) DEFAULT 0,
  quantity_evening      NUMERIC(12,4) DEFAULT 0,
  quantity_night        NUMERIC(12,4) DEFAULT 0,
  timing                medicine_timing,
  instructions          TEXT,
  quantity_required     NUMERIC(12,4),
  dispensed_quantity    NUMERIC(12,4) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rx_items_rx ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_rx_items_product ON prescription_items(product_id);

ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rx_items_select" ON prescription_items
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "rx_items_admin" ON prescription_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('DOCTOR', 'ADMIN'));

-- ============================================================
-- TABLE: prescription_treatments (Panchakarma)
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_treatments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id       UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  treatment_name        TEXT NOT NULL,
  sessions_planned      INTEGER NOT NULL DEFAULT 1,
  sessions_completed    INTEGER DEFAULT 0,
  frequency             dosage_frequency,
  duration_days         INTEGER,
  doctor_notes          TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_rx ON prescription_treatments(prescription_id);

ALTER TABLE prescription_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tx_select" ON prescription_treatments
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "tx_admin" ON prescription_treatments
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('DOCTOR', 'ADMIN'));

-- ============================================================
-- TABLE: follow_ups
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id       UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id            UUID NOT NULL REFERENCES auth.users(id),
  doctor_id             UUID NOT NULL REFERENCES auth.users(id),
  follow_up_date        DATE NOT NULL,
  reason                TEXT,
  status                TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  reminder_sent         BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fu_rx ON follow_ups(prescription_id);
CREATE INDEX IF NOT EXISTS idx_fu_patient ON follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_fu_date ON follow_ups(follow_up_date);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fu_select" ON follow_ups
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "fu_admin" ON follow_ups
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('DOCTOR', 'ADMIN'));

-- ============================================================
-- TABLE: prescription_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_notes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id       UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  note_type             TEXT CHECK (note_type IN ('CLINICAL', 'DISPENSING', 'TREATMENT')),
  content               TEXT NOT NULL,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_rx ON prescription_notes(prescription_id);

ALTER TABLE prescription_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select" ON prescription_notes
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "notes_admin" ON prescription_notes
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth_user_role() IN ('DOCTOR', 'ADMIN', 'PHARMACIST'));

-- ============================================================
-- FUNCTION: Generate Prescription Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(prescription_number, 9, 6) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM prescriptions
  WHERE prescription_number LIKE 'RX-' || v_year || '-%';
  
  RETURN 'RX-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================
DROP TRIGGER IF EXISTS trg_rx_updated_at ON prescriptions;
CREATE TRIGGER trg_rx_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_rx_items_updated_at ON prescription_items;
CREATE TRIGGER trg_rx_items_updated_at
  BEFORE UPDATE ON prescription_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_rx_treatments_updated_at ON prescription_treatments;
CREATE TRIGGER trg_rx_treatments_updated_at
  BEFORE UPDATE ON prescription_treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_fu_updated_at ON follow_ups;
CREATE TRIGGER trg_fu_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGERS: Audit logging
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_rx ON prescriptions;
CREATE TRIGGER trg_audit_rx
  AFTER INSERT OR UPDATE OR DELETE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_rx_items ON prescription_items;
CREATE TRIGGER trg_audit_rx_items
  AFTER INSERT OR UPDATE OR DELETE ON prescription_items
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

DROP TRIGGER IF EXISTS trg_audit_rx_treatments ON prescription_treatments;
CREATE TRIGGER trg_audit_rx_treatments
  AFTER INSERT OR UPDATE OR DELETE ON prescription_treatments
  FOR EACH ROW EXECUTE FUNCTION log_inventory_audit();

COMMIT;
