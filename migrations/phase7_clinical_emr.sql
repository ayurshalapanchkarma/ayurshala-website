-- ============================================================
-- PHASE 7: CLINICAL ERP & AYURVEDIC EMR
-- Namespace: emr_* (Electronic Medical Record)
-- Namespace: ref_* (Reference data)
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: emr_patient_medical_record (Core EMR)
-- ============================================================
CREATE TABLE emr_patient_medical_record (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  -- Basic medical info
  blood_type            TEXT,
  rhesus_factor         TEXT,
  -- Ayurvedic constitution
  prakriti_type         TEXT,                           -- Vata, Pitta, Kapha, Dual, Tridosha
  -- Current medical status
  allergies             TEXT[],                         -- Array of allergies
  chronic_conditions    TEXT[],                         -- Array of chronic conditions
  previous_surgeries    TEXT,
  current_medications   TEXT[],
  family_medical_history TEXT,
  -- Lifestyle
  occupation            TEXT,
  diet_type             TEXT,                           -- Vegetarian, Non-veg, Mixed
  exercise_frequency    TEXT,
  sleep_pattern         TEXT,
  stress_level          TEXT,                           -- Low, Medium, High
  -- Contacts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  -- Record management
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES profiles(id),
  updated_by            UUID        REFERENCES profiles(id),
  is_active             BOOLEAN     DEFAULT TRUE
);

CREATE INDEX idx_emr_patient ON emr_patient_medical_record(patient_uuid);

-- ============================================================
-- TABLE: emr_visit (Consultation/Visit Records)
-- ============================================================
CREATE TABLE emr_visit (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_uuid           UUID        NOT NULL REFERENCES profiles(id),
  appointment_uuid      UUID        REFERENCES appointments(id),
  -- Visit details
  visit_date            DATE        NOT NULL,
  visit_time            TIME        NOT NULL,
  visit_type            TEXT,                           -- OPD, Follow-up, Emergency
  chief_complaint       TEXT,
  duration_minutes      INTEGER,
  -- Vitals
  temperature_celsius   NUMERIC(5,2),
  heart_rate            INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  respiratory_rate      INTEGER,
  weight_kg             NUMERIC(6,2),
  height_cm             NUMERIC(5,1),
  -- Status
  visit_status          TEXT        DEFAULT 'COMPLETED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by            UUID        REFERENCES profiles(id)
);

CREATE INDEX idx_emr_visit_patient ON emr_visit(patient_uuid);
CREATE INDEX idx_emr_visit_doctor ON emr_visit(doctor_uuid);
CREATE INDEX idx_emr_visit_date ON emr_visit(visit_date);

-- ============================================================
-- TABLE: emr_ayurvedic_assessment (Ayurvedic Assessments)
-- ============================================================
CREATE TABLE emr_ayurvedic_assessment (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid           UUID        NOT NULL REFERENCES profiles(id),
  assessment_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  -- Prakriti (Constitutional type)
  prakriti_vata_score   INTEGER,                        -- 0-100
  prakriti_pitta_score  INTEGER,
  prakriti_kapha_score  INTEGER,
  prakriti_dominant     TEXT,
  -- Vikriti (Current imbalance)
  vikriti_vata_score    INTEGER,                        -- 0-100
  vikriti_pitta_score   INTEGER,
  vikriti_kapha_score   INTEGER,
  vikriti_dominant      TEXT,
  vikriti_severity      TEXT,                           -- Mild, Moderate, Severe
  -- Nadi Pariksha (Pulse assessment)
  nadi_quality          TEXT,
  nadi_rate             INTEGER,
  nadi_findings         TEXT,
  -- Other Pariksha (Examinations)
  tongue_examination    TEXT,
  skin_condition        TEXT,
  eye_examination       TEXT,
  nail_condition        TEXT,
  -- Ashtavidha Pariksha (Eight-fold examination)
  nadi_pariksha         TEXT,
  mala_pariksha         TEXT,
  mutra_pariksha        TEXT,
  jihva_pariksha        TEXT,
  shabda_pariksha       TEXT,
  sparsha_pariksha      TEXT,
  drika_pariksha        TEXT,
  akriti_pariksha       TEXT,
  -- Assessment notes
  clinical_observations TEXT,
  assessment_summary    TEXT,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_assessment_patient ON emr_ayurvedic_assessment(patient_uuid);
CREATE INDEX idx_emr_assessment_visit ON emr_ayurvedic_assessment(visit_uuid);

-- ============================================================
-- TABLE: emr_diagnosis (Diagnosis)
-- ============================================================
CREATE TABLE emr_diagnosis (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  -- Diagnosis
  ayurvedic_diagnosis   TEXT        NOT NULL,
  icd_code              TEXT,
  severity              TEXT,                           -- Mild, Moderate, Severe
  -- Classification
  dosha_involvement     TEXT[],                         -- [Vata, Pitta, Kapha]
  dhatu_involvement     TEXT[],
  mala_involvement      TEXT[],
  -- Treatment approach
  recommended_treatment TEXT,
  contraindications     TEXT,
  -- Status
  is_primary            BOOLEAN     DEFAULT TRUE,
  diagnosis_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_by            UUID        REFERENCES profiles(id),
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_diagnosis_patient ON emr_diagnosis(patient_uuid);
CREATE INDEX idx_emr_diagnosis_visit ON emr_diagnosis(visit_uuid);

-- ============================================================
-- TABLE: emr_prescription (Prescription Header)
-- ============================================================
CREATE TABLE emr_prescription (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid           UUID        NOT NULL REFERENCES profiles(id),
  -- Prescription details
  prescription_number   TEXT        NOT NULL UNIQUE,
  prescription_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  prescription_type     TEXT,                           -- MEDICINE, THERAPY, DIET, LIFESTYLE
  -- Status
  prescription_status   TEXT        DEFAULT 'ACTIVE',   -- ACTIVE, COMPLETED, CANCELLED
  validity_days         INTEGER,
  -- Notes
  special_instructions  TEXT,
  follow_up_date        DATE,
  follow_up_days        INTEGER,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_prescription_patient ON emr_prescription(patient_uuid);
CREATE INDEX idx_emr_prescription_number ON emr_prescription(prescription_number);
CREATE INDEX idx_emr_prescription_status ON emr_prescription(prescription_status);

-- ============================================================
-- TABLE: emr_prescription_item (Prescription Line Items)
-- ============================================================
CREATE TABLE emr_prescription_item (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_uuid     UUID        NOT NULL REFERENCES emr_prescription(uuid) ON DELETE CASCADE,
  item_type             TEXT,                           -- MEDICINE, THERAPY, DIET, LIFESTYLE
  -- Medicine details
  medicine_name         TEXT,
  dosage                TEXT,
  frequency             TEXT,
  duration_days         INTEGER,
  -- Therapy details
  therapy_name          TEXT,
  therapy_duration_minutes INTEGER,
  therapy_frequency     TEXT,
  -- Diet/Lifestyle recommendations
  recommendation        TEXT,
  -- Links
  product_uuid          UUID        REFERENCES inv_products(uuid),
  -- Status
  is_completed          BOOLEAN     DEFAULT FALSE,
  completed_date        DATE,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_prescription_item_prescription ON emr_prescription_item(prescription_uuid);

-- ============================================================
-- TABLE: emr_treatment_plan (Treatment Plan)
-- ============================================================
CREATE TABLE emr_treatment_plan (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  diagnosis_uuid        UUID        NOT NULL REFERENCES emr_diagnosis(uuid) ON DELETE CASCADE,
  -- Plan details
  treatment_plan_number TEXT        NOT NULL UNIQUE,
  plan_start_date       DATE        NOT NULL,
  plan_end_date         DATE,
  -- Treatment phases
  total_phases          INTEGER,
  phase_duration_days   INTEGER,
  -- Objectives
  treatment_objectives  TEXT,
  expected_outcome      TEXT,
  -- Links
  prescription_uuid     UUID        REFERENCES emr_prescription(uuid),
  -- Monitoring
  review_frequency      TEXT,
  monitoring_parameters TEXT[],
  -- Status
  plan_status           TEXT        DEFAULT 'ACTIVE',   -- ACTIVE, COMPLETED, ABANDONED
  created_by            UUID        REFERENCES profiles(id),
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_treatment_plan_patient ON emr_treatment_plan(patient_uuid);

-- ============================================================
-- TABLE: emr_follow_up (Follow-up Management)
-- ============================================================
CREATE TABLE emr_follow_up (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  -- Follow-up schedule
  scheduled_date        DATE        NOT NULL,
  scheduled_time        TIME,
  follow_up_reason      TEXT,
  follow_up_type        TEXT,                           -- Review, Progress Check, Reassessment
  -- Status
  follow_up_status      TEXT        DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, MISSED, CANCELLED
  completed_date        DATE,
  -- Notes
  notes                 TEXT,
  created_by            UUID        REFERENCES profiles(id),
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_follow_up_patient ON emr_follow_up(patient_uuid);
CREATE INDEX idx_emr_follow_up_date ON emr_follow_up(scheduled_date);

-- ============================================================
-- TABLE: emr_clinical_note (Clinical Notes)
-- ============================================================
CREATE TABLE emr_clinical_note (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid           UUID        NOT NULL REFERENCES profiles(id),
  -- Note
  note_type             TEXT,                           -- SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN, FOLLOW_UP
  note_content          TEXT,
  -- Attachments
  attachments           TEXT[],
  -- Status
  is_confidential        BOOLEAN     DEFAULT FALSE,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_clinical_note_patient ON emr_clinical_note(patient_uuid);

-- ============================================================
-- TABLE: emr_investigation (Investigation Records)
-- ============================================================
CREATE TABLE emr_investigation (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  -- Investigation details
  investigation_type    TEXT,                           -- LAB, IMAGING, PATHOLOGY, CUSTOM
  investigation_name    TEXT,
  test_date             DATE,
  result_date           DATE,
  -- Results
  result_value          TEXT,
  result_status         TEXT,                           -- NORMAL, ABNORMAL, PENDING
  result_unit           TEXT,
  reference_range       TEXT,
  -- Interpretation
  interpretation        TEXT,
  -- File
  result_file_url       TEXT,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_investigation_patient ON emr_investigation(patient_uuid);

-- ============================================================
-- REFERENCE TABLES
-- ============================================================

-- Prakriti Types
CREATE TABLE ref_prakriti_types (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT        NOT NULL UNIQUE,
  description           TEXT,
  characteristics       TEXT[],
  is_active             BOOLEAN     DEFAULT TRUE
);

-- Ayurvedic Diagnoses Reference
CREATE TABLE ref_ayurvedic_diagnoses (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_code        TEXT        NOT NULL UNIQUE,
  diagnosis_name        TEXT        NOT NULL,
  description           TEXT,
  dosha_involvement     TEXT[],
  dhatu_involvement     TEXT[],
  typical_treatment     TEXT,
  is_active             BOOLEAN     DEFAULT TRUE
);

-- ============================================================
-- SEED: Reference Data
-- ============================================================

-- Prakriti Types
INSERT INTO ref_prakriti_types (name, description, characteristics) VALUES
  ('Vata', 'Air and Space', ARRAY['Quick', 'Light', 'Irregular', 'Dry', 'Mobile']),
  ('Pitta', 'Fire and Water', ARRAY['Sharp', 'Hot', 'Intense', 'Penetrating', 'Oily']),
  ('Kapha', 'Water and Earth', ARRAY['Slow', 'Heavy', 'Stable', 'Cold', 'Wet']),
  ('Vata-Pitta', 'Dual Constitution', ARRAY['Variable', 'Sharp', 'Active', 'Quick', 'Dry']),
  ('Pitta-Kapha', 'Dual Constitution', ARRAY['Sharp', 'Stable', 'Heavy', 'Hot', 'Wet']),
  ('Vata-Kapha', 'Dual Constitution', ARRAY['Mobile', 'Heavy', 'Cold', 'Variable', 'Stable']),
  ('Tridosha', 'Balanced Constitution', ARRAY['Balanced', 'Moderate', 'Resilient', 'Adaptive'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE emr_patient_medical_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_visit ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_ayurvedic_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_prescription_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_treatment_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_follow_up ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_clinical_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_investigation ENABLE ROW LEVEL SECURITY;

-- Doctors can access their own patients' EMR
CREATE POLICY "Doctors can view own patients" ON emr_patient_medical_record
  FOR SELECT USING (
    auth.uid() IN (
      SELECT doctor_uuid FROM appointments 
      WHERE patient_id = patient_uuid
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Admins can access all EMR
CREATE POLICY "Admins can manage EMR" ON emr_patient_medical_record
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Similar policies for other tables (following same pattern)
CREATE POLICY "Doctor access to visits" ON emr_visit
  FOR SELECT USING (
    doctor_uuid = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

COMMIT;
