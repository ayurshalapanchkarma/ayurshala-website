# Clinical Core Release Checklist

**Status**: Code Complete, Runtime Verification Pending

---

## Phase 1: Schema & Data Integrity

- [ ] Apply all 6 migrations to a **clean database** (fresh Supabase project)
  - [ ] Sprint 1: Patient Visit EMR
  - [ ] Sprint 2: Consultation & SOAP Notes
  - [ ] Sprint 3: Ayurvedic Assessment
  - [ ] Sprint 4: Diagnosis & Prescription
  - [ ] Sprint 5: Panchakarma Management
  - [ ] Sprint 6: Follow-up & Clinical Timeline

- [ ] Apply all 6 migrations to a **copy of existing development database**
  - [ ] Verify no conflicts with existing data
  - [ ] Confirm no orphan records created

- [ ] Run SQL integrity verification
  - [ ] Execute `/verification/sql-integrity-check.sql`
  - [ ] Verify 0 orphaned records across all tables
  - [ ] Confirm 1:1 constraints enforced (Consultation, Assessment, Diagnosis, Prescription, Treatment Plan)
  - [ ] Check all FK references valid

---

## Phase 2: Complete Patient Journey Testing

**Setup**: Create 1 test patient, 1 test doctor, 1 test appointment

### Step 1: Appointment → Check-in
- [ ] Create appointment (booking system)
- [ ] Doctor initiates check-in
- [ ] Verify `emr_visit` record created
- [ ] Verify `CHECK_IN` event logged to timeline
- [ ] Verify visit_number generated (daily counter working)

### Step 2: Vitals
- [ ] Doctor records vitals (BP, HR, Temp, RR, etc.)
- [ ] Save vitals to visit
- [ ] Verify vitals persisted after refresh
- [ ] Verify `VITALS_RECORDED` event in timeline
- [ ] Confirm immutability: cannot edit finalized vitals

### Step 3: Consultation & SOAP Notes
- [ ] Doctor opens consultation form
- [ ] Fill Subjective, Objective, Assessment, Plan fields
- [ ] Save as DRAFT (repeatable)
- [ ] Refresh → verify data persists (not client state)
- [ ] Finalize consultation
- [ ] Verify `CONSULTATION_COMPLETED` event in timeline
- [ ] Confirm form disabled after finalization

### Step 4: Ayurvedic Assessment
- [ ] Doctor opens assessment form
- [ ] Fill all Ayurvedic fields (Prakriti, Vikriti, Nadi, Dashavidha, etc.)
- [ ] Save as DRAFT (repeatable)
- [ ] Refresh → verify persistence
- [ ] Finalize assessment
- [ ] Verify `AYURVEDIC_ASSESSMENT_COMPLETED` event in timeline
- [ ] Confirm immutability

### Step 5: Diagnosis
- [ ] Doctor opens diagnosis form
- [ ] Fill primary diagnosis, secondary diagnoses, clinical notes
- [ ] Save as DRAFT (repeatable)
- [ ] Finalize diagnosis
- [ ] Verify `DIAGNOSIS_FINALIZED` event in timeline
- [ ] Confirm form disabled

### Step 6: Prescription
- [ ] Doctor opens prescription form
- [ ] See diagnosis linked (if exists)
- [ ] Fill medicines, dosage, duration, instructions
- [ ] Save as DRAFT (repeatable)
- [ ] Finalize prescription
- [ ] Verify `PRESCRIPTION_CREATED` event in timeline
- [ ] Test optional DISPENSE action (status → DISPENSED)

### Step 7: Pharmacy
- [ ] Pharmacist receives prescription
- [ ] Verify RLS allows READ access
- [ ] (Future: Implement dispensing workflow)

### Step 8: Panchakarma Treatment
- [ ] Doctor creates treatment plan (Panchakarma type, sessions, frequency)
- [ ] Save as DRAFT
- [ ] Activate plan (DRAFT → ACTIVE)
- [ ] Verify `TREATMENT_PLAN_CREATED` event in timeline
- [ ] Schedule therapy session
- [ ] Verify `THERAPY_SESSION_COMPLETED` event when marked complete
- [ ] Complete all sessions
- [ ] Verify `TREATMENT_PLAN_COMPLETED` event in timeline

### Step 9: Follow-up
- [ ] Doctor schedules follow-up from timeline page
- [ ] Verify `FOLLOW_UP_SCHEDULED` event in timeline
- [ ] Mark follow-up COMPLETED
- [ ] Verify `FOLLOW_UP_COMPLETED` event in timeline

### Step 10: Timeline View
- [ ] Open timeline/dashboard page
- [ ] Verify all 10+ events displayed in reverse chronological order
- [ ] Each event shows title, description, timestamp
- [ ] Timeline is **read-only** for all users
- [ ] No duplicate events (each action logs exactly once)

### Step 11: Billing (if implemented)
- [ ] Verify prescription/treatments can be billed
- [ ] (Future phase: implement billing integration)

---

## Phase 3: RLS & Security Verification

**Setup**: Create test users with each role

### Doctor Role
- [ ] Can VIEW all own records
- [ ] Can CREATE records (visit, consultation, assessment, etc.)
- [ ] Can EDIT own DRAFT records
- [ ] Can FINALIZE records (status transition)
- [ ] Cannot EDIT finalized/immutable records
- [ ] Cannot VIEW other doctors' records
- [ ] Cannot VIEW reception notes or admin settings

### Reception Role
- [ ] Can VIEW all visits (read-only)
- [ ] Can VIEW all consultations, assessments, diagnoses (read-only)
- [ ] Cannot CREATE or EDIT clinical records
- [ ] Cannot VIEW timelines or sensitive data

### Admin Role
- [ ] Can VIEW all records
- [ ] Can CREATE, EDIT, DELETE any record
- [ ] Can VIEW audit logs (created_by, updated_at)

### Pharmacist Role
- [ ] Can VIEW prescriptions (read-only)
- [ ] Can VIEW prescription status and medicines
- [ ] Cannot VIEW consultations or assessments
- [ ] Can mark prescription as DISPENSED (if implemented)

### Therapist Role
- [ ] Can VIEW therapy sessions assigned to them
- [ ] Can UPDATE session status (SCHEDULED → IN_PROGRESS → COMPLETED)
- [ ] Can record observations and patient response
- [ ] Cannot VIEW or EDIT treatment plan (only doctor)

---

## Phase 4: Data Constraints & Immutability

- [ ] **One record per visit**
  - [ ] Consultation: only 1 per visit (UNIQUE constraint enforced)
  - [ ] Assessment: only 1 per visit
  - [ ] Diagnosis: only 1 per visit
  - [ ] Prescription: only 1 per visit
  - [ ] Treatment Plan: only 1 per visit

- [ ] **Immutability after finalization**
  - [ ] Cannot edit FINALIZED consultation
  - [ ] Cannot edit FINALIZED diagnosis
  - [ ] Cannot edit FINALIZED prescription (stays FINALIZED or DISPENSED)
  - [ ] Cannot edit COMPLETED treatment plan
  - [ ] Cannot edit COMPLETED therapy sessions

- [ ] **Status machine enforcement**
  - [ ] Visit: CHECKED_IN → IN_CONSULTATION → PRESCRIPTION_READY → THERAPY_ASSIGNED → COMPLETED
  - [ ] Consultation: DRAFT → FINALIZED
  - [ ] Diagnosis: DRAFT → FINALIZED
  - [ ] Prescription: DRAFT → FINALIZED → DISPENSED
  - [ ] Treatment Plan: DRAFT → ACTIVE → COMPLETED or CANCELLED
  - [ ] Therapy Session: SCHEDULED → IN_PROGRESS → COMPLETED or CANCELLED
  - [ ] Follow-up: SCHEDULED → COMPLETED or CANCELLED

---

## Phase 5: Frontend & UX Verification

- [ ] **Mobile Responsiveness**
  - [ ] Forms render on mobile (480px, 768px, 1024px breakpoints)
  - [ ] Buttons and inputs are touch-friendly
  - [ ] Timeline is readable on small screens

- [ ] **Error Handling**
  - [ ] Network errors show user-friendly messages
  - [ ] Validation errors prevent invalid submissions
  - [ ] Duplicate submission prevention (buttons disable during save)

- [ ] **Navigation**
  - [ ] Back links work correctly
  - [ ] Sidebar navigation includes all clinical modules
  - [ ] No orphaned pages or dead links

- [ ] **Data Display**
  - [ ] Forms pre-populate with existing data
  - [ ] No console errors in browser DevTools
  - [ ] Timestamps display in user's timezone

---

## Phase 6: Deployment Verification

- [ ] Deploy to **staging environment**
  - [ ] All migrations run successfully
  - [ ] API endpoints respond
  - [ ] Frontend loads without errors
  - [ ] Authentication works
  - [ ] Run Phase 2-5 tests in staging

- [ ] Staging sign-off from Dr. Sanjay and clinic staff

- [ ] Deploy to **production**
  - [ ] Database backup created
  - [ ] Migrations applied to production database
  - [ ] Health check: API responding, database connected
  - [ ] Monitor for errors (first 24 hours)

---

## Phase 7: Production Validation

- [ ] **Live clinic workflow test** (under supervision)
  - [ ] Morning check-ins
  - [ ] Doctor consultations and assessments
  - [ ] Prescription generation and pharmacy handoff
  - [ ] Timeline accuracy

- [ ] **User feedback collection**
  - [ ] Collect issues from Dr. Sanjay and staff
  - [ ] Log bugs and feature requests
  - [ ] Prioritize critical issues for fix

- [ ] **Performance monitoring**
  - [ ] Page load times acceptable
  - [ ] Database query performance acceptable
  - [ ] No connection timeouts
  - [ ] Alert system configured

---

## Phase 8: Final Release

- [ ] All checklist items passed ✅
- [ ] No critical bugs remaining
- [ ] Dr. Sanjay and clinic staff sign-off
- [ ] Tag release:
  ```bash
  git tag clinical-core-v1.0
  git push origin clinical-core-v1.0
  ```

---

## Post-Release (Maintenance)

- [ ] **Freeze Clinical Core** — No feature changes except bug fixes
- [ ] **Document known limitations**
- [ ] **Establish bug fix process** (hotfix branches)
- [ ] **Plan future modules** (Analytics, Automation, Reporting)
- [ ] **Schedule regular backups**

---

## Sign-Off

- [ ] Code review: _______________________
- [ ] QA verification: _______________________
- [ ] Dr. Sanjay approval: _______________________
- [ ] Admin approval: _______________________
- [ ] Date: _______________________

---

**Next Steps After Release v1.0**:
1. Monitor production for 1-2 weeks
2. Fix any bugs discovered in real clinic usage
3. Release v1.0.1 with bug fixes (if needed)
4. Begin planning non-core modules (Analytics, Automations, Reporting)
