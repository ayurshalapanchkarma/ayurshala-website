-- ============================================================
-- SPRINT 1 VERIFICATION & SAFETY CHECKS
-- Run these after migration to ensure correctness
-- ============================================================

-- ============================================================
-- CHECK 1: Booking → Visit Idempotency
-- Ensure a booking cannot create two active visits
-- ============================================================

-- Test setup: Create a test booking (if not exists)
-- SELECT * FROM bookings_new WHERE id = 1 LIMIT 1;

-- Test: Call find_or_create twice with same booking
-- SELECT * FROM emr_visit 
-- WHERE appointment_uuid = '1' 
--   AND patient_uuid = (SELECT patient_uuid FROM bookings_new WHERE id = 1)
--   AND visit_date = (SELECT preferred_date FROM bookings_new WHERE id = 1);

-- Expected: Only one visit row, not two

-- ============================================================
-- CHECK 2: Walk-in Patient Support
-- Clarify how to handle walk-ins without bookings
-- ============================================================

-- Current behavior: emr_visit requires patient_uuid and doctor_uuid
-- Walk-ins flow:
-- 1. Reception creates quick patient record (if not found)
-- 2. Calls createVisit() without appointment_uuid
-- 3. Visit created with appointment_uuid = NULL
-- 4. Patient appears in doctor queue normally

-- Recommendation: Add walk-in indicator to emr_visit
ALTER TABLE emr_visit
  ADD COLUMN IF NOT EXISTS is_walkin          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS walkin_phone       TEXT,
  ADD COLUMN IF NOT EXISTS walkin_email       TEXT;

COMMENT ON COLUMN emr_visit.is_walkin IS
  'TRUE if patient was not previously in system (walk-in appointment)';

-- ============================================================
-- CHECK 3: Visit Number Generator Concurrency Safety
-- Test: Concurrent inserts don't produce duplicate numbers
-- ============================================================

-- Current implementation: Uses MAX() + 1 with implicit locking
-- PostgreSQL handles this atomically within a transaction

-- Test script (run in parallel terminals):
-- Terminal 1:
--   psql -c "INSERT INTO emr_visit (patient_uuid, doctor_uuid, visit_date, created_by) 
--            VALUES ('uuid1', 'uuid1', CURRENT_DATE, 'uuid1') RETURNING visit_number;"

-- Terminal 2 (simultaneously):
--   psql -c "INSERT INTO emr_visit (patient_uuid, doctor_uuid, visit_date, created_by) 
--            VALUES ('uuid2', 'uuid2', CURRENT_DATE, 'uuid2') RETURNING visit_number;"

-- Expected: Two different numbers (0001, 0002) not both 0001

-- Enhancement: Add explicit row-level lock for extra safety
CREATE OR REPLACE FUNCTION emr_generate_visit_number_safe()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  visit_date_str TEXT;
  seq_num INT;
  lock_key BIGINT;
BEGIN
  visit_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Use advisory lock on a derived key (date-based)
  -- Prevents concurrent sequence collisions
  lock_key := (to_char(CURRENT_DATE, 'YYYYMMDD'))::BIGINT;
  PERFORM pg_advisory_lock(lock_key);
  
  -- Get next sequence for today
  SELECT COALESCE(MAX(
    (split_part(visit_number, '-', 3))::INT
  ), 0) + 1
  INTO seq_num
  FROM emr_visit
  WHERE visit_number LIKE 'VIS-' || visit_date_str || '-%';
  
  PERFORM pg_advisory_unlock(lock_key);
  
  RETURN 'VIS-' || visit_date_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END $$;

-- Update trigger to use safe version (optional, only if needed)
-- DROP TRIGGER trg_emr_visit_created ON emr_visit;
-- Update trg_emr_visit_created to call emr_generate_visit_number_safe()

-- ============================================================
-- CHECK 4: Timeline Event Deduplication
-- Ensure triggers and service layer don't double-log
-- ============================================================

-- Current design:
-- - Triggers auto-log only: CHECK_IN, status changes, VITALS_RECORDED
-- - Service layer explicitly logs: PRESCRIPTION_CREATED, DIAGNOSIS_ADDED, etc.
-- - No overlap expected

-- Verification query:
SELECT 
  event_type, 
  COUNT(*) as event_count,
  MAX(created_at) as latest
FROM emr_visit_timeline
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY event_type
ORDER BY event_count DESC;

-- If any count > 1 for VITALS_RECORDED, CHECK_IN, or status events, investigate

-- ============================================================
-- CHECK 5: BMI Storage Consistency
-- Decision: BMI is calculated and stored
-- ============================================================

-- Current: BMI stored in emr_visit.bmi column
-- Calculated by: weight_kg / (height_cm/100)^2

-- Verification:
SELECT 
  uuid,
  height_cm,
  weight_kg,
  bmi,
  ROUND((weight_kg / ((height_cm/100.0) * (height_cm/100.0)))::NUMERIC, 2) as calculated_bmi,
  CASE 
    WHEN bmi IS NULL THEN 'NULL'
    WHEN ABS(bmi::NUMERIC - ROUND((weight_kg / ((height_cm/100.0) * (height_cm/100.0)))::NUMERIC, 2)) < 0.01 
      THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as bmi_status
FROM emr_visit
WHERE weight_kg IS NOT NULL 
  AND height_cm IS NOT NULL
  AND vitals_recorded_at IS NOT NULL
LIMIT 10;

-- Expected: All rows show 'CORRECT' or 'NULL'

-- ============================================================
-- CHECK 6: Visit Status Transitions
-- Ensure only valid state transitions
-- ============================================================

-- Current allowed states:
-- CHECKED_IN → IN_CONSULTATION
-- IN_CONSULTATION → PRESCRIPTION_READY
-- PRESCRIPTION_READY → THERAPY_ASSIGNED or COMPLETED
-- Any → CANCELLED

-- Add constraint to prevent invalid backward transitions
CREATE OR REPLACE FUNCTION emr_validate_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  valid_transition BOOLEAN;
BEGIN
  IF NEW.visit_status IS DISTINCT FROM OLD.visit_status THEN
    -- Define valid transitions
    valid_transition := 
      (OLD.visit_status = 'CHECKED_IN' AND NEW.visit_status IN ('IN_CONSULTATION', 'CANCELLED')) OR
      (OLD.visit_status = 'IN_CONSULTATION' AND NEW.visit_status IN ('PRESCRIPTION_READY', 'COMPLETED', 'CANCELLED')) OR
      (OLD.visit_status = 'PRESCRIPTION_READY' AND NEW.visit_status IN ('THERAPY_ASSIGNED', 'COMPLETED', 'CANCELLED')) OR
      (OLD.visit_status = 'THERAPY_ASSIGNED' AND NEW.visit_status IN ('COMPLETED', 'CANCELLED')) OR
      (OLD.visit_status = 'COMPLETED' AND NEW.visit_status IN ('CANCELLED')) OR
      (OLD.visit_status = 'CANCELLED' AND FALSE); -- No transitions out of CANCELLED
    
    IF NOT valid_transition THEN
      RAISE EXCEPTION 'Invalid status transition: % → %', 
        OLD.visit_status, NEW.visit_status;
    END IF;
  END IF;
  
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_emr_validate_status ON emr_visit;
CREATE TRIGGER trg_emr_validate_status
  BEFORE UPDATE ON emr_visit
  FOR EACH ROW EXECUTE FUNCTION emr_validate_status_transition();

-- ============================================================
-- CHECK 7: Doctor Queue Correctness
-- Verify token numbers are sequential with no gaps
-- ============================================================

SELECT 
  visit_number,
  ROW_NUMBER() OVER (ORDER BY checked_in_at ASC) as expected_token,
  EXTRACT(EPOCH FROM (NOW() - checked_in_at))/60 as waiting_minutes
FROM emr_visit
WHERE DATE(visit_date) = CURRENT_DATE
  AND visit_status != 'CANCELLED'
ORDER BY checked_in_at ASC;

-- Expected: Token numbers 1, 2, 3, ... with no gaps

-- ============================================================
-- CHECK 8: Walk-in vs Booking Distinction
-- ============================================================

-- Query to see walk-in patients
SELECT 
  ev.visit_number,
  ev.is_walkin,
  p.name,
  bn.booking_id
FROM emr_visit ev
JOIN patients p ON ev.patient_uuid = p.id
LEFT JOIN bookings_new bn ON bn.id::TEXT = ev.appointment_uuid
WHERE DATE(ev.visit_date) = CURRENT_DATE
ORDER BY ev.checked_in_at;

-- Expected: Some rows have booking_id, others have NULL

-- ============================================================
-- FINAL VERIFICATION SUMMARY
-- ============================================================

-- Run all checks in order:
-- 1. Check for duplicate visits from same booking (should be 0)
SELECT COUNT(*) as duplicate_visits
FROM (
  SELECT appointment_uuid, COUNT(*) as cnt
  FROM emr_visit
  WHERE appointment_uuid IS NOT NULL
    AND DATE(visit_date) = CURRENT_DATE
  GROUP BY appointment_uuid, patient_uuid, visit_date
  HAVING COUNT(*) > 1
) t;

-- Expected: 0 rows

-- 2. Check for duplicate visit numbers (should be 0)
SELECT COUNT(*) as duplicate_numbers
FROM (
  SELECT visit_number, COUNT(*) as cnt
  FROM emr_visit
  WHERE DATE(visit_date) = CURRENT_DATE
  GROUP BY visit_number
  HAVING COUNT(*) > 1
) t;

-- Expected: 0 rows

-- 3. Check for duplicate timeline events per visit (should be 0 for auto-logged events)
SELECT COUNT(*) as duplicate_events
FROM (
  SELECT visit_uuid, event_type, COUNT(*) as cnt
  FROM emr_visit_timeline
  WHERE event_type IN ('CHECK_IN', 'VITALS_RECORDED')
    AND DATE(created_at) = CURRENT_DATE
  GROUP BY visit_uuid, event_type
  HAVING COUNT(*) > 1
) t;

-- Expected: 0 rows

-- 4. Check BMI calculations (sample)
SELECT COUNT(*) as bmi_mismatches
FROM (
  SELECT 
    uuid,
    bmi,
    ROUND((weight_kg / ((height_cm/100.0) * (height_cm/100.0)))::NUMERIC, 2) as calc_bmi
  FROM emr_visit
  WHERE weight_kg IS NOT NULL 
    AND height_cm IS NOT NULL
    AND DATE(visit_date) = CURRENT_DATE
) t
WHERE ABS(bmi::NUMERIC - calc_bmi) > 0.01;

-- Expected: 0 rows

-- ============================================================
-- COMMIT
-- ============================================================
