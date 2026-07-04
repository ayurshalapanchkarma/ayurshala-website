-- Sprint 4: Diagnosis & Prescription
-- Adds diagnosis and prescription records linked to visits

-- Create enums
DO $$ BEGIN
  CREATE TYPE emr_diagnosis_status AS ENUM ('DRAFT', 'FINALIZED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE emr_prescription_status AS ENUM ('DRAFT', 'FINALIZED', 'DISPENSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Diagnosis table
CREATE TABLE IF NOT EXISTS emr_diagnosis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  diagnosis_status emr_diagnosis_status DEFAULT 'DRAFT',
  
  -- Diagnosis information
  primary_diagnosis TEXT NOT NULL,
  secondary_diagnoses TEXT,
  clinical_notes TEXT,
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL
);

-- Prescription table
CREATE TABLE IF NOT EXISTS emr_prescription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  diagnosis_uuid UUID REFERENCES emr_diagnosis(id) ON DELETE SET NULL,
  prescription_status emr_prescription_status DEFAULT 'DRAFT',
  
  -- Prescription information
  medicines TEXT NOT NULL,
  dosage TEXT,
  duration TEXT,
  special_instructions TEXT,
  pharmacy_notes TEXT,
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_visit ON emr_diagnosis(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_doctor ON emr_diagnosis(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_status ON emr_diagnosis(diagnosis_status);
CREATE INDEX IF NOT EXISTS idx_emr_diagnosis_created ON emr_diagnosis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emr_prescription_visit ON emr_prescription(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_prescription_doctor ON emr_prescription(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_emr_prescription_status ON emr_prescription(prescription_status);
CREATE INDEX IF NOT EXISTS idx_emr_prescription_created ON emr_prescription(created_at DESC);

-- Enable RLS
ALTER TABLE emr_diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr_prescription ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Diagnosis
CREATE POLICY IF NOT EXISTS "doctor_view_own_diagnosis" ON emr_diagnosis
  FOR SELECT USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_insert_diagnosis" ON emr_diagnosis
  FOR INSERT WITH CHECK (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_edit_own_diagnosis" ON emr_diagnosis
  FOR UPDATE USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "reception_view_diagnosis" ON emr_diagnosis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- RLS Policies: Prescription
CREATE POLICY IF NOT EXISTS "doctor_view_own_prescription" ON emr_prescription
  FOR SELECT USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_insert_prescription" ON emr_prescription
  FOR INSERT WITH CHECK (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "doctor_edit_own_prescription" ON emr_prescription
  FOR UPDATE USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY IF NOT EXISTS "reception_view_prescription" ON emr_prescription
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- Trigger: Auto-log DIAGNOSIS_FINALIZED event
CREATE OR REPLACE FUNCTION emr_trg_diagnosis_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.diagnosis_status = 'FINALIZED' AND OLD.diagnosis_status = 'DRAFT' THEN
    INSERT INTO emr_visit_timeline (
      visit_uuid, event_type, title, description, actor_uuid, metadata
    ) VALUES (
      NEW.visit_uuid,
      'DIAGNOSIS_FINALIZED',
      'Diagnosis Finalized',
      'Doctor finalized diagnosis: ' || NEW.primary_diagnosis,
      NEW.updated_by,
      jsonb_build_object('diagnosis_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emr_diagnosis_status_changed ON emr_diagnosis;
CREATE TRIGGER emr_diagnosis_status_changed
  AFTER UPDATE ON emr_diagnosis
  FOR EACH ROW
  EXECUTE FUNCTION emr_trg_diagnosis_finalized();

-- Trigger: Auto-log PRESCRIPTION_CREATED event
CREATE OR REPLACE FUNCTION emr_trg_prescription_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prescription_status = 'FINALIZED' AND OLD.prescription_status = 'DRAFT' THEN
    INSERT INTO emr_visit_timeline (
      visit_uuid, event_type, title, description, actor_uuid, metadata
    ) VALUES (
      NEW.visit_uuid,
      'PRESCRIPTION_CREATED',
      'Prescription Created',
      'Doctor created prescription',
      NEW.updated_by,
      jsonb_build_object('prescription_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emr_prescription_status_changed ON emr_prescription;
CREATE TRIGGER emr_prescription_status_changed
  AFTER UPDATE ON emr_prescription
  FOR EACH ROW
  EXECUTE FUNCTION emr_trg_prescription_finalized();

-- Add event types to enum
DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE IF NOT EXISTS 'DIAGNOSIS_FINALIZED';
  ALTER TYPE emr_event_type ADD VALUE IF NOT EXISTS 'PRESCRIPTION_CREATED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
