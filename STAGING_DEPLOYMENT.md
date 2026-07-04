# Staging Deployment & Verification Workflow

**Objective**: Deploy Clinical Core to staging, run full verification checklist, perform UAT, then release to production.

---

## Step 1: Staging Database Setup (Supabase)

### Create Staging Project
1. Go to https://supabase.com → New Project
2. Name: `ayurshala-clinical-staging`
3. Region: Same as production (for consistency)
4. Create project and wait for initialization

### Apply All Migrations
```bash
# Download staging connection details from Supabase dashboard
# (Project Settings → Database → Connection String)

# Set environment variables
export STAGING_DB_URL="postgresql://[user]:[password]@[host]:[port]/[db]"

# Apply each migration in order (1-6)
psql $STAGING_DB_URL -f migrations/sprint1_patient_visit_emr.sql
psql $STAGING_DB_URL -f migrations/sprint2_consultation_soap.sql
psql $STAGING_DB_URL -f migrations/sprint3_ayurvedic_assessment.sql
psql $STAGING_DB_URL -f migrations/sprint4_diagnosis_prescription.sql
psql $STAGING_DB_URL -f migrations/sprint5_panchakarma.sql
psql $STAGING_DB_URL -f migrations/sprint6_follow_up.sql

# Verify no errors in migration output
# Expected: All tables created, RLS enabled, triggers active
```

### Enable Supabase Auth (Staging)
1. Go to Supabase Dashboard → Authentication
2. Create test users:
   - `doctor@staging.test` (password: `staging123`)
   - `reception@staging.test`
   - `admin@staging.test`
   - `therapist@staging.test`
   - `pharmacist@staging.test`
3. Assign roles via `auth.jwt` custom claims or `public.profiles` table

---

## Step 2: Staging Application Deploy (Vercel)

### Set Up Staging Environment
```bash
# Create .env.staging file with staging Supabase credentials
NEXT_PUBLIC_SUPABASE_URL="https://[staging-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[staging-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[staging-service-key]"
```

### Deploy to Vercel Staging
```bash
# Option 1: Via Vercel CLI
vercel --env-file .env.staging --prod

# Option 2: Via GitHub integration
# Push to branch `staging` → Vercel auto-deploys to staging.ayurshala-website.vercel.app

# Verify deployment
curl https://staging.ayurshala-website.vercel.app/api/emr/visits
# Expected: 401 Unauthorized (because no auth header) or list of visits
```

### Staging URLs
- Frontend: `https://staging.ayurshala-website.vercel.app`
- API: `https://staging.ayurshala-website.vercel.app/api`
- Supabase Dashboard: `https://app.supabase.com/project/[staging-project]`

---

## Step 3: SQL Integrity Check (Staging)

```bash
# Run the integrity verification script
psql $STAGING_DB_URL -f verification/sql-integrity-check.sql

# Expected output:
# orphan_visits | 0
# visits_no_doctor | 0
# orphan_consultations | 0
# ... (all counts should be 0)
# duplicate_count | (no rows returned, or empty result set)
```

**Interpretation**:
- ✅ All counts = 0 → Schema is healthy, no orphaned records
- ❌ Any count > 0 → Migration error, fix and reapply

---

## Step 4: End-to-End Patient Journey (Staging)

### Test Scenario: Complete clinic visit for 1 patient

**Actors**:
- Patient: `john.doe@clinic.test`
- Doctor: `doctor@staging.test`
- Reception: `reception@staging.test`
- Pharmacist: `pharmacist@staging.test`
- Therapist: `therapist@staging.test`

### Workflow

**1. Appointment (Reception creates)**
```
URL: staging.ayurshala-website.vercel.app/receptionist/appointments
Action: Create new appointment for John Doe with Dr. Sanjay
Expected: Appointment saved, visit_number generated
```

**2. Check-in (Reception/Doctor)**
```
URL: .../doctor/check-in
Action: Doctor clicks "Check In" for John's appointment
Expected: 
  - emr_visit record created
  - visit_status = CHECKED_IN
  - CHECK_IN event logged to timeline
  - View displays visit number, patient name
```

**3. Vitals (Doctor)**
```
URL: .../doctor/vitals/[visitId]
Action: Record BP, HR, Temp, RR, O2 Sat
Expected:
  - Vitals saved to emr_visit.vitals
  - VITALS_RECORDED event in timeline
  - Form disabled after finalization
```

**4. Consultation & SOAP (Doctor)**
```
URL: .../doctor/consultation/[visitId]
Action: Fill Subjective, Objective, Assessment, Plan; finalize
Expected:
  - emr_consultation record created (DRAFT)
  - Save as DRAFT → repeatable edits
  - Refresh → data persists (not client state)
  - Finalize → CONSULTATION_COMPLETED event
  - Form disabled
```

**5. Ayurvedic Assessment (Doctor)**
```
URL: .../doctor/assessment/[visitId]
Action: Fill Prakriti, Vikriti, Nadi, Dashavidha, etc.; finalize
Expected:
  - emr_ayurvedic_assessment record created
  - AYURVEDIC_ASSESSMENT_COMPLETED event
  - One assessment per visit (UNIQUE constraint)
```

**6. Diagnosis (Doctor)**
```
URL: .../doctor/diagnosis-prescription/[visitId] (Diagnosis tab)
Action: Fill primary/secondary diagnosis; finalize
Expected:
  - emr_diagnosis record created
  - DIAGNOSIS_FINALIZED event
  - Cannot re-edit after FINALIZED
```

**7. Prescription (Doctor)**
```
URL: .../doctor/diagnosis-prescription/[visitId] (Prescription tab)
Action: Fill medicines, dosage, duration; finalize
Expected:
  - emr_prescription record created
  - Links to diagnosis (if exists)
  - PRESCRIPTION_CREATED event
  - Optional: Test DISPENSE action → status = DISPENSED
```

**8. Pharmacy (Pharmacist)**
```
URL: .../pharmacist/prescriptions
Action: Pharmacist views prescription (read-only)
Expected:
  - RLS allows pharmacist READ access
  - Cannot view consultation or assessment
  - Can mark as dispensed (if implemented)
```

**9. Billing (Reception)**
```
URL: .../billing/[visitId] (if implemented)
Action: Review charges (vitals, consultation, prescription, therapy)
Expected:
  - All billable items appear
  - Total calculated correctly
```

**10. Panchakarma Treatment (Doctor)**
```
URL: .../doctor/panchakarma/[visitId]
Action: 
  1. Create treatment plan (type=Vasti, 7 sessions, daily)
  2. Activate plan
  3. Schedule therapy session
  4. Mark session completed
Expected:
  - emr_treatment_plan created (DRAFT → ACTIVE)
  - TREATMENT_PLAN_CREATED event
  - emr_therapy_session created (SCHEDULED)
  - Mark session → THERAPY_SESSION_COMPLETED event
  - Complete all sessions → TREATMENT_PLAN_COMPLETED event
```

**11. Follow-up (Doctor)**
```
URL: .../doctor/timeline/[visitId]
Action: 
  1. Click "Schedule Follow-up"
  2. Set date, type (Post-treatment review), instructions
  3. Save
Expected:
  - emr_follow_up created
  - FOLLOW_UP_SCHEDULED event
  - Follow-up appears in timeline
  - Can mark COMPLETED later
```

**12. Timeline View (All Roles)**
```
URL: .../doctor/timeline/[visitId]
Action: View complete clinical history
Expected:
  - All 10+ events displayed in reverse chronological order
  - Each event shows: title, description, timestamp, actor
  - No duplicate events (each action logged exactly once)
  - Read-only view for all users
```

### Verification Checklist

- [ ] All 12 steps completed without errors
- [ ] Each record linked to visit_uuid (verify in DB)
- [ ] Timeline shows exactly 10+ events (no duplicates)
- [ ] Immutability enforced (finalized records cannot be edited)
- [ ] Status machines followed (DRAFT → FINALIZED, etc.)
- [ ] One record per visit (Consultation, Assessment, Diagnosis, Prescription, Treatment Plan)
- [ ] Database query integrity check passes (all FKs valid)

---

## Step 5: Role-Based Access Control (RLS) Verification

### Test Matrix

| Role | Visit | Consultation | Assessment | Diagnosis | Prescription | Treatment Plan | Timeline | Action |
|------|-------|--------------|------------|-----------|--------------|---|----------|--------|
| Doctor (owner) | R/W | R/W | R/W | R/W | R/W | R/W | R | Create, edit own records |
| Doctor (other) | R | R | R | R | R | R | R | Read-only |
| Reception | R | R | R | R | R | R | R | View only |
| Admin | R/W/D | R/W/D | R/W/D | R/W/D | R/W/D | R/W/D | R | Full access |
| Pharmacist | - | - | - | - | R | - | - | View prescriptions only |
| Therapist | - | - | - | - | - | R | - | View assigned therapy sessions |

### Test Cases

**Test 1: Doctor can create and edit own record**
```
Login as: doctor@staging.test
Visit URL: .../doctor/consultation/[visitId]
Action: Create, Save as DRAFT, edit fields, save again
Expected: ✅ All operations succeed
```

**Test 2: Doctor cannot edit other doctor's records**
```
Login as: doctor2@staging.test
Visit URL: .../doctor/consultation/[visitId-from-doctor1]
Action: Try to edit consultation
Expected: ❌ 403 Forbidden or "Unauthorized" message
```

**Test 3: Reception can view, not edit**
```
Login as: reception@staging.test
Visit URL: .../reception/consultations
Action: View list, click to view detail, try to edit
Expected: ✅ Can view, ❌ Cannot edit (form disabled)
```

**Test 4: Pharmacist cannot view clinical records**
```
Login as: pharmacist@staging.test
Visit URL: .../doctor/consultation/[visitId]
Action: Try to access consultation
Expected: ❌ 401/403 Forbidden
```

**Test 5: Admin can edit anyone's record**
```
Login as: admin@staging.test
Visit URL: .../admin/consultation/[visitId]
Action: Edit consultation, change status
Expected: ✅ All operations succeed
```

---

## Step 6: Edge Case Testing

### 1. Duplicate Submission Prevention
```
Test: Double-click "Save" button rapidly
Expected: Only 1 record created (button disabled during save)
```

### 2. Browser Refresh During Save
```
Test: Save form, refresh page immediately
Expected: 
  - If submitted before refresh: data persisted
  - If not submitted: form shows last saved state (not lost)
```

### 3. Concurrent Check-ins
```
Test: 2 receptionists check in same patient simultaneously
Expected:
  - First check-in succeeds
  - Second check-in fails (UNIQUE constraint on visit_uuid)
  - Error message shown to second receptionist
```

### 4. Cancelled Appointment
```
Test: Cancel appointment → check-in page
Expected: Visit marked CANCELLED, immutable, no further actions allowed
```

### 5. Finalized Record Immutability
```
Test: Finalize consultation → try to edit
Expected:
  - Form fields disabled
  - Save button hidden or disabled
  - Clear message: "Consultation finalized and cannot be edited"
```

### 6. Orphaned Prescription (No Diagnosis)
```
Test: Create prescription without diagnosis first
Expected: 
  - Prescription allowed without diagnosis (FK nullable)
  - OR user prompted to create diagnosis first (depends on UX)
```

---

## Step 7: Responsive Design Testing

Test on three viewports:
- **Mobile**: iPhone 12 (390px)
- **Tablet**: iPad (768px)
- **Desktop**: 1920px

### Checklist

- [ ] Forms render correctly (inputs stacked or multi-column appropriately)
- [ ] Buttons are touch-friendly (min 44px height)
- [ ] Timeline sidebar doesn't overflow on mobile
- [ ] No horizontal scrolling
- [ ] Navigation menu accessible (hamburger or sidebar)
- [ ] Text is readable (no overflow, appropriate font size)
- [ ] Images/tables scale properly

---

## Step 8: Defect Logging & Fix Cycle

If issues found:
1. **Log defect**: Title, reproduction steps, expected vs. actual, screenshot
2. **Prioritize**: Critical (blocks UAT), Major (workaround exists), Minor (cosmetic)
3. **Fix**: Update code, run tests locally
4. **Redeploy to staging**: `git push origin main` → Vercel auto-deploys
5. **Retest**: Run affected test cases again

---

## Step 9: User Acceptance Testing (UAT) with Dr. Sanjay

### Preparation
- [ ] Brief Dr. Sanjay on test scenarios
- [ ] Provide staging credentials
- [ ] Show how to navigate to key pages
- [ ] Explain test data (dummy patient, not real)

### UAT Scenarios (Real Clinic Workflows)

**Scenario 1: Morning Clinic - 3 Back-to-Back Patients**
```
1. Reception checks in 3 patients
2. Doctor sees queue (if queue page exists)
3. Doctor opens each patient, records vitals, consultation
4. Reception verifies patient checkout
Expected: No bottlenecks, smooth workflow
```

**Scenario 2: Prescription & Pharmacy Handoff**
```
1. Doctor completes diagnosis & prescription
2. Pharmacy staff receives prescription
3. Pharmacy dispenses, marks as dispensed
4. Patient picks up
Expected: Clear workflow, no confusion about status
```

**Scenario 3: Multi-Day Treatment**
```
1. Day 1: Check-in, consultation, treatment plan created
2. Day 2: Therapy session 1 completed, schedule session 2
3. Day 3: Session 2 completed, schedule follow-up
Expected: Continuity, accurate timeline
```

**Scenario 4: Error Recovery**
```
1. Doctor accidentally finalized consultation with incomplete info
2. (Try to edit - should fail)
3. Need to start new visit for re-consultation
Expected: Clear error message, process is clear
```

### UAT Feedback
- [ ] Collect feedback form: What worked? What didn't? Suggestions?
- [ ] Note any usability issues or pain points
- [ ] Ask: Is this ready for daily use?

### UAT Sign-Off
```
Dr. Sanjay / Clinic Manager sign-off:

I have tested the Clinical Core system with realistic clinic workflows.
The system is ready for production use.

Signed: ____________________
Date: ____________________
```

---

## Step 10: Production Release

### Pre-Release Checklist

- [ ] All verification steps passed ✅
- [ ] All defects fixed and retested ✅
- [ ] UAT sign-off obtained ✅
- [ ] Database backup created ✅
- [ ] Staging environment stable for 24+ hours ✅

### Release Steps

```bash
# 1. Tag the release
git tag clinical-core-v1.0
git push origin clinical-core-v1.0

# 2. Deploy to production
vercel --prod

# 3. Apply migrations to production database
# (Done via Supabase UI or migration script)

# 4. Verify production health
curl https://ayurshala-website.vercel.app/api/emr/visits
# Expected: 401 Unauthorized (auth required) or clinic data
```

### Day 1 Monitoring (Production)

- [ ] Check Vercel logs for errors
- [ ] Check Supabase database logs
- [ ] Monitor API response times
- [ ] Verify real patient data flows through correctly
- [ ] On-call support ready for urgent issues

---

## Post-Release

### Clinical Core Freeze
From this point forward:
- **No feature changes** to Clinical Core (Sprints 1-6)
- **Bug fixes only** if critical defects found
- **All new capabilities** (analytics, automation, reporting) built on top

### Version Numbering
- `v1.0.0`: Initial production release
- `v1.0.1`: Bug fix release (if needed)
- `v2.0.0`: Only after major architectural changes (unlikely)

### Backup & Monitoring
- [ ] Daily backups configured (Supabase auto-backups)
- [ ] Error alerts set up
- [ ] Performance baselines recorded
- [ ] Runbook created for common issues

### Future Work
Plan next phases:
- [ ] Analytics & reporting (read-only clinical data)
- [ ] Automation (automated reminders, follow-up generation)
- [ ] Mobile app (React Native or native)
- [ ] Inventory management
- [ ] Billing system
- [ ] Patient portal

---

## Timeline Estimate

| Phase | Duration | Owner |
|-------|----------|-------|
| Staging DB + Deploy | 1-2 hours | Dev |
| SQL Verification | 15 mins | Dev |
| E2E Patient Journey | 2-3 hours | Dev + QA |
| RLS & Edge Cases | 1-2 hours | Dev + QA |
| Responsive Design | 1 hour | QA |
| Defect Fixes (if any) | 1-4 hours | Dev |
| UAT with Dr. Sanjay | 2-3 hours | Dr. Sanjay + Dev |
| Production Release | 30 mins | Dev + DevOps |
| **Total** | **9-17 hours** | |

**Realistic Timeline**: 1-2 business days if no major defects found.

---

**Status After Release v1.0**: Clinical Core is stable, tested, UAT-approved, and ready for daily clinic use. All future work is additive, never modifying the core.
