-- Phase 6: Panchakarma Treatment Execution
-- Treatment Plans, Sessions, Therapists, Rooms, Inventory Consumption

-- Enums
CREATE TYPE treatment_plan_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE treatment_session_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');
CREATE TYPE therapist_role AS ENUM ('PRIMARY', 'ASSISTANT', 'CONSULTANT');
CREATE TYPE room_type AS ENUM ('MASSAGE_ROOM', 'STEAM_ROOM', 'PROCEDURE_ROOM', 'CONSULTATION_ROOM');

-- Therapists
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(100),
  license_number VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rooms
CREATE TABLE treatment_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(20) NOT NULL UNIQUE,
  room_type room_type NOT NULL,
  capacity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  remarks TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatment Recipes
CREATE TABLE treatment_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recipe Items (what's used per session)
CREATE TABLE treatment_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES treatment_recipes(id),
  product_id UUID NOT NULL REFERENCES inventory_products(id),
  quantity_per_session NUMERIC(10, 2) NOT NULL,
  unit_id UUID NOT NULL REFERENCES inventory_units(id),
  is_mandatory BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_quantity CHECK (quantity_per_session > 0)
);

-- Treatment Plans (from prescriptions)
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_number VARCHAR(20) NOT NULL UNIQUE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id),
  prescription_treatment_id UUID,
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL,
  treatment_name VARCHAR(100) NOT NULL,
  sessions_planned INTEGER NOT NULL,
  sessions_completed INTEGER DEFAULT 0,
  frequency VARCHAR(50) NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status treatment_plan_status DEFAULT 'PLANNED',
  special_instructions TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_sessions CHECK (sessions_completed <= sessions_planned)
);

-- Treatment Sessions
CREATE TABLE treatment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id),
  session_number INTEGER NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status treatment_session_status DEFAULT 'SCHEDULED',
  room_id UUID NOT NULL REFERENCES treatment_rooms(id),
  primary_therapist_id UUID NOT NULL REFERENCES therapists(id),
  assistant_therapist_id UUID REFERENCES therapists(id),
  therapist_notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_times CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)
);

-- Session Items (oil, powder, consumables used)
CREATE TABLE treatment_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES treatment_sessions(id),
  product_id UUID NOT NULL REFERENCES inventory_products(id),
  quantity_used NUMERIC(10, 2) NOT NULL,
  unit_id UUID NOT NULL REFERENCES inventory_units(id),
  batch_id UUID REFERENCES inventory_batches(id),
  is_from_recipe BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_quantity CHECK (quantity_used > 0)
);

-- Treatment Progress (per patient per plan)
CREATE TABLE treatment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES treatment_sessions(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  pain_score_before INTEGER CHECK (pain_score_before BETWEEN 0 AND 10),
  pain_score_after INTEGER CHECK (pain_score_after BETWEEN 0 AND 10),
  mobility_score INTEGER CHECK (mobility_score BETWEEN 0 AND 100),
  weight_kg NUMERIC(5, 2),
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  pulse_rate INTEGER,
  remarks TEXT,
  side_effects TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatment Notes
CREATE TABLE treatment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id),
  note_type VARCHAR(50) NOT NULL,
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_therapists_updated_at BEFORE UPDATE ON therapists FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_treatment_rooms_updated_at BEFORE UPDATE ON treatment_rooms FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_treatment_recipes_updated_at BEFORE UPDATE ON treatment_recipes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_treatment_sessions_updated_at BEFORE UPDATE ON treatment_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_treatment_progress_updated_at BEFORE UPDATE ON treatment_progress FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Indices
CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_doctor ON treatment_plans(doctor_id);
CREATE INDEX idx_treatment_plans_prescription ON treatment_plans(prescription_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_sessions_plan ON treatment_sessions(treatment_plan_id);
CREATE INDEX idx_treatment_sessions_date ON treatment_sessions(session_date);
CREATE INDEX idx_treatment_sessions_therapist ON treatment_sessions(primary_therapist_id);
CREATE INDEX idx_treatment_sessions_room ON treatment_sessions(room_id);
CREATE INDEX idx_treatment_sessions_status ON treatment_sessions(status);
CREATE INDEX idx_treatment_progress_session ON treatment_progress(session_id);
CREATE INDEX idx_treatment_progress_patient ON treatment_progress(patient_id);
CREATE INDEX idx_treatment_notes_plan ON treatment_notes(treatment_plan_id);
