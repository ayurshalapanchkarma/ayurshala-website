-- ============================================================
-- PRODUCTION EMR MIGRATION
-- Final schema matching current application code (Sprints 1-6)
-- Idempotent: Safe to run multiple times
-- ============================================================
-- This migration creates the complete EMR schema used by:
-- - visit.service.ts
-- - consultation.service.ts
-- - ayurvedic-assessment.service.ts
-- - diagnosis-prescription.service.ts
-- - panchakarma.service.ts
-- - follow-up.service.ts
--
-- NOTE: This replaces phase7_clinical_emr.sql with a corrected
-- schema matching the current codebase.
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: emr_visit (Sprint 1 - Base Visit)
-- Stores consultation/visit records with vitals
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_visit (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  patient_uuid UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  appointment_uuid TEXT,
  -- Visit details
  visit_date TIMESTAMP NOT NULL,
  visit_type TEXT,                                     -- OPD, Follow-up, Emergency
  chief_complaint TEXT,
  duration_minutes INTEGER,
  -- Vitals (in table, not jsonb)
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  pulse_rate INTEGER,
  temperature_c NUMERIC(5,2),
  respiratory_rate INTEGER,
  spo2 INTEGER,
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(6,2),
  bmi NUMERIC(5,2),
  vitals_recorded_at TIMESTAMP,
  vitals_recorded_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  -- Auto-generated
  visit_number TEXT UNIQUE,
  checked_in_at TIMESTAMP,
  -- Status
  visit_status TEXT DEFAULT 'CHECKED_IN',              -- CHECKED_IN, IN_CONSULTATION, PRESCRIPTION_READY, THERAPY_ASSIGNED, COMPLETED, CANCELLED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_visit_patient ON emr_visit(patient_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_visit_doctor ON emr_visit(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_visit_date ON emr_visit(visit_date);
CREATE INDEX IF NOT EXISTS idx_emr_visit_uuid ON emr_visit(uuid);
CREATE INDEX IF NOT EXISTS idx_emr_visit_status ON emr_visit(visit_status);

-- ============================================================
-- TABLE: emr_consultation (Sprint 2 - SOAP Notes)
-- Stores SOAP consultation notes linked to visits
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_consultation (
  id BIGSERIAL PRIMARY KEY,
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  -- Chief complaint (copied from visit for record)
  chief_complaint TEXT,
  -- SOAP Notes
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  -- Additional fields
  clinical_examination TEXT,
  additional_notes TEXT,
  -- Status
  consultation_status TEXT DEFAULT 'DRAFT',            -- DRAFT, FINALIZED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_consultation_visit ON emr_consultation(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_consultation_doctor ON emr_consultation(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_consultation_status ON emr_consultation(consultation_status);

-- ============================================================
-- TABLE: emr_ayurvedic_assessment (Sprint 3 - Ayurvedic Assessment)
-- Stores detailed ayurvedic assessment and examinations
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_ayurvedic_assessment (
  id BIGSERIAL PRIMARY KEY,
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  -- Prakriti & Vikriti
  prakriti TEXT,
  vikriti TEXT,
  -- Nadi & Pulse
  nadi_description TEXT,
  -- Pariksha (Examinations) - Sara, Samhanana, Pramana, Satmya, Satva
  sara_assessment TEXT,
  samhanana_assessment TEXT,
  pramana_assessment TEXT,
  satmya_assessment TEXT,
  satva_level TEXT,
  -- Lifestyle Assessment
  ahara_assessment TEXT,
  vyayama_assessment TEXT,
  nidra_assessment TEXT,
  -- Ashtavidha Pariksha (Eight-fold examination)
  nadi_examination TEXT,
  mala_examination TEXT,
  mutra_examination TEXT,
  jivha_examination TEXT,
  shabda_examination TEXT,
  sparsha_examination TEXT,
  drk_examination TEXT,
  akriti_examination TEXT,
  -- Assessment summary
  agni_level TEXT,
  ojas_level TEXT,
  assessment_summary TEXT,
  -- Status
  assessment_status TEXT DEFAULT 'DRAFT',              -- DRAFT, FINALIZED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_assessment_visit ON emr_ayurvedic_assessment(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_assessment_doctor ON emr_ayurvedic_assessment(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_assessment_status ON emr_ayurvedic_assessment(assessment_status);

-- ============================================================
-- TABLE: emr_diagnosis (Sprint 4 - Diagnosis)
-- Stores diagnosis records with primary/secondary support
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_diagnosis (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  -- Diagnosis
  primary_diagnosis TEXT NOT NULL,
  secondary_diagnoses TEXT,
  clinical_notes TEXT,
  -- Status
  diagnosis_status TEXT DEFAULT 'DRAFT',               -- DRAFT, FINALIZED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_visit ON emr_diagnosis(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_doctor ON emr_diagnosis(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_status ON emr_diagnosis(diagnosis_status);

-- ============================================================
-- TABLE: emr_prescription (Sprint 4 - Prescription)
-- Stores prescription records linked to visits
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_prescription (
  id BIGSERIAL PRIMARY KEY,
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  diagnosis_uuid UUID REFERENCES emr_diagnosis(uuid) ON DELETE SET NULL,
  -- Prescription details
  medicines TEXT NOT NULL,
  dosage TEXT,
  duration TEXT,
  special_instructions TEXT,
  pharmacy_notes TEXT,
  -- Status
  prescription_status TEXT DEFAULT 'DRAFT',            -- DRAFT, FINALIZED, DISPENSED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_prescription_visit ON emr_prescription(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_prescription_doctor ON emr_prescription(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_prescription_status ON emr_prescription(prescription_status);

-- ============================================================
-- TABLE: emr_treatment_plan (Sprint 5 - Panchakarma)
-- Stores panchakarma treatment plans
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_treatment_plan (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  -- Plan details
  panchakarma_type TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  session_duration_minutes INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  treatment_objectives TEXT,
  special_precautions TEXT,
  -- Status
  treatment_plan_status TEXT DEFAULT 'DRAFT',          -- DRAFT, ACTIVE, COMPLETED, CANCELLED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_treatment_plan_visit ON emr_treatment_plan(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_treatment_plan_doctor ON emr_treatment_plan(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_treatment_plan_uuid ON emr_treatment_plan(uuid);
CREATE INDEX IF NOT EXISTS idx_emr_treatment_plan_status ON emr_treatment_plan(treatment_plan_status);

-- ============================================================
-- TABLE: emr_therapy_session (Sprint 5 - Panchakarma Sessions)
-- Stores individual therapy session records
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_therapy_session (
  id BIGSERIAL PRIMARY KEY,
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  treatment_plan_uuid UUID NOT NULL REFERENCES emr_treatment_plan(uuid) ON DELETE CASCADE,
  -- Session details
  session_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  duration_minutes INTEGER,
  -- Therapist info
  therapist_uuid UUID REFERENCES doctors(id) ON DELETE SET NULL,
  therapist_name TEXT,
  -- Therapy details
  oils_medicines_used TEXT,
  quantity TEXT,
  temperature TEXT,
  patient_response TEXT,
  observations TEXT,
  complications_if_any TEXT,
  follow_up_notes TEXT,
  -- Status
  therapy_session_status TEXT DEFAULT 'SCHEDULED',     -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_therapy_session_visit ON emr_therapy_session(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_therapy_session_plan ON emr_therapy_session(treatment_plan_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_therapy_session_date ON emr_therapy_session(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_emr_therapy_session_status ON emr_therapy_session(therapy_session_status);

-- ============================================================
-- TABLE: emr_follow_up (Sprint 6 - Follow-up)
-- Stores follow-up appointment records
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_follow_up (
  id BIGSERIAL PRIMARY KEY,
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  doctor_uuid UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  -- Follow-up schedule
  recommended_date DATE NOT NULL,
  recommended_time TIME,
  follow_up_type TEXT NOT NULL,
  instructions TEXT,
  notes TEXT,
  -- Completion tracking
  completed_at TIMESTAMP,
  completion_notes TEXT,
  -- Status
  follow_up_status TEXT DEFAULT 'SCHEDULED',           -- SCHEDULED, COMPLETED, CANCELLED
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emr_follow_up_visit ON emr_follow_up(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_follow_up_doctor ON emr_follow_up(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_follow_up_date ON emr_follow_up(recommended_date);
CREATE INDEX IF NOT EXISTS idx_emr_follow_up_status ON emr_follow_up(follow_up_status);

-- ============================================================
-- TABLE: emr_visit_timeline (Timeline Events)
-- Stores timeline events for visit workflows
-- ============================================================
CREATE TABLE IF NOT EXISTS emr_visit_timeline (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_uuid UUID REFERENCES doctors(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_visit_timeline_visit ON emr_visit_timeline(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_visit_timeline_date ON emr_visit_timeline(created_at);

-- ============================================================
-- VIEW: v_todays_queue (Today's Reception Queue)
-- Used by reception/admin for check-in workflow
-- ============================================================
DROP VIEW IF EXISTS v_todays_queue CASCADE;
CREATE VIEW v_todays_queue AS
SELECT
  ev.uuid AS visit_id,
  ev.visit_number,
  ev.patient_uuid AS patient_id,
  ev.doctor_uuid,
  p.full_name AS patient_name,
  pr.name AS doctor_name,
  p.phone,
  ev.visit_date AS preferred_date,
  ev.visit_status,
  ev.checked_in_at,
  EXTRACT(EPOCH FROM (NOW() - ev.checked_in_at)) / 60 AS waiting_minutes
FROM emr_visit ev
LEFT JOIN patients p ON ev.patient_uuid = p.id
LEFT JOIN doctors pr ON ev.doctor_uuid = pr.id
WHERE DATE(ev.visit_date) = CURRENT_DATE
ORDER BY ev.checked_in_at ASC;

-- ============================================================
-- VIEW: v_doctor_queue (Doctor's Queue for Today)
-- Used by doctors to see their patients waiting
-- ============================================================
DROP VIEW IF EXISTS v_doctor_queue CASCADE;
CREATE VIEW v_doctor_queue AS
SELECT
  ev.uuid AS visit_id,
  ev.visit_number,
  p.full_name AS patient_name,
  ev.patient_uuid AS patient_id,
  p.phone,
  ev.visit_status,
  CASE
    WHEN ev.visit_status = 'CHECKED_IN' THEN 'Waiting'
    WHEN ev.visit_status = 'IN_CONSULTATION' THEN 'In Progress'
    WHEN ev.visit_status = 'PRESCRIPTION_READY' THEN 'Prescription Ready'
    WHEN ev.visit_status = 'THERAPY_ASSIGNED' THEN 'Therapy Assigned'
    WHEN ev.visit_status = 'COMPLETED' THEN 'Completed'
    ELSE ev.visit_status
  END AS status_label,
  EXTRACT(EPOCH FROM (NOW() - ev.checked_in_at)) / 60 AS waiting_minutes,
  ROW_NUMBER() OVER (PARTITION BY ev.doctor_uuid ORDER BY ev.checked_in_at) AS token_number,
  ev.checked_in_at,
  ev.doctor_uuid AS doctor_id
FROM emr_visit ev
LEFT JOIN doctors d ON ev.doctor_uuid = d.id
LEFT JOIN patients p ON ev.patient_uuid = p.id
WHERE DATE(ev.visit_date) = CURRENT_DATE
  AND ev.visit_status IN ('CHECKED_IN', 'IN_CONSULTATION', 'PRESCRIPTION_READY', 'THERAPY_ASSIGNED');

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE emr_visit ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_ayurvedic_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_treatment_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_therapy_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_follow_up ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_visit_timeline ENABLE ROW LEVEL SECURITY;

-- Doctors can access their own patients' visits
DO $$
BEGIN
  CREATE POLICY "Doctors can view own visits" ON emr_visit
    FOR SELECT USING (
      doctor_uuid = auth.uid() 
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can create visits" ON emr_visit
    FOR INSERT WITH CHECK (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can update own visits" ON emr_visit
    FOR UPDATE USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Consultation policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view own consultations" ON emr_consultation
    FOR SELECT USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can manage own consultations" ON emr_consultation
    FOR ALL USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Assessment policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view assessments" ON emr_ayurvedic_assessment
    FOR SELECT USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can manage own assessments" ON emr_ayurvedic_assessment
    FOR ALL USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Diagnosis policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view diagnosis" ON emr_diagnosis
    FOR SELECT USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can manage own diagnosis" ON emr_diagnosis
    FOR ALL USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prescription policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view prescriptions" ON emr_prescription
    FOR SELECT USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can manage own prescriptions" ON emr_prescription
    FOR ALL USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Treatment plan policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view treatment plans" ON emr_treatment_plan
    FOR SELECT USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can manage own treatment plans" ON emr_treatment_plan
    FOR ALL USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Therapy session policies
DO $$
BEGIN
  CREATE POLICY "Staff can view therapy sessions" ON emr_therapy_session
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Staff can manage therapy sessions" ON emr_therapy_session
    FOR ALL USING (
      EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Follow-up policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view follow-ups" ON emr_follow_up
    FOR SELECT USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can manage own follow-ups" ON emr_follow_up
    FOR ALL USING (
      doctor_uuid = auth.uid()
      OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Timeline policies
DO $$
BEGIN
  CREATE POLICY "Doctors can view timelines" ON emr_visit_timeline
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM emr_visit ev
        WHERE ev.uuid = visit_uuid
          AND (ev.doctor_uuid = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Doctors can create timeline events" ON emr_visit_timeline
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM emr_visit ev
        WHERE ev.uuid = visit_uuid
          AND (ev.doctor_uuid = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
