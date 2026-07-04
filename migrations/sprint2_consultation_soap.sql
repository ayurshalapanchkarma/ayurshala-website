-- Sprint 2: Consultation & SOAP Notes
-- Adds consultation records linked to visits, with SOAP notes and clinical examination

-- Create enum for consultation status
DO $$ BEGIN
  CREATE TYPE emr_consultation_status AS ENUM ('DRAFT', 'FINALIZED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create consultation table
CREATE TABLE IF NOT EXISTS emr_consultation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  consultation_status emr_consultation_status DEFAULT 'DRAFT',
  
  -- Chief complaint (reference from visit)
  chief_complaint TEXT,
  
  -- SOAP Notes
  subjective TEXT,           -- Patient history, symptoms, duration
  objective TEXT,            -- Clinical findings, examination results
  assessment TEXT,           -- Clinical reasoning, findings summary
  plan TEXT,                 -- Initial treatment outline
  
  -- Clinical examination
  clinical_examination TEXT, -- Physical exam findings
  
  -- Doctor notes
  additional_notes TEXT,     -- Extra observations, flags, concerns
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- At least one SOAP field must be present
  CONSTRAINT check_soap_not_empty CHECK (
    subjective IS NOT NULL OR
    objective IS NOT NULL OR
    assessment IS NOT NULL OR
    plan IS NOT NULL
  )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emr_consultation_visit ON emr_consultation(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_consultation_doctor ON emr_consultation(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_consultation_status ON emr_consultation(consultation_status);
CREATE INDEX IF NOT EXISTS idx_emr_consultation_created ON emr_consultation(created_at DESC);

-- Enable RLS
ALTER TABLE emr_consultation ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Doctors can view and edit their own consultations
CREATE POLICY IF NOT EXISTS "doctor_view_own_consultation" ON emr_consultation
  FOR SELECT USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_insert_consultation" ON emr_consultation
  FOR INSERT WITH CHECK (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_edit_own_consultation" ON emr_consultation
  FOR UPDATE USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- RLS Policy: Reception can view consultations (read-only)
CREATE POLICY IF NOT EXISTS "reception_view_consultation" ON emr_consultation
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- Trigger: Auto-log CONSULTATION_COMPLETED event when consultation finalized
CREATE OR REPLACE FUNCTION emr_trg_consultation_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultation_status = 'FINALIZED' AND OLD.consultation_status = 'DRAFT' THEN
    INSERT INTO emr_visit_timeline (
      visit_uuid, 
      event_type, 
      title, 
      description, 
      actor_uuid, 
      metadata
    ) VALUES (
      NEW.visit_uuid,
      'CONSULTATION_COMPLETED',
      'Consultation Completed',
      'Doctor completed consultation with SOAP notes',
      NEW.updated_by,
      jsonb_build_object(
        'consultation_id', NEW.id,
        'soap_complete', (NEW.subjective IS NOT NULL AND 
                         NEW.objective IS NOT NULL AND 
                         NEW.assessment IS NOT NULL AND 
                         NEW.plan IS NOT NULL)::TEXT
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS emr_consultation_status_changed ON emr_consultation;
CREATE TRIGGER emr_consultation_status_changed
  AFTER UPDATE ON emr_consultation
  FOR EACH ROW
  EXECUTE FUNCTION emr_trg_consultation_finalized();

-- Add CONSULTATION_COMPLETED to event_type enum if not exists
DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE IF NOT EXISTS 'CONSULTATION_COMPLETED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
