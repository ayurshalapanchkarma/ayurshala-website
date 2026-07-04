-- Sprint 3: Ayurvedic Assessment
-- Adds assessment records linked to visits, with structured Ayurvedic observation fields

-- Create enum for assessment status
DO $$ BEGIN
  CREATE TYPE emr_assessment_status AS ENUM ('DRAFT', 'FINALIZED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create assessment table
CREATE TABLE IF NOT EXISTS emr_ayurvedic_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  assessment_status emr_assessment_status DEFAULT 'DRAFT',
  
  -- Constitution and imbalance
  prakriti TEXT,
  vikriti TEXT,
  
  -- Nadi Pariksha (pulse assessment)
  nadi_description TEXT,
  
  -- Dashavidha Pariksha (10-fold examination)
  sara_assessment TEXT,
  samhanana_assessment TEXT,
  pramana_assessment TEXT,
  satmya_assessment TEXT,
  satva_level TEXT,
  ahara_assessment TEXT,
  vyayama_assessment TEXT,
  nidra_assessment TEXT,
  
  -- Ashtavidha Pariksha (8-fold examination)
  nadi_examination TEXT,
  mala_examination TEXT,
  mutra_examination TEXT,
  jivha_examination TEXT,
  shabda_examination TEXT,
  sparsha_examination TEXT,
  drk_examination TEXT,
  akriti_examination TEXT,
  
  -- Functional assessments
  agni_level TEXT,
  ojas_level TEXT,
  
  -- Summary observations
  assessment_summary TEXT,
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- At least one assessment field must be present
  CONSTRAINT check_assessment_not_empty CHECK (
    prakriti IS NOT NULL OR
    vikriti IS NOT NULL OR
    nadi_description IS NOT NULL OR
    sara_assessment IS NOT NULL OR
    agni_level IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_visit ON emr_ayurvedic_assessment(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_doctor ON emr_ayurvedic_assessment(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_status ON emr_ayurvedic_assessment(assessment_status);
CREATE INDEX IF NOT EXISTS idx_emr_ayurvedic_created ON emr_ayurvedic_assessment(created_at DESC);

-- Enable RLS
ALTER TABLE emr_ayurvedic_assessment ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "doctor_view_own_assessment" ON emr_ayurvedic_assessment
  FOR SELECT USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_insert_assessment" ON emr_ayurvedic_assessment
  FOR INSERT WITH CHECK (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_edit_own_assessment" ON emr_ayurvedic_assessment
  FOR UPDATE USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "reception_view_assessment" ON emr_ayurvedic_assessment
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- Trigger: Auto-log AYURVEDIC_ASSESSMENT_COMPLETED event when assessment finalized
CREATE OR REPLACE FUNCTION emr_trg_assessment_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assessment_status = 'FINALIZED' AND OLD.assessment_status = 'DRAFT' THEN
    INSERT INTO emr_visit_timeline (
      visit_uuid, 
      event_type, 
      title, 
      description, 
      actor_uuid, 
      metadata
    ) VALUES (
      NEW.visit_uuid,
      'AYURVEDIC_ASSESSMENT_COMPLETED',
      'Ayurvedic Assessment Completed',
      'Doctor completed Ayurvedic assessment',
      NEW.updated_by,
      jsonb_build_object('assessment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emr_assessment_status_changed ON emr_ayurvedic_assessment;
CREATE TRIGGER emr_assessment_status_changed
  AFTER UPDATE ON emr_ayurvedic_assessment
  FOR EACH ROW
  EXECUTE FUNCTION emr_trg_assessment_finalized();

-- Add event type to enum if not exists
DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE IF NOT EXISTS 'AYURVEDIC_ASSESSMENT_COMPLETED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
