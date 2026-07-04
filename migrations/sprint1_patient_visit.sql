-- ============================================================
-- SPRINT 1: PATIENT VISIT EMR
-- Namespace: emr_visit (extended), emr_visit_timeline (new)
-- 
-- Core functionality:
-- - Extend emr_visit with vitals and visit number
-- - Generic event timeline (JSONB metadata)
-- - Daily visit number generation
-- - Doctor queue support
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: CREATE ENUMS
-- ============================================================

-- Visit Status Enum
DO $$ BEGIN
  CREATE TYPE emr_visit_status AS ENUM (
    'CHECKED_IN',
    'IN_CONSULTATION',
    'PRESCRIPTION_READY',
    'THERAPY_ASSIGNED',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Event Type Enum
DO $$ BEGIN
  CREATE TYPE emr_event_type AS ENUM (
    'CHECK_IN',
    'VITALS_RECORDED',
    'CONSULTATION_STARTED',
    'CONSULTATION_COMPLETED',
    'ASSESSMENT_COMPLETED',
    'DIAGNOSIS_ADDED',
    'PRESCRIPTION_CREATED',
    'PHARMACY_DISPENSED',
    'BILL_GENERATED',
    'THERAPY_ASSIGNED',
    'FOLLOWUP_CREATED',
    'VISIT_COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 2: EXTEND emr_visit TABLE
-- ============================================================

-- Add missing columns to emr_visit if they don't exist
ALTER TABLE emr_visit
  ADD COLUMN IF NOT EXISTS visit_number          TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS visit_status          emr_visit_status DEFAULT 'CHECKED_IN',
  ADD COLUMN IF NOT EXISTS checked_in_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at          TIMESTAMPTZ,
  -- Vitals (single recording per visit)
  ADD COLUMN IF NOT EXISTS systolic_bp           INTEGER,
  ADD COLUMN IF NOT EXISTS diastolic_bp          INTEGER,
  ADD COLUMN IF NOT EXISTS pulse_rate            INTEGER,
  ADD COLUMN IF NOT EXISTS temperature_c         NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS respiratory_rate      INTEGER,
  ADD COLUMN IF NOT EXISTS spo2                  INTEGER,
  ADD COLUMN IF NOT EXISTS height_cm             NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS weight_kg             NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS bmi                   NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS vitals_recorded_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vitals_recorded_by    UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS notes                 TEXT;

-- Create indexes for visit_number and status
CREATE INDEX IF NOT EXISTS idx_emr_visit_number 
  ON emr_visit(visit_number);

CREATE INDEX IF NOT EXISTS idx_emr_visit_status 
  ON emr_visit(visit_status);

CREATE INDEX IF NOT EXISTS idx_emr_visit_date_status 
  ON emr_visit(visit_date, visit_status);

CREATE INDEX IF NOT EXISTS idx_emr_visit_checked_in 
  ON emr_visit(checked_in_at DESC) 
  WHERE checked_in_at IS NOT NULL;

-- ============================================================
-- STEP 3: CREATE VISIT TIMELINE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS emr_visit_timeline (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid            UUID        NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  event_type            emr_event_type NOT NULL,
  title                 TEXT        NOT NULL,
  description           TEXT,
  actor_uuid            UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  metadata              JSONB       DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE emr_visit_timeline IS
  'Generic event log for all visit events. Metadata JSONB allows extensibility without schema changes.';

COMMENT ON COLUMN emr_visit_timeline.metadata IS
  'JSONB for event-specific data. Examples:
   CHECK_IN: {"checked_in_by": "receptionist_name"}
   VITALS_RECORDED: {"temperature": 98.6, "pulse": 72}
   PRESCRIPTION_CREATED: {"rx_count": 5}
   PHARMACY_DISPENSED: {"bill_id": "...", "amount": 5000}';

CREATE INDEX IF NOT EXISTS idx_emr_timeline_visit 
  ON emr_visit_timeline(visit_uuid);

CREATE INDEX IF NOT EXISTS idx_emr_timeline_event_type 
  ON emr_visit_timeline(event_type);

CREATE INDEX IF NOT EXISTS idx_emr_timeline_created 
  ON emr_visit_timeline(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emr_timeline_actor 
  ON emr_visit_timeline(actor_uuid);

-- ============================================================
-- STEP 4: VISIT NUMBER GENERATOR FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION emr_generate_visit_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  visit_date_str TEXT;
  seq_num INT;
BEGIN
  -- Format: VIS-YYYYMMDD-0001
  visit_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get next sequence for today
  SELECT COALESCE(MAX(
    (split_part(visit_number, '-', 3))::INT
  ), 0) + 1
  INTO seq_num
  FROM emr_visit
  WHERE visit_number LIKE 'VIS-' || visit_date_str || '-%';
  
  RETURN 'VIS-' || visit_date_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END $$;

-- ============================================================
-- STEP 5: TRIGGERS FOR AUTOMATIC TIMELINE LOGGING
-- ============================================================

-- Trigger: Auto-log CHECK_IN event when visit created
CREATE OR REPLACE FUNCTION emr_trg_visit_created()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.visit_number IS NULL THEN
    NEW.visit_number := emr_generate_visit_number();
  END IF;
  
  IF NEW.checked_in_at IS NULL THEN
    NEW.checked_in_at := NOW();
  END IF;
  
  -- Auto-create CHECK_IN timeline entry
  INSERT INTO emr_visit_timeline (
    visit_uuid,
    event_type,
    title,
    description,
    actor_uuid,
    metadata
  ) VALUES (
    NEW.uuid,
    'CHECK_IN',
    'Patient Checked In',
    'Reception check-in completed',
    NEW.created_by,
    jsonb_build_object('clinic_id', (SELECT clinic_id FROM bookings_new WHERE id::TEXT = CAST(NEW.uuid AS TEXT) LIMIT 1))
  );
  
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_emr_visit_created ON emr_visit;
CREATE TRIGGER trg_emr_visit_created
  BEFORE INSERT ON emr_visit
  FOR EACH ROW EXECUTE FUNCTION emr_trg_visit_created();

-- Trigger: Auto-log status changes
CREATE OR REPLACE FUNCTION emr_trg_visit_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  event_type_map TEXT;
  title_text TEXT;
BEGIN
  IF NEW.visit_status IS DISTINCT FROM OLD.visit_status THEN
    -- Map status to event type
    CASE NEW.visit_status
      WHEN 'IN_CONSULTATION' THEN
        event_type_map := 'CONSULTATION_STARTED';
        title_text := 'Consultation Started';
        NEW.consultation_started_at := NOW();
      WHEN 'CONSULTATION_COMPLETED' THEN
        event_type_map := 'CONSULTATION_COMPLETED';
        title_text := 'Consultation Completed';
        NEW.consultation_completed_at := NOW();
      WHEN 'COMPLETED' THEN
        event_type_map := 'VISIT_COMPLETED';
        title_text := 'Visit Completed';
        NEW.completed_at := NOW();
      WHEN 'CANCELLED' THEN
        event_type_map := 'VISIT_COMPLETED'; -- Reuse for cancelled
        title_text := 'Visit Cancelled';
        NEW.completed_at := NOW();
      ELSE
        event_type_map := NULL;
    END CASE;
    
    IF event_type_map IS NOT NULL THEN
      INSERT INTO emr_visit_timeline (
        visit_uuid,
        event_type,
        title,
        description,
        actor_uuid,
        metadata
      ) VALUES (
        NEW.uuid,
        event_type_map::emr_event_type,
        title_text,
        'Status changed from ' || OLD.visit_status || ' to ' || NEW.visit_status,
        NEW.updated_by,
        jsonb_build_object('old_status', OLD.visit_status, 'new_status', NEW.visit_status)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_emr_visit_status_changed ON emr_visit;
CREATE TRIGGER trg_emr_visit_status_changed
  BEFORE UPDATE ON emr_visit
  FOR EACH ROW EXECUTE FUNCTION emr_trg_visit_status_changed();

-- Trigger: Auto-log VITALS_RECORDED event
CREATE OR REPLACE FUNCTION emr_trg_vitals_recorded()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.pulse_rate IS DISTINCT FROM OLD.pulse_rate
      OR NEW.systolic_bp IS DISTINCT FROM OLD.systolic_bp
      OR NEW.temperature_c IS DISTINCT FROM OLD.temperature_c)
     AND NEW.vitals_recorded_at IS NOT NULL
     AND OLD.vitals_recorded_at IS NULL THEN
    
    INSERT INTO emr_visit_timeline (
      visit_uuid,
      event_type,
      title,
      description,
      actor_uuid,
      metadata
    ) VALUES (
      NEW.uuid,
      'VITALS_RECORDED',
      'Vitals Recorded',
      'Patient vitals captured',
      NEW.vitals_recorded_by,
      jsonb_build_object(
        'systolic_bp', NEW.systolic_bp,
        'diastolic_bp', NEW.diastolic_bp,
        'pulse', NEW.pulse_rate,
        'temperature_c', NEW.temperature_c,
        'spo2', NEW.spo2,
        'weight_kg', NEW.weight_kg,
        'height_cm', NEW.height_cm,
        'bmi', NEW.bmi
      )
    );
  END IF;
  
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_emr_vitals_recorded ON emr_visit;
CREATE TRIGGER trg_emr_vitals_recorded
  BEFORE UPDATE ON emr_visit
  FOR EACH ROW EXECUTE FUNCTION emr_trg_vitals_recorded();

-- ============================================================
-- STEP 6: RLS POLICIES
-- ============================================================

ALTER TABLE emr_visit_timeline ENABLE ROW LEVEL SECURITY;

-- Doctors can view timeline for their patients
CREATE POLICY "Doctor can view patient visit timeline" ON emr_visit_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emr_visit ev
      WHERE ev.uuid = emr_visit_timeline.visit_uuid
      AND ev.doctor_uuid = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Reception can view timeline for check-in workflows
CREATE POLICY "Reception can view timeline" ON emr_visit_timeline
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- Only system/service role can insert timeline events
CREATE POLICY "Service layer can log events" ON emr_visit_timeline
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SERVICE'))
    OR auth.uid() = actor_uuid
  );

-- ============================================================
-- STEP 7: VIEWS FOR COMMON QUERIES
-- ============================================================

-- Today's Queue (for reception and doctors)
CREATE OR REPLACE VIEW v_todays_queue AS
SELECT
  ev.uuid AS visit_id,
  ev.visit_number,
  ev.checked_in_at,
  ev.visit_status,
  p.id AS patient_id,
  p.name AS patient_name,
  p.phone,
  prof.id AS doctor_id,
  prof.name AS doctor_name,
  bn.preferred_date,
  bn.preferred_time,
  EXTRACT(MINUTE FROM (NOW() - ev.checked_in_at)) AS waiting_minutes,
  (ROW_NUMBER() OVER (ORDER BY ev.checked_in_at))::INT AS token_number
FROM emr_visit ev
JOIN patients p ON ev.patient_uuid = p.id
JOIN profiles prof ON ev.doctor_uuid = prof.id
LEFT JOIN bookings_new bn ON bn.patient_uuid = p.id 
  AND bn.preferred_date = ev.visit_date
WHERE DATE(ev.visit_date) = CURRENT_DATE
  AND ev.visit_status != 'CANCELLED'
ORDER BY ev.checked_in_at ASC;

-- Doctor's queue for today
CREATE OR REPLACE VIEW v_doctor_queue AS
SELECT
  ev.uuid AS visit_id,
  ev.visit_number,
  ev.checked_in_at,
  ev.visit_status,
  p.id AS patient_id,
  p.name AS patient_name,
  p.phone,
  bn.preferred_time,
  EXTRACT(MINUTE FROM (NOW() - ev.checked_in_at))::INT AS waiting_minutes,
  (ROW_NUMBER() OVER (PARTITION BY ev.doctor_uuid ORDER BY ev.checked_in_at))::INT AS token_number,
  CASE
    WHEN ev.visit_status = 'CHECKED_IN' THEN 'Waiting'
    WHEN ev.visit_status = 'IN_CONSULTATION' THEN 'In Progress'
    WHEN ev.visit_status = 'PRESCRIPTION_READY' THEN 'Ready for Pharmacy'
    WHEN ev.visit_status = 'THERAPY_ASSIGNED' THEN 'Therapy Assigned'
    WHEN ev.visit_status = 'COMPLETED' THEN 'Completed'
    ELSE ev.visit_status
  END AS status_label
FROM emr_visit ev
JOIN patients p ON ev.patient_uuid = p.id
LEFT JOIN bookings_new bn ON bn.patient_uuid = p.id 
  AND bn.preferred_date = ev.visit_date
WHERE DATE(ev.visit_date) = CURRENT_DATE
  AND ev.visit_status != 'CANCELLED'
ORDER BY ev.checked_in_at ASC;

-- ============================================================
-- STEP 8: HELPER FUNCTIONS
-- ============================================================

-- Calculate BMI if height and weight provided
CREATE OR REPLACE FUNCTION emr_calculate_bmi(height_cm NUMERIC, weight_kg NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  height_m NUMERIC;
BEGIN
  IF height_cm IS NULL OR weight_kg IS NULL OR height_cm = 0 THEN
    RETURN NULL;
  END IF;
  height_m := height_cm / 100.0;
  RETURN ROUND((weight_kg / (height_m * height_m))::NUMERIC, 2);
END $$;

-- Get visit with related data
CREATE OR REPLACE FUNCTION emr_get_visit_with_patient(p_visit_uuid UUID)
RETURNS TABLE (
  visit_id UUID,
  visit_number TEXT,
  visit_date DATE,
  patient_id UUID,
  patient_name TEXT,
  doctor_id UUID,
  doctor_name TEXT,
  visit_status TEXT,
  checked_in_at TIMESTAMPTZ,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  pulse_rate INTEGER,
  temperature_c NUMERIC,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  bmi NUMERIC
) LANGUAGE sql STABLE AS $$
SELECT
  ev.uuid,
  ev.visit_number,
  ev.visit_date,
  p.id,
  p.name,
  prof.id,
  prof.name,
  ev.visit_status::TEXT,
  ev.checked_in_at,
  ev.systolic_bp,
  ev.diastolic_bp,
  ev.pulse_rate,
  ev.temperature_c,
  ev.weight_kg,
  ev.height_cm,
  ev.bmi
FROM emr_visit ev
JOIN patients p ON ev.patient_uuid = p.id
JOIN profiles prof ON ev.doctor_uuid = prof.id
WHERE ev.uuid = p_visit_uuid;
$$;

-- ============================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION emr_generate_visit_number() IS
  'Generates daily visit numbers in format VIS-YYYYMMDD-0001. Resets each day.';

COMMENT ON FUNCTION emr_calculate_bmi(NUMERIC, NUMERIC) IS
  'Calculates BMI from height (cm) and weight (kg). Returns NULL if invalid.';

COMMENT ON VIEW v_todays_queue IS
  'All patients checked in today. Used by reception and admin dashboard.';

COMMENT ON VIEW v_doctor_queue IS
  'Filtered queue for a specific doctor today. Includes token numbers and waiting time.';

-- ============================================================
-- COMMIT
-- ============================================================

COMMIT;
