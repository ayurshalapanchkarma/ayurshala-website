-- SQL Integrity Check: Verify Clinical Core Schema
-- Run this against a clean database after applying all migrations
-- Purpose: Detect orphaned records, missing FKs, and data integrity issues

-- 1. Check for visits with missing patient references
SELECT COUNT(*) as orphan_visits
FROM emr_visit
WHERE patient_uuid IS NULL;

-- 2. Check for visits with missing doctor references
SELECT COUNT(*) as visits_no_doctor
FROM emr_visit
WHERE doctor_uuid IS NULL;

-- 3. Check for consultation records not linked to valid visits
SELECT COUNT(*) as orphan_consultations
FROM emr_consultation
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 4. Check for assessment records not linked to valid visits
SELECT COUNT(*) as orphan_assessments
FROM emr_ayurvedic_assessment
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 5. Check for diagnosis records not linked to valid visits
SELECT COUNT(*) as orphan_diagnoses
FROM emr_diagnosis
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 6. Check for prescription records not linked to valid visits
SELECT COUNT(*) as orphan_prescriptions
FROM emr_prescription
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 7. Check for treatment plans not linked to valid visits
SELECT COUNT(*) as orphan_treatment_plans
FROM emr_treatment_plan
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 8. Check for therapy sessions not linked to valid treatment plans
SELECT COUNT(*) as orphan_therapy_sessions
FROM emr_therapy_session
WHERE treatment_plan_uuid NOT IN (SELECT id FROM emr_treatment_plan);

-- 9. Check for follow-ups not linked to valid visits
SELECT COUNT(*) as orphan_follow_ups
FROM emr_follow_up
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 10. Check for timeline events not linked to valid visits
SELECT COUNT(*) as orphan_timeline_events
FROM emr_visit_timeline
WHERE visit_uuid NOT IN (SELECT uuid FROM emr_visit);

-- 11. Verify ONE-TO-ONE constraints (Consultation, Assessment, Diagnosis, Prescription, Treatment Plan)
SELECT 'consultation' as table_name, COUNT(*) as duplicate_count
FROM emr_consultation
GROUP BY visit_uuid
HAVING COUNT(*) > 1
UNION ALL
SELECT 'assessment', COUNT(*)
FROM emr_ayurvedic_assessment
GROUP BY visit_uuid
HAVING COUNT(*) > 1
UNION ALL
SELECT 'diagnosis', COUNT(*)
FROM emr_diagnosis
GROUP BY visit_uuid
HAVING COUNT(*) > 1
UNION ALL
SELECT 'prescription', COUNT(*)
FROM emr_prescription
GROUP BY visit_uuid
HAVING COUNT(*) > 1
UNION ALL
SELECT 'treatment_plan', COUNT(*)
FROM emr_treatment_plan
GROUP BY visit_uuid
HAVING COUNT(*) > 1;

-- 12. Check record counts by status (should show healthy distribution)
SELECT 'visits' as entity, COUNT(*) as total FROM emr_visit
UNION ALL
SELECT 'consultations', COUNT(*) FROM emr_consultation
UNION ALL
SELECT 'assessments', COUNT(*) FROM emr_ayurvedic_assessment
UNION ALL
SELECT 'diagnoses', COUNT(*) FROM emr_diagnosis
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM emr_prescription
UNION ALL
SELECT 'treatment_plans', COUNT(*) FROM emr_treatment_plan
UNION ALL
SELECT 'therapy_sessions', COUNT(*) FROM emr_therapy_session
UNION ALL
SELECT 'follow_ups', COUNT(*) FROM emr_follow_up
UNION ALL
SELECT 'timeline_events', COUNT(*) FROM emr_visit_timeline;

-- 13. Check visit timeline event counts (should have at least CHECK_IN)
SELECT visit_uuid, COUNT(*) as event_count
FROM emr_visit_timeline
GROUP BY visit_uuid
ORDER BY event_count ASC
LIMIT 10;

-- 14. Verify all references to profiles table exist
SELECT COUNT(*) as invalid_doctor_refs
FROM emr_visit
WHERE doctor_uuid IS NOT NULL
  AND doctor_uuid NOT IN (SELECT id FROM profiles);

SELECT COUNT(*) as invalid_created_by
FROM emr_consultation
WHERE created_by NOT IN (SELECT id FROM profiles);

-- 15. Check for data consistency in status fields
SELECT 'DRAFT visits' as check_name, COUNT(*) FROM emr_visit WHERE visit_status = 'DRAFT'
UNION ALL
SELECT 'CHECKED_IN visits', COUNT(*) FROM emr_visit WHERE visit_status = 'CHECKED_IN'
UNION ALL
SELECT 'COMPLETED visits', COUNT(*) FROM emr_visit WHERE visit_status = 'COMPLETED'
UNION ALL
SELECT 'CONSULTATION_DRAFT', COUNT(*) FROM emr_consultation WHERE consultation_status = 'DRAFT'
UNION ALL
SELECT 'CONSULTATION_FINALIZED', COUNT(*) FROM emr_consultation WHERE consultation_status = 'FINALIZED'
UNION ALL
SELECT 'DIAGNOSIS_DRAFT', COUNT(*) FROM emr_diagnosis WHERE diagnosis_status = 'DRAFT'
UNION ALL
SELECT 'DIAGNOSIS_FINALIZED', COUNT(*) FROM emr_diagnosis WHERE diagnosis_status = 'FINALIZED';
