# Production EMR Migration Guide

**Date:** July 8, 2026  
**Status:** Ready for Production Deployment  
**Replaces:** `phase7_clinical_emr.sql` (old, incompatible schema)

---

## Overview

This migration deploys the complete Electronic Medical Record (EMR) schema required by the current application codebase (Sprints 1-6). It is **idempotent** (safe to run multiple times) and includes all tables, indexes, views, and RLS policies needed for the clinical EMR system.

### Key Difference from phase7_clinical_emr.sql

The old migration (`phase7_clinical_emr.sql`) defined a schema that **does not match** the current TypeScript services. This new migration is derived directly from analyzing:

- `lib/emr/visit.service.ts`
- `lib/emr/consultation.service.ts`
- `lib/emr/ayurvedic-assessment.service.ts`
- `lib/emr/diagnosis-prescription.service.ts`
- `lib/emr/panchakarma.service.ts`
- `lib/emr/follow-up.service.ts`

**Do not** execute the old migration. Use this production migration instead.

---

## Database Schema

### Tables Created (9 Total)

#### 1. **emr_visit** (Sprint 1 - Base Visit)
Core visit/consultation record with vitals tracking.

**Key Columns:**
- `uuid, patient_uuid, doctor_uuid, appointment_uuid`
- `visit_date, visit_type, chief_complaint, duration_minutes`
- **Vitals:** `systolic_bp, diastolic_bp, pulse_rate, temperature_c, respiratory_rate, spo2, height_cm, weight_kg, bmi`
- `vitals_recorded_at, vitals_recorded_by`
- `visit_number, checked_in_at, visit_status` (CHECKED_IN, IN_CONSULTATION, PRESCRIPTION_READY, THERAPY_ASSIGNED, COMPLETED, CANCELLED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `patient, doctor, date, uuid, status`

---

#### 2. **emr_consultation** (Sprint 2 - SOAP Notes)
Stores one consultation (SOAP notes) per visit.

**Key Columns:**
- `visit_uuid` (UNIQUE - one per visit)
- `doctor_uuid`
- **SOAP Fields:** `subjective, objective, assessment, plan`
- `chief_complaint, clinical_examination, additional_notes`
- `consultation_status` (DRAFT, FINALIZED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `visit, doctor, status`

---

#### 3. **emr_ayurvedic_assessment** (Sprint 3 - Ayurvedic Assessment)
Detailed ayurvedic evaluation and examinations.

**Key Columns:**
- `visit_uuid` (UNIQUE - one per visit)
- `doctor_uuid`
- **Constitutional:** `prakriti, vikriti, nadi_description`
- **Pariksha (Examinations):**
  - Sara, Samhanana, Pramana, Satmya, Satva assessments
  - Ahara, Vyayama, Nidra assessments
  - Ashtavidha (8-fold): nadi, mala, mutra, jivha, shabda, sparsha, drk, akriti examinations
- **Summary:** `agni_level, ojas_level, assessment_summary`
- `assessment_status` (DRAFT, FINALIZED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `visit, doctor, status`

---

#### 4. **emr_diagnosis** (Sprint 4 - Diagnosis)
Diagnosis records with primary/secondary support.

**Key Columns:**
- `visit_uuid` (UNIQUE - one per visit)
- `doctor_uuid`
- **Diagnosis:** `primary_diagnosis` (required), `secondary_diagnoses, clinical_notes`
- `diagnosis_status` (DRAFT, FINALIZED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `visit, doctor, status`

---

#### 5. **emr_prescription** (Sprint 4 - Prescription)
Prescription records linked to diagnosis and visits.

**Key Columns:**
- `visit_uuid` (UNIQUE - one per visit)
- `doctor_uuid`
- `diagnosis_uuid` (optional reference)
- **Prescription:** `medicines` (required), `dosage, duration, special_instructions, pharmacy_notes`
- `prescription_status` (DRAFT, FINALIZED, DISPENSED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `visit, doctor, status`

---

#### 6. **emr_treatment_plan** (Sprint 5 - Panchakarma)
Treatment/Panchakarma plan records.

**Key Columns:**
- `uuid, visit_uuid, doctor_uuid`
- **Plan Details:** `panchakarma_type` (required), `total_sessions` (required), `session_duration_minutes` (required), `frequency` (required)
- `start_date, end_date`
- `treatment_objectives, special_precautions`
- `treatment_plan_status` (DRAFT, ACTIVE, COMPLETED, CANCELLED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `visit, doctor, uuid, status`

---

#### 7. **emr_therapy_session** (Sprint 5 - Panchakarma Sessions)
Individual therapy session records under a treatment plan.

**Key Columns:**
- `visit_uuid, treatment_plan_uuid`
- **Session:** `session_number` (required), `scheduled_date` (required), `scheduled_time`
- **Timing:** `actual_start_time, actual_end_time, duration_minutes`
- **Therapist:** `therapist_uuid, therapist_name`
- **Details:** `oils_medicines_used, quantity, temperature`
- **Observations:** `patient_response, observations, complications_if_any, follow_up_notes`
- `therapy_session_status` (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- **Audit:** `created_at, updated_at, created_by`

**Indexes:** `visit, plan, date, status`

---

#### 8. **emr_follow_up** (Sprint 6 - Follow-up)
Follow-up appointment scheduling and tracking.

**Key Columns:**
- `visit_uuid, doctor_uuid`
- **Schedule:** `recommended_date` (required), `recommended_time`
- `follow_up_type` (required)
- `instructions, notes`
- **Completion:** `completed_at, completion_notes`
- `follow_up_status` (SCHEDULED, COMPLETED, CANCELLED)
- **Audit:** `created_at, updated_at, created_by, updated_by`

**Indexes:** `visit, doctor, date, status`

---

#### 9. **emr_visit_timeline**
Timeline events for visit workflows (audit trail).

**Key Columns:**
- `uuid, visit_uuid`
- `event_type, title, description`
- `actor_uuid, metadata` (JSONB)
- `created_at`

**Indexes:** `visit, date`

---

### Views Created (2 Total)

#### 1. **v_todays_queue**
Reception/admin view for today's patient queue.

**Columns:** `visit_id, visit_number, patient_id, doctor_id, patient_name, doctor_name, phone, preferred_date, visit_status, checked_in_at, waiting_minutes`

**Used by:** Reception/Admin for check-in workflow

---

#### 2. **v_doctor_queue**
Doctor's view of their queue for today.

**Columns:** `visit_id, visit_number, patient_name, patient_id, phone, visit_status, status_label, waiting_minutes, token_number, checked_in_at, doctor_id`

**Used by:** Doctors to see patients waiting

---

## Deployment Instructions

### Step 1: Backup Current Database
```bash
# If using Supabase CLI:
supabase db pull > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Execute Migration in Supabase
**Via Supabase Dashboard:**
1. Go to: SQL Editor → New Query
2. Copy entire contents of `migrations/production_emr.sql`
3. Paste into query editor
4. Click "Run"
5. Confirm execution completed without errors

**Via Supabase CLI:**
```bash
psql -h db.supabase.co -U postgres -d postgres < migrations/production_emr.sql
```

**Via Terminal (if Vercel Preview deployed):**
```bash
cd ~/Documents/ayurshala-website
npx supabase db push
```

### Step 3: Verify Migration
Run the verification script in Supabase SQL Editor:
```bash
1. Copy contents of `migrations/verify_production_emr.sql`
2. Paste into SQL Editor
3. Run all queries
4. Check for ✓ (checkmark) in all column checklists
```

Expected output should show:
- ✓ All 9 EMR tables exist
- ✓ All required columns present in each table
- ✓ All indexes created
- ✓ All foreign key constraints valid
- ✓ All RLS policies enabled
- ✓ 2 views (v_todays_queue, v_doctor_queue) created

### Step 4: Test Application Connectivity
1. Start dev server: `npm run dev`
2. Open browser: http://localhost:3000
3. Navigate to doctor console
4. Create a test visit → Check visit was saved
5. Add consultation → Verify SOAP data persisted
6. Create assessment → Verify Ayurvedic fields saved
7. Add diagnosis → Verify diagnosis_status stored correctly
8. Create prescription → Verify medicines, dosage, duration saved

---

## Migration Characteristics

### Idempotent Design
- All `CREATE TABLE` use `IF NOT EXISTS`
- All `CREATE INDEX` use `IF NOT EXISTS`
- `DROP VIEW IF EXISTS CASCADE` before recreating views
- All `CREATE POLICY IF NOT EXISTS` safe for re-runs

**Safe to run multiple times** without side effects.

### Data Safety
- No data deleted
- No existing tables dropped
- Foreign key constraints use `ON DELETE CASCADE` for dependent records
- RLS policies restrict unauthorized access

### Performance Considerations
- Indexes on all frequently queried columns (uuid, patient_uuid, doctor_uuid, date, status)
- Foreign keys properly indexed
- Views use efficient JOINs
- Timeline table has partial indexing on date for efficient audit trail queries

---

## Schema Verification

### Critical Column Requirements (Must Match Code)

**emr_visit:**
- ✓ `uuid, patient_uuid, doctor_uuid`
- ✓ `visit_date, visit_type, chief_complaint`
- ✓ Vitals columns: `systolic_bp, diastolic_bp, pulse_rate, temperature_c, respiratory_rate, spo2, height_cm, weight_kg, bmi`
- ✓ `visit_status` supports all 6 states
- ✓ `visit_number` (auto-generated visit identifier)

**emr_consultation:**
- ✓ `visit_uuid` (UNIQUE)
- ✓ SOAP fields: `subjective, objective, assessment, plan`
- ✓ `consultation_status` (DRAFT, FINALIZED)

**emr_diagnosis:**
- ✓ `primary_diagnosis` (required)
- ✓ `diagnosis_status` supports DRAFT/FINALIZED

**emr_prescription:**
- ✓ `medicines` (required)
- ✓ `dosage, duration, special_instructions, pharmacy_notes`
- ✓ `prescription_status` supports DRAFT/FINALIZED/DISPENSED

**emr_treatment_plan:**
- ✓ `panchakarma_type, total_sessions, session_duration_minutes, frequency` (all required)
- ✓ `uuid` field for service references

**emr_therapy_session:**
- ✓ `treatment_plan_uuid` FK references
- ✓ `session_number, scheduled_date` (required)
- ✓ Full therapy details stored

**emr_follow_up:**
- ✓ `recommended_date, follow_up_type` (required)
- ✓ `follow_up_status` supports SCHEDULED/COMPLETED/CANCELLED

---

## Rollback Plan

If migration fails or causes issues:

```sql
-- Option 1: Drop new schema (if needed)
DROP TABLE IF EXISTS emr_visit_timeline CASCADE;
DROP TABLE IF EXISTS emr_follow_up CASCADE;
DROP TABLE IF EXISTS emr_therapy_session CASCADE;
DROP TABLE IF EXISTS emr_treatment_plan CASCADE;
DROP TABLE IF EXISTS emr_prescription CASCADE;
DROP TABLE IF EXISTS emr_diagnosis CASCADE;
DROP TABLE IF EXISTS emr_ayurvedic_assessment CASCADE;
DROP TABLE IF EXISTS emr_consultation CASCADE;
DROP TABLE IF EXISTS emr_visit CASCADE;
DROP VIEW IF EXISTS v_todays_queue CASCADE;
DROP VIEW IF EXISTS v_doctor_queue CASCADE;

-- Option 2: Restore from backup (if available)
-- Use psql to restore: psql < backup_YYYYMMDD_HHMMSS.sql
```

---

## Manual Steps Required After Running Migration

### None Required
The migration is fully self-contained and ready for immediate use. No manual setup, seeding, or configuration needed.

### Optional: Test Data
To test workflows with sample data, see: `PRODUCTION_EMR_TEST_DATA.sql` (will be provided separately)

---

## Post-Deployment Checklist

- [ ] Migration executed successfully
- [ ] Verification script shows all tables created
- [ ] All column checklists show ✓
- [ ] Views are accessible
- [ ] RLS policies are active
- [ ] Dev server starts without connection errors
- [ ] Can create visit and save data
- [ ] Can add consultation with SOAP notes
- [ ] Can add assessment with Ayurvedic data
- [ ] Can add diagnosis with proper status
- [ ] Can add prescription with medicines/dosage
- [ ] Can create treatment plan (Sprint 5)
- [ ] Can add therapy sessions (Sprint 5)
- [ ] Can create follow-ups (Sprint 6)
- [ ] Production deployment completed successfully

---

## Support & Troubleshooting

### Error: "relation 'emr_visit' already exists"
This is normal if running migration multiple times. The `IF NOT EXISTS` clause handles this. Proceed normally.

### Error: "column 'visit_status' does not exist"
Check if migration ran completely. Run verification script to confirm all tables exist.

### Error: "permission denied for schema public"
Ensure you're connected as Supabase admin user with full permissions.

### Application can't connect to tables
- Verify RLS policies are created (check admin access policy)
- Confirm `profiles` and `patients` tables exist and have data
- Check auth.uid() returns valid user UUID

---

## Files Delivered

1. **production_emr.sql** - Main migration (idempotent, production-ready)
2. **verify_production_emr.sql** - Verification script for confirmation
3. **PRODUCTION_EMR_MIGRATION.md** - This documentation
4. **schema_comparison.txt** - Detailed column-by-column code vs SQL comparison

---

## Schema Last Updated

**Generated:** July 8, 2026 12:06 UTC+5:30  
**Based on Codebase Analysis:** All Sprint 1-6 services analyzed July 8, 2026  
**Status:** ✅ Ready for Production
