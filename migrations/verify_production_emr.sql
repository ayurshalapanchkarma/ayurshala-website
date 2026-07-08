-- ============================================================
-- VERIFICATION SCRIPT FOR PRODUCTION EMR MIGRATION
-- Run this after production_emr.sql to confirm all objects exist
-- ============================================================

-- ============================================================
-- SECTION 1: VERIFY TABLES EXIST AND HAVE REQUIRED COLUMNS
-- ============================================================

-- Check emr_visit table
SELECT 'emr_visit' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_visit' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_visit
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_visit' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_consultation table
SELECT 'emr_consultation' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_consultation' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_consultation
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_consultation' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_ayurvedic_assessment table
SELECT 'emr_ayurvedic_assessment' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_ayurvedic_assessment' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_ayurvedic_assessment
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_ayurvedic_assessment' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_diagnosis table
SELECT 'emr_diagnosis' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_diagnosis' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_diagnosis (MUST have: primary_diagnosis, diagnosis_status)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_diagnosis' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_prescription table
SELECT 'emr_prescription' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_prescription' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_prescription (MUST have: medicines, dosage, duration, special_instructions)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_prescription' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_treatment_plan table (Sprint 5)
SELECT 'emr_treatment_plan' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_treatment_plan' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_treatment_plan
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_treatment_plan' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_therapy_session table (Sprint 5)
SELECT 'emr_therapy_session' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_therapy_session' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_therapy_session
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_therapy_session' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_follow_up table (Sprint 6)
SELECT 'emr_follow_up' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_follow_up' AND table_schema = 'public'
GROUP BY table_name;

-- Verify critical columns in emr_follow_up
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emr_follow_up' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check emr_visit_timeline table
SELECT 'emr_visit_timeline' AS table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'emr_visit_timeline' AND table_schema = 'public'
GROUP BY table_name;

-- ============================================================
-- SECTION 2: VERIFY INDEXES EXIST
-- ============================================================

SELECT 'Index Verification' AS check_name;

SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('emr_visit', 'emr_consultation', 'emr_ayurvedic_assessment', 
                    'emr_diagnosis', 'emr_prescription', 'emr_treatment_plan',
                    'emr_therapy_session', 'emr_follow_up', 'emr_visit_timeline')
ORDER BY tablename, indexname;

-- ============================================================
-- SECTION 3: VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('emr_visit', 'emr_consultation', 'emr_ayurvedic_assessment',
                        'emr_diagnosis', 'emr_prescription', 'emr_treatment_plan',
                        'emr_therapy_session', 'emr_follow_up', 'emr_visit_timeline')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================
-- SECTION 4: VERIFY VIEWS EXIST
-- ============================================================

SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('v_todays_queue', 'v_doctor_queue')
ORDER BY viewname;

-- ============================================================
-- SECTION 5: VERIFY RLS POLICIES
-- ============================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('emr_visit', 'emr_consultation', 'emr_ayurvedic_assessment',
                    'emr_diagnosis', 'emr_prescription', 'emr_treatment_plan',
                    'emr_therapy_session', 'emr_follow_up', 'emr_visit_timeline')
ORDER BY tablename, policyname;

-- ============================================================
-- SECTION 6: COLUMN AVAILABILITY CHECKLIST
-- ============================================================
-- This section lists all expected columns per service

-- EMR_VISIT COLUMN CHECKLIST
SELECT '=== EMR_VISIT COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('uuid'), ('patient_uuid'), ('doctor_uuid'), ('appointment_uuid'),
    ('visit_date'), ('visit_type'), ('chief_complaint'), ('duration_minutes'),
    ('systolic_bp'), ('diastolic_bp'), ('pulse_rate'), ('temperature_c'),
    ('respiratory_rate'), ('spo2'), ('height_cm'), ('weight_kg'), ('bmi'),
    ('vitals_recorded_at'), ('vitals_recorded_by'),
    ('visit_number'), ('checked_in_at'), ('visit_status'),
    ('created_at'), ('updated_at'), ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_visit'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_CONSULTATION COLUMN CHECKLIST
SELECT '=== EMR_CONSULTATION COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('visit_uuid'), ('doctor_uuid'), ('chief_complaint'),
    ('subjective'), ('objective'), ('assessment'), ('plan'),
    ('clinical_examination'), ('additional_notes'),
    ('consultation_status'), ('created_at'), ('updated_at'), ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_consultation'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_AYURVEDIC_ASSESSMENT COLUMN CHECKLIST
SELECT '=== EMR_AYURVEDIC_ASSESSMENT COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('visit_uuid'), ('doctor_uuid'), ('prakriti'), ('vikriti'), ('nadi_description'),
    ('sara_assessment'), ('samhanana_assessment'), ('pramana_assessment'),
    ('satmya_assessment'), ('satva_level'),
    ('ahara_assessment'), ('vyayama_assessment'), ('nidra_assessment'),
    ('nadi_examination'), ('mala_examination'), ('mutra_examination'),
    ('jivha_examination'), ('shabda_examination'), ('sparsha_examination'),
    ('drk_examination'), ('akriti_examination'),
    ('agni_level'), ('ojas_level'), ('assessment_summary'),
    ('assessment_status'), ('created_at'), ('updated_at'), ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_ayurvedic_assessment'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_DIAGNOSIS COLUMN CHECKLIST
SELECT '=== EMR_DIAGNOSIS COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('visit_uuid'), ('doctor_uuid'), ('primary_diagnosis'), ('secondary_diagnoses'),
    ('clinical_notes'), ('diagnosis_status'), ('created_at'), ('updated_at'),
    ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_diagnosis'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_PRESCRIPTION COLUMN CHECKLIST
SELECT '=== EMR_PRESCRIPTION COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('visit_uuid'), ('doctor_uuid'), ('diagnosis_uuid'),
    ('medicines'), ('dosage'), ('duration'), ('special_instructions'), ('pharmacy_notes'),
    ('prescription_status'), ('created_at'), ('updated_at'), ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_prescription'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_TREATMENT_PLAN COLUMN CHECKLIST
SELECT '=== EMR_TREATMENT_PLAN COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('uuid'), ('visit_uuid'), ('doctor_uuid'), ('panchakarma_type'),
    ('total_sessions'), ('session_duration_minutes'), ('frequency'),
    ('start_date'), ('end_date'), ('treatment_objectives'), ('special_precautions'),
    ('treatment_plan_status'), ('created_at'), ('updated_at'), ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_treatment_plan'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_THERAPY_SESSION COLUMN CHECKLIST
SELECT '=== EMR_THERAPY_SESSION COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('visit_uuid'), ('treatment_plan_uuid'), ('session_number'), ('scheduled_date'),
    ('scheduled_time'), ('actual_start_time'), ('actual_end_time'), ('duration_minutes'),
    ('therapist_uuid'), ('therapist_name'), ('oils_medicines_used'), ('quantity'),
    ('temperature'), ('patient_response'), ('observations'), ('complications_if_any'),
    ('follow_up_notes'), ('therapy_session_status'),
    ('created_at'), ('updated_at'), ('created_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_therapy_session'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- EMR_FOLLOW_UP COLUMN CHECKLIST
SELECT '=== EMR_FOLLOW_UP COLUMN CHECKLIST ===' AS checklist;
SELECT
  CASE WHEN col_name IS NOT NULL THEN '✓' ELSE '✗' END AS exists,
  col_name
FROM (
  VALUES
    ('visit_uuid'), ('doctor_uuid'), ('recommended_date'), ('recommended_time'),
    ('follow_up_type'), ('instructions'), ('notes'),
    ('completed_at'), ('completion_notes'), ('follow_up_status'),
    ('created_at'), ('updated_at'), ('created_by'), ('updated_by')
) AS cols(col_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_name = 'emr_follow_up'
  AND ic.column_name = cols.col_name
  AND ic.table_schema = 'public';

-- ============================================================
-- SECTION 7: FINAL SUMMARY
-- ============================================================

SELECT 'EMR Migration Verification Complete' AS status,
       (SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'emr_%') AS tables_found,
       (SELECT COUNT(*) FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name LIKE 'v_%' AND table_name IN ('v_todays_queue', 'v_doctor_queue')) AS views_found;
