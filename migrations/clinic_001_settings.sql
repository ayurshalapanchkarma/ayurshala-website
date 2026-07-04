-- ============================================================
-- CLINIC SETTINGS & CONFIGURATION
-- For Ayurshala Panchakarma Centre (Single-Clinic Setup)
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: clinic_settings (Clinic Configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_settings (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key           TEXT        NOT NULL UNIQUE,
  setting_value         TEXT,
  data_type             TEXT,                           -- STRING, NUMBER, BOOLEAN, JSON
  description           TEXT,
  is_system_setting     BOOLEAN     DEFAULT FALSE,      -- Cannot be deleted
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_by            UUID,                           -- Admin who changed it
  is_active             BOOLEAN     DEFAULT TRUE
);

CREATE INDEX idx_clinic_settings_key ON clinic_settings(setting_key);
CREATE INDEX idx_clinic_settings_active ON clinic_settings(is_active);

-- ============================================================
-- TABLE: clinic_info (Primary Clinic Record)
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_info (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name           TEXT        NOT NULL DEFAULT 'Ayurshala – Ayurveda and Panchakarma Center',
  clinic_short_name     TEXT        DEFAULT 'Ayurshala',
  clinic_address        TEXT,
  clinic_city           TEXT,
  clinic_state          TEXT,
  clinic_pincode        TEXT,
  clinic_phone          TEXT,
  clinic_email          TEXT,
  clinic_website        TEXT,
  owner_name            TEXT,                           -- Dr. Sanjay
  owner_title           TEXT,                           -- Dr.
  gst_number            TEXT,                           -- GSTIN
  pan_number            TEXT,
  registration_number   TEXT,                           -- Clinic registration
  license_number        TEXT,
  established_year      INTEGER,
  specialization        TEXT        DEFAULT 'Ayurveda and Panchakarma',
  default_currency      TEXT        DEFAULT 'INR',
  timezone              TEXT        DEFAULT 'Asia/Kolkata',
  invoice_prefix        TEXT        DEFAULT 'INV',
  pharmacy_prefix       TEXT        DEFAULT 'PH',
  receipt_footer_text   TEXT,
  receipt_header_text   TEXT,
  logo_url              TEXT,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_by            UUID
);

-- Only ONE record should exist
CREATE UNIQUE INDEX idx_clinic_info_single ON clinic_info((1)) WHERE true;

-- ============================================================
-- SEED: Initial Clinic Configuration
-- ============================================================
INSERT INTO clinic_info (
  clinic_name,
  clinic_short_name,
  owner_name,
  owner_title,
  specialization,
  receipt_footer_text,
  receipt_header_text
) VALUES (
  'Ayurshala – Ayurveda and Panchakarma Center',
  'Ayurshala',
  'Dr. Sanjay',
  'Dr.',
  'Ayurveda and Panchakarma',
  'Thank you for choosing Ayurshala – Ayurveda and Panchakarma Center',
  'Ayurshala – Ayurveda and Panchakarma Center'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Default Settings
-- ============================================================
INSERT INTO clinic_settings (setting_key, setting_value, data_type, description, is_system_setting) VALUES
  ('clinic.name', 'Ayurshala – Ayurveda and Panchakarma Center', 'STRING', 'Clinic display name', TRUE),
  ('clinic.owner', 'Dr. Sanjay', 'STRING', 'Clinic owner (administrator)', TRUE),
  ('clinic.specialization', 'Ayurveda and Panchakarma', 'STRING', 'Clinic specialization', TRUE),
  ('clinic.gst_registered', 'false', 'BOOLEAN', 'Is clinic GST registered?', FALSE),
  ('currency.default', 'INR', 'STRING', 'Default currency code', TRUE),
  ('invoice.prefix', 'INV', 'STRING', 'Invoice number prefix', FALSE),
  ('pharmacy.prefix', 'PH', 'STRING', 'Pharmacy bill prefix', FALSE),
  ('report.fiscal_year_start', '04-01', 'STRING', 'Fiscal year start date (MM-DD)', FALSE),
  ('system.timezone', 'Asia/Kolkata', 'STRING', 'System timezone', TRUE),
  ('system.language', 'en-IN', 'STRING', 'System language', FALSE),
  ('feature.multi_clinic', 'false', 'BOOLEAN', 'Enable multi-clinic support', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_info ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write clinic settings
CREATE POLICY "Admins can manage clinic settings" ON clinic_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN')
    )
  );

-- Everyone can read clinic info (read-only for non-admins)
CREATE POLICY "Anyone can read clinic info" ON clinic_info
  FOR SELECT USING (true);

CREATE POLICY "Admins can update clinic info" ON clinic_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN')
    )
  );

COMMIT;
