-- Sprint 6: Follow-up & Clinical Timeline
-- Adds follow-up scheduling and unified clinical timeline view

-- Create enums
DO $$ BEGIN
  CREATE TYPE emr_follow_up_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Follow-up table
CREATE TABLE IF NOT EXISTS emr_follow_up (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  follow_up_status emr_follow_up_status DEFAULT 'SCHEDULED',
  
  -- Follow-up details
  recommended_date DATE NOT NULL,
  recommended_time TIME,
  follow_up_type TEXT NOT NULL, -- e.g., "Post-treatment review", "Progress assessment", "Maintenance"
  instructions TEXT,
  notes TEXT,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_visit_uuid ON emr_follow_up(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_follow_up_doctor_uuid ON emr_follow_up(doctor_uuid);
CREATE INDEX IF NOT EXISTS idx_follow_up_status ON emr_follow_up(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_follow_up_recommended_date ON emr_follow_up(recommended_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_created_at ON emr_follow_up(created_at);

-- RLS policies for follow_up
ALTER TABLE emr_follow_up ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can create and edit own follow-ups"
  ON emr_follow_up
  FOR ALL
  USING (doctor_uuid = auth.uid() OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (doctor_uuid = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Reception and doctors can view follow-ups"
  ON emr_follow_up
  FOR SELECT
  USING (auth.jwt()->>'role' IN ('reception', 'admin', 'doctor'));

-- Add event types to emr_event_type enum if not exists
DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE 'FOLLOW_UP_SCHEDULED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE emr_event_type ADD VALUE 'FOLLOW_UP_COMPLETED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger for follow-up scheduling
CREATE OR REPLACE FUNCTION log_follow_up_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO emr_visit_timeline (visit_uuid, event_type, title, description, actor_uuid, metadata)
  VALUES (
    NEW.visit_uuid,
    'FOLLOW_UP_SCHEDULED'::emr_event_type,
    'Follow-up Scheduled',
    'Follow-up scheduled for ' || NEW.recommended_date || ': ' || NEW.follow_up_type,
    NEW.doctor_uuid,
    jsonb_build_object(
      'follow_up_type', NEW.follow_up_type,
      'recommended_date', NEW.recommended_date,
      'instructions', NEW.instructions
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_follow_up_scheduled ON emr_follow_up;
CREATE TRIGGER trg_follow_up_scheduled
AFTER INSERT ON emr_follow_up
FOR EACH ROW
EXECUTE FUNCTION log_follow_up_scheduled();

-- Trigger for follow-up completion
CREATE OR REPLACE FUNCTION log_follow_up_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.follow_up_status != NEW.follow_up_status AND NEW.follow_up_status = 'COMPLETED' THEN
    INSERT INTO emr_visit_timeline (visit_uuid, event_type, title, description, actor_uuid, metadata)
    VALUES (
      NEW.visit_uuid,
      'FOLLOW_UP_COMPLETED'::emr_event_type,
      'Follow-up Completed',
      'Follow-up completed: ' || NEW.follow_up_type,
      NEW.doctor_uuid,
      jsonb_build_object(
        'follow_up_type', NEW.follow_up_type,
        'completed_at', NEW.completed_at,
        'completion_notes', NEW.completion_notes
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_follow_up_completed ON emr_follow_up;
CREATE TRIGGER trg_follow_up_completed
AFTER UPDATE ON emr_follow_up
FOR EACH ROW
EXECUTE FUNCTION log_follow_up_completed();
