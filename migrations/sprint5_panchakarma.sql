-- Sprint 5: Panchakarma Management
-- Adds treatment plans, therapy sessions, and session recordings linked to visits

-- Create enums
DO $$ BEGIN
  CREATE TYPE emr_treatment_plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE emr_therapy_session_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Treatment Plan table
CREATE TABLE IF NOT EXISTS emr_treatment_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  treatment_plan_status emr_treatment_plan_status DEFAULT 'DRAFT',
  
  -- Treatment plan details
  panchakarma_type TEXT NOT NULL, -- e.g., "Vasti", "Nasya", "Basti", "Shirovasti"
  total_sessions INTEGER NOT NULL,
  session_duration_minutes INTEGER NOT NULL,
  frequency TEXT NOT NULL, -- e.g., "Daily", "Alternate days", "Twice daily"
  start_date DATE,
  end_date DATE,
  treatment_objectives TEXT,
  special_precautions TEXT,
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL
);

-- Therapy Session table
CREATE TABLE IF NOT EXISTS emr_therapy_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  treatment_plan_uuid UUID NOT NULL REFERENCES emr_treatment_plan(id) ON DELETE CASCADE,
  therapy_session_status emr_therapy_session_status DEFAULT 'SCHEDULED',
  
  -- Session details
  session_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Therapist and materials
  therapist_uuid UUID REFERENCES profiles(id) ON DELETE SET NULL,
  therapist_name TEXT,
  oils_medicines_used TEXT,
  quantity TEXT,
  temperature TEXT, -- For oil-based therapies
  
  -- Session observations and response
  patient_response TEXT,
  observations TEXT,
  complications_if_any TEXT,
  follow_up_notes TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plan_visit_uuid ON emr_treatment_plan(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_doctor_uuid ON emr_treatment_plan(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_status ON emr_treatment_plan(treatment_plan_status);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_created_at ON emr_treatment_plan(created_at);

CREATE INDEX IF NOT EXISTS idx_therapy_session_visit_uuid ON emr_therapy_session(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_therapy_session_treatment_plan_uuid ON emr_therapy_session(treatment_plan_uuid);
CREATE INDEX IF NOT EXISTS idx_therapy_session_therapist_uuid ON emr_therapy_session(therapist_uuid);
CREATE INDEX IF NOT EXISTS idx_therapy_session_status ON emr_therapy_session(therapy_session_status);
CREATE INDEX IF NOT EXISTS idx_therapy_session_scheduled_date ON emr_therapy_session(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_therapy_session_created_at ON emr_therapy_session(created_at);

-- RLS policies for treatment_plan
ALTER TABLE emr_treatment_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can create and edit own treatment plans"
  ON emr_treatment_plan
  FOR ALL
  USING (doctor_uuid = auth.uid() OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (doctor_uuid = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Reception can view treatment plans"
  ON emr_treatment_plan
  FOR SELECT
  USING (auth.jwt()->>'role' IN ('reception', 'admin', 'doctor'));

-- RLS policies for therapy_session
ALTER TABLE emr_therapy_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can create and edit own sessions"
  ON emr_therapy_session
  FOR ALL
  USING (therapist_uuid = auth.uid() OR auth.jwt()->>'role' IN ('doctor', 'admin'))
  WITH CHECK (therapist_uuid = auth.uid() OR auth.jwt()->>'role' IN ('doctor', 'admin'));

CREATE POLICY "All staff can view therapy sessions"
  ON emr_therapy_session
  FOR SELECT
  USING (auth.jwt()->>'role' IN ('reception', 'admin', 'doctor', 'therapist'));

-- Add event types to emr_event_type enum if not exists
DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE 'TREATMENT_PLAN_CREATED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE 'THERAPY_SESSION_COMPLETED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE 'TREATMENT_PLAN_COMPLETED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger for treatment plan creation
CREATE OR REPLACE FUNCTION log_treatment_plan_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO emr_visit_timeline (visit_uuid, event_type, title, description, actor_uuid, metadata)
  VALUES (
    NEW.visit_uuid,
    'TREATMENT_PLAN_CREATED'::emr_event_type,
    'Treatment Plan Created',
    'Panchakarma treatment plan: ' || NEW.panchakarma_type || ' (' || NEW.total_sessions || ' sessions)',
    NEW.doctor_uuid,
    jsonb_build_object(
      'panchakarma_type', NEW.panchakarma_type,
      'total_sessions', NEW.total_sessions,
      'frequency', NEW.frequency
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_treatment_plan_created ON emr_treatment_plan;
CREATE TRIGGER trg_treatment_plan_created
AFTER INSERT ON emr_treatment_plan
FOR EACH ROW
EXECUTE FUNCTION log_treatment_plan_created();

-- Trigger for therapy session completion
CREATE OR REPLACE FUNCTION log_therapy_session_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.therapy_session_status != NEW.therapy_session_status AND NEW.therapy_session_status = 'COMPLETED' THEN
    INSERT INTO emr_visit_timeline (visit_uuid, event_type, title, description, actor_uuid, metadata)
    VALUES (
      NEW.visit_uuid,
      'THERAPY_SESSION_COMPLETED'::emr_event_type,
      'Therapy Session Completed',
      'Session ' || NEW.session_number || ' completed',
      COALESCE(NEW.therapist_uuid, NEW.created_by),
      jsonb_build_object(
        'session_number', NEW.session_number,
        'duration_minutes', NEW.duration_minutes,
        'oils_medicines_used', NEW.oils_medicines_used
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_therapy_session_completed ON emr_therapy_session;
CREATE TRIGGER trg_therapy_session_completed
AFTER UPDATE ON emr_therapy_session
FOR EACH ROW
EXECUTE FUNCTION log_therapy_session_completed();

-- Trigger for treatment plan completion
CREATE OR REPLACE FUNCTION log_treatment_plan_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.treatment_plan_status != NEW.treatment_plan_status AND NEW.treatment_plan_status = 'COMPLETED' THEN
    INSERT INTO emr_visit_timeline (visit_uuid, event_type, title, description, actor_uuid, metadata)
    VALUES (
      NEW.visit_uuid,
      'TREATMENT_PLAN_COMPLETED'::emr_event_type,
      'Treatment Plan Completed',
      'Panchakarma treatment plan completed',
      NEW.doctor_uuid,
      jsonb_build_object(
        'panchakarma_type', NEW.panchakarma_type,
        'total_sessions', NEW.total_sessions
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_treatment_plan_completed ON emr_treatment_plan;
CREATE TRIGGER trg_treatment_plan_completed
AFTER UPDATE ON emr_treatment_plan
FOR EACH ROW
EXECUTE FUNCTION log_treatment_plan_completed();
