-- Create discharge_summaries table
CREATE TABLE IF NOT EXISTS discharge_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT,
  booking_id UUID,
  doctor_name TEXT,
  patient_uhid TEXT,
  patient_name TEXT,
  age TEXT,
  sex TEXT,
  doa_date DATE,
  doa_time TIME,
  dod_date DATE,
  dod_time TIME,
  nationality TEXT,
  address TEXT,
  diagnosis TEXT,
  complaints JSONB,
  history_present_complaints TEXT,
  history_days TEXT,
  past_history_medical TEXT,
  past_history_surgical TEXT,
  past_history_details TEXT,
  medication_administered TEXT,
  day_of_therapy TEXT,
  pradhan_vedna JSONB,
  vitals_bp TEXT,
  vitals_hr TEXT,
  vitals_nadi TEXT,
  oe_mala TEXT,
  oe_mutra TEXT,
  oe_jihwa TEXT,
  oe_shuda TEXT,
  oe_nidra TEXT,
  therapies JSONB,
  investigations TEXT,
  findings_discharge TEXT,
  condition_discharge TEXT,
  advice_discharge TEXT,
  medicine_discharge TEXT,
  medicines JSONB,
  cautions TEXT,
  pathya TEXT,
  apathya TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view all discharge summaries
CREATE POLICY "Admins can view discharge summaries" ON discharge_summaries
  FOR SELECT USING (true);

-- Policy: Admin can insert discharge summaries
CREATE POLICY "Admins can insert discharge summaries" ON discharge_summaries
  FOR INSERT WITH CHECK (true);

-- Create unique constraint on booking_id for upsert
ALTER TABLE discharge_summaries ADD CONSTRAINT unique_booking_id UNIQUE (booking_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discharge_patient_id ON discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_booking_id ON discharge_summaries(booking_id);
CREATE INDEX IF NOT EXISTS idx_discharge_created_at ON discharge_summaries(created_at);
