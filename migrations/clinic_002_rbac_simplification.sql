-- ============================================================
-- CLINIC-SPECIFIC RBAC SIMPLIFICATION
-- Ayurshala Panchakarma Centre - Single Owner Architecture
-- ============================================================
-- 
-- This setup is optimized for a single-owner clinic:
-- - Dr. Sanjay: System Administrator (full access)
-- - Optional staff: Reception, Therapist, Pharmacist, Doctor
--
-- No enterprise features:
-- - No multi-branch support
-- - No organization hierarchy
-- - No franchise management
-- - No corporate workflows
--
-- ============================================================

BEGIN;

-- ============================================================
-- Extend Profiles Table with Clinic-Specific Fields
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  phone TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  specialty TEXT;  -- For doctors/therapists

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  role_activated_at TIMESTAMPTZ;  -- When this role was activated

-- ============================================================
-- Update RBAC to Clarify Clinic Roles
-- ============================================================
-- The following are now the only valid roles:
-- - ADMIN: Dr. Sanjay (full system access)
-- - DOCTOR: Additional doctors (if they join)
-- - RECEPTION: Reception staff (if hired)
-- - THERAPIST: Therapists (if hired)
-- - PHARMACIST: Pharmacist (if hired)
-- - PATIENT: Self-service portal access

-- Note: The profiles table already has the role constraint.
-- This migration documents the intended usage.

-- ============================================================
-- Policy: Only Dr. Sanjay (ADMIN) can manage users
-- ============================================================
CREATE POLICY IF NOT EXISTS "Only admin can manage users" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND email = 'ayurshalapanchkarma@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND email = 'ayurshalapanchkarma@gmail.com'
    )
  );

-- ============================================================
-- Policy: Doctors can see their own appointments and patients
-- ============================================================
CREATE POLICY IF NOT EXISTS "Doctors can view own appointments" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR role IN ('DOCTOR', 'RECEPTION')
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================
-- Audit: Log role assignments and changes
-- ============================================================
CREATE TABLE IF NOT EXISTS user_role_audit_log (
  uuid                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_role              TEXT,
  new_role              TEXT,
  changed_by            UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  change_reason         TEXT,
  changed_at            TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_role_audit_user ON user_role_audit_log(user_uuid);
CREATE INDEX idx_user_role_audit_date ON user_role_audit_log(changed_at);

-- ============================================================
-- Trigger: Log role changes
-- ============================================================
CREATE OR REPLACE FUNCTION fn_audit_role_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO user_role_audit_log (user_uuid, old_role, new_role, change_reason)
    VALUES (NEW.id, OLD.role, NEW.role, 'Role change');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_profile_role_change ON profiles;
CREATE TRIGGER tr_audit_profile_role_change
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_audit_role_change();

-- ============================================================
-- Initial Setup: Ensure Dr. Sanjay has admin role
-- ============================================================
UPDATE profiles 
SET role = 'ADMIN', updated_at = NOW()
WHERE email = 'ayurshalapanchkarma@gmail.com' AND role != 'ADMIN';

-- ============================================================
-- Documentation: Default Access Matrix
-- ============================================================
-- 
-- ADMIN (Dr. Sanjay):
--   ✓ All modules
--   ✓ Manage users
--   ✓ View reports
--   ✓ Edit settings
--   ✓ Manage billing
--   ✓ View audit logs
-- 
-- DOCTOR:
--   ✓ View own appointments
--   ✓ View patients
--   ✓ Create prescriptions
--   ✓ Write clinical notes
--   ✗ Manage billing
--   ✗ Manage inventory
-- 
-- RECEPTION:
--   ✓ View appointments
--   ✓ Check patient details
--   ✓ Record consultations
--   ✓ Create pharmacy bills
--   ✗ View medical records
--   ✗ Manage inventory
-- 
-- THERAPIST:
--   ✓ View therapy sessions
--   ✓ Record treatment notes
--   ✓ View patients
--   ✗ View medical records
--   ✗ Manage billing
-- 
-- PHARMACIST:
--   ✓ View pharmacy stock
--   ✓ Create pharmacy bills
--   ✓ Record returns
--   ✓ View patients
--   ✗ Manage inventory
--   ✗ Create hospital invoices
-- 
-- PATIENT:
--   ✓ View own bookings
--   ✓ View own bills
--   ✗ View others' data
--   ✗ Create/edit data
--

COMMIT;
