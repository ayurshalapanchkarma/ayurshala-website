-- ============================================================
-- AYURSHALA FINAL SCHEMA MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run on existing DB — preserves all existing data
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'PAYMENT_PENDING','PENDING_CONFIRMATION','CONFIRMED',
    'IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM (
    'PENDING','SUCCESS','FAILED','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('ONLINE','CASH_ON_ARRIVAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consultation_mode AS ENUM ('IN_CLINIC','VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_enum AS ENUM ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE availability_status AS ENUM ('AVAILABLE','UNAVAILABLE','LEAVE','HOLIDAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('EMAIL','WHATSAPP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_source_enum AS ENUM (
    'GOOGLE','DIRECT','INSTAGRAM','FACEBOOK','REFERRAL','WHATSAPP','WALK_IN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── CLINICS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_code   TEXT UNIQUE NOT NULL,
  clinic_name   TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  country       TEXT DEFAULT 'India',
  phone         TEXT,
  email         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the one clinic
INSERT INTO clinics (clinic_code, clinic_name, address, city, state, phone, email)
VALUES ('AYC-001','Ayurshala Panchakarma Center','SP-28, Wajidpur, Sector-130','Noida','Uttar Pradesh','+91-9821224767','ayurshalapanchkarma@gmail.com')
ON CONFLICT (clinic_code) DO NOTHING;

-- ── TREATMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_code    TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  description       TEXT,
  duration_minutes  INT DEFAULT 60,
  advance_amount    INT DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO treatments (treatment_code, name, slug, advance_amount) VALUES
  ('TRT-001','Consultation',       'consultation',        500),
  ('TRT-002','Shirodhara',         'shirodhara',          1000),
  ('TRT-003','Abhyanga',           'abhyanga',            1000),
  ('TRT-004','Swedana',            'swedana',             1000),
  ('TRT-005','Vamana',             'vamana',              1000),
  ('TRT-006','Virechana',          'virechana',           1000),
  ('TRT-007','Basti',              'basti',               1000),
  ('TRT-008','Nasya',              'nasya',               1000),
  ('TRT-009','Raktamokshana',      'raktamokshana',       1000),
  ('TRT-010','Kati Basti',         'kati-basti',          1000),
  ('TRT-011','Greeva Basti',       'greeva-basti',        1000),
  ('TRT-012','Janu Basti',         'janu-basti',          1000),
  ('TRT-013','Shiro Basti',        'shiro-basti',         1000),
  ('TRT-014','Uro Basti',          'uro-basti',           1000),
  ('TRT-015','Shiro Taila Dhara',  'shiro-taila-dhara',   1000),
  ('TRT-016','Nasya Dhoompana',    'nasya-dhoompana',     1000),
  ('TRT-017','Karan Purana',       'karan-purana',        1000),
  ('TRT-018','Anuvasana Basti',    'anuvasana-basti',     1000),
  ('TRT-019','PRP Therapy',        'prp-therapy',         1000),
  ('TRT-020','Regeneration Medicine','regeneration-medicine',1000)
ON CONFLICT (treatment_code) DO NOTHING;

-- ── DOCTORS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_code     TEXT UNIQUE NOT NULL,
  clinic_id       UUID REFERENCES clinics(id),
  name            TEXT NOT NULL,
  specialization  TEXT,
  qualification   TEXT,
  email           TEXT,
  phone           TEXT,
  profile_photo   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ADMIN CREDENTIALS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_credentials (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_credentials (email, password_hash) 
VALUES ('ayurshalapanchkarma@gmail.com', '$2b$10$rDVt7fJcCrMZEIGWjZJJaORSyVWPT.ynwKUKzPD2LYxCHUKQ5L7D.') 
ON CONFLICT (email) DO NOTHING;

ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON admin_credentials
  USING (false) WITH CHECK (false);

-- ── SYSTEM SETTINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            BIGSERIAL PRIMARY KEY,
  setting_key   TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL
);

INSERT INTO settings (setting_key, setting_value) VALUES
  ('consultation_fee',              '500'),
  ('therapy_advance_fee',           '1000'),
  ('max_booking_days',              '90'),
  ('appointment_buffer_minutes',    '30'),
  ('clinic_start_time',             '10:00'),
  ('clinic_end_time',               '19:00'),
  ('whatsapp_enabled',              'false'),
  ('email_enabled',                 'true'),
  ('slot_max_capacity',             '5'),
  ('cancellation_window_hours',     '24'),
  ('clinic_closed_day',             '5')   -- 5 = Friday
ON CONFLICT (setting_key) DO NOTHING;

-- ── PATIENTS — add missing columns to existing table ─────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS dob                     DATE,
  ADD COLUMN IF NOT EXISTS gender                  TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emergency_contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted              BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ;

-- ── BOOKINGS (new canonical table, old 'bookings' kept as-is) ─
CREATE TABLE IF NOT EXISTS bookings_new (
  id                  BIGSERIAL PRIMARY KEY,
  booking_id          TEXT UNIQUE NOT NULL DEFAULT '',
  clinic_id           UUID REFERENCES clinics(id),
  patient_uuid        UUID NOT NULL,
  doctor_uuid         UUID,
  booking_type        TEXT NOT NULL CHECK (booking_type IN ('consultation','therapy')),
  booking_source      booking_source_enum DEFAULT 'DIRECT',
  consultation_mode   consultation_mode DEFAULT 'IN_CLINIC',
  preferred_date      DATE NOT NULL,
  preferred_time      TEXT NOT NULL,
  concern             TEXT DEFAULT '',
  status              booking_status DEFAULT 'PAYMENT_PENDING',
  payment_status      TEXT DEFAULT 'PENDING',
  payment_method      TEXT DEFAULT 'ONLINE',
  is_rescheduled      BOOLEAN DEFAULT FALSE,
  old_date            DATE,
  old_time            TEXT,
  new_date            DATE,
  new_time            TEXT,
  rescheduled_at      TIMESTAMPTZ,
  is_deleted          BOOLEAN DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate booking_id: AYB-YYYY-000001
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  yr   TEXT := to_char(NOW(), 'YYYY');
  seq  INT;
BEGIN
  IF NEW.booking_id IS NULL OR NEW.booking_id = '' THEN
    SELECT COALESCE(MAX(
      CASE WHEN booking_id ~ ('^AYB-' || yr || '-\d+$')
      THEN (split_part(booking_id, '-', 3))::INT ELSE 0 END
    ), 0) + 1 INTO seq FROM bookings_new;
    NEW.booking_id := 'AYB-' || yr || '-' || lpad(seq::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_booking_id ON bookings_new;
CREATE TRIGGER trg_booking_id
  BEFORE INSERT ON bookings_new
  FOR EACH ROW EXECUTE FUNCTION generate_booking_id();

-- ── BOOKING_TREATMENTS (new, refs treatments table) ──────────
CREATE TABLE IF NOT EXISTS booking_treatments_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uuid    BIGINT NOT NULL,
  treatment_uuid  UUID REFERENCES treatments(id),
  treatment_name  TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPOINTMENT SLOTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointment_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_uuid   UUID,
  slot_date     DATE NOT NULL,
  slot_time     TEXT NOT NULL,
  max_capacity  INT DEFAULT 5,
  booked_count  INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  UNIQUE(doctor_uuid, slot_date, slot_time)
);

-- ── DOCTOR AVAILABILITY ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_uuid     UUID,
  available_date  DATE NOT NULL,
  start_time      TEXT,
  end_time        TEXT,
  status          availability_status DEFAULT 'AVAILABLE',
  UNIQUE(doctor_uuid, available_date)
);

-- ── HOLIDAYS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holidays (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_name  TEXT NOT NULL,
  holiday_date  DATE UNIQUE NOT NULL,
  clinic_id     UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYMENTS (add new columns only if they don't exist) ──────
DO $$ BEGIN ALTER TABLE payments ADD COLUMN payment_method TEXT DEFAULT 'ONLINE'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payments ADD COLUMN paid_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── INVOICES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT UNIQUE NOT NULL DEFAULT '',
  booking_uuid    BIGINT,
  payment_uuid    UUID,
  amount          INT NOT NULL,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  yr  TEXT := to_char(NOW(), 'YYYY');
  seq INT;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    SELECT COALESCE(MAX(
      CASE WHEN invoice_number ~ ('^INV-' || yr || '-\d+$')
      THEN (split_part(invoice_number, '-', 3))::INT ELSE 0 END
    ), 0) + 1 INTO seq FROM invoices;
    NEW.invoice_number := 'INV-' || yr || '-' || lpad(seq::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_invoice_number ON invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ── PRESCRIPTIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uuid        BIGINT,
  doctor_uuid         UUID,
  prescription_text   TEXT,
  pdf_url             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── DOCTOR NOTES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uuid BIGINT,
  doctor_uuid  UUID,
  note_type    TEXT CHECK (note_type IN ('INTERNAL','PATIENT_VISIBLE')) DEFAULT 'INTERNAL',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── FOLLOW-UPS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uuid    BIGINT,
  patient_uuid    UUID,
  doctor_uuid     UUID,
  followup_date   DATE,
  followup_time   TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOG ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointment_audit (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uuid  BIGINT,
  patient_uuid  UUID,
  action        TEXT NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  performed_by  UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid        UUID,
  booking_uuid        BIGINT,
  notification_type   TEXT NOT NULL,
  channel             notification_channel NOT NULL,
  subject             TEXT,
  message             TEXT,
  status              TEXT DEFAULT 'PENDING',
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONSENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid  UUID,
  consent_type  TEXT NOT NULL,
  accepted      BOOLEAN DEFAULT FALSE,
  accepted_at   TIMESTAMPTZ,
  ip_address    TEXT
);

-- ── WAITLIST ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_uuid    UUID,
  desired_date    DATE,
  desired_time    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_patient      ON bookings_new(patient_uuid);
CREATE INDEX IF NOT EXISTS idx_bookings_date         ON bookings_new(preferred_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings_new(status);
CREATE INDEX IF NOT EXISTS idx_bookings_is_deleted   ON bookings_new(is_deleted);
CREATE INDEX IF NOT EXISTS idx_patients_email        ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_phone        ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id   ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_booking         ON appointment_audit(booking_uuid);
CREATE INDEX IF NOT EXISTS idx_audit_patient         ON appointment_audit(patient_uuid);
CREATE INDEX IF NOT EXISTS idx_slots_date            ON appointment_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_uuid);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE bookings_new           ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_treatments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents           ENABLE ROW LEVEL SECURITY;

-- RLS policies: all DB access uses service role key via API routes (bypasses RLS).
-- Enable RLS on new tables only — no patient-facing direct DB access.
-- payments RLS: managed via service role key in API routes

-- doctor_notes RLS: managed via service role key in API routes

-- ── updated_at auto-trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings_new;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings_new
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
