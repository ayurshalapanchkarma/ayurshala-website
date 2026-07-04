# Clinical Core: Status & Next Steps

**Date**: 2026-07-05  
**Overall Status**: Sprint 1 Implementation Complete  
**Build Status**: ✅ Passing  
**Runtime Status**: ⏳ Awaiting Verification

---

## Where We Are

### Sprint 1: Patient Visit ✅ Complete

**Code Status**:
- ✅ Database migration written (idempotent, ready to deploy)
- ✅ Backend service implemented (8 methods, fully typed)
- ✅ API endpoints built (7 endpoints, all validated)
- ✅ Frontend pages created (4 pages, responsive)
- ✅ Build passing (no TypeScript errors)

**What It Does**:
- Reception checks in a patient
- Vitals recorded with auto-calculated BMI
- Visit number auto-generated (VIS-YYYYMMDD-0001)
- Patient appears in doctor's queue immediately
- Doctor opens visit, sees all data and timeline
- Doctor changes status (Checked In → In Consultation → Complete)
- All changes persisted to database and reflected in queue

**What It Doesn't Do** (Intentional):
- No consultation/SOAP notes → Sprint 2
- No Ayurvedic assessment → Sprint 3
- No diagnosis/prescription → Sprint 4
- No Panchakarma tracking → Sprint 5
- No follow-up scheduling → Sprint 6

### Build Verification ✅

Code compiles successfully:
```bash
npm run build  # ✅ No errors
```

### Runtime Verification ⏳

Code has NOT yet run in a live database. Before sign-off, verify:
1. Idempotency (duplicate check-in prevention)
2. Concurrency (unique visit numbers)
3. Cancelled booking rejection
4. Queue ordering deterministic
5. Timeline event uniqueness
6. Valid status transitions
7. Browser refresh behavior

---

## Important Terminology

- **"Builds successfully"** = TypeScript compiles, no syntax/type errors
- **"Ready for runtime verification"** = Code is complete and ready to be deployed and tested
- **"Production-ready"** = Code has been runtime-verified, tested, and signed off

**Sprint 1 is currently**: ✅ Building successfully, ⏳ ready for runtime verification

---

## Next: Runtime Verification (Before Sign-Off)

### Step 1: Deploy Migration
```bash
# In Supabase SQL Editor:
# Copy entire contents of: migrations/sprint1_patient_visit.sql
# Execute all at once
```

### Step 2: Create Test Data
```sql
-- Create test patient
INSERT INTO patients (id, name, phone, email)
VALUES ('test-patient', 'Raj Kumar', '9821224767', 'raj@example.com');

-- Create test doctor
INSERT INTO profiles (id, name, role)
VALUES ('test-doctor', 'Dr. Sanjay', 'DOCTOR');
```

### Step 3: Deploy Frontend
```bash
npm run build
npm run start
```

### Step 4: Run 7 Verification Tests
Follow **SPRINT1_FINAL_VERIFICATION.md** exactly.

Each test is 5-10 minutes:
1. Idempotency (5 min)
2. Concurrency (10 min)
3. Cancelled booking (5 min)
4. Queue ordering (5 min)
5. Timeline uniqueness (5 min)
6. Status transitions (5 min)
7. Browser refresh (5 min)

Total: ~45 minutes

### Step 5: Sign-Off
Complete sign-off document in **SPRINT1_FINAL_VERIFICATION.md**

### Step 6: Tag Sprint
```bash
git tag clinical-core-sprint1
git push origin clinical-core-sprint1
```

---

## After Sprint 1 Signs Off

### Sprint 1 is Frozen
- No new features
- Only critical bug fixes
- All code locked in `clinical-core-sprint1` tag

### Sprint 2 Begins Immediately
- New branch: `sprint2/consultation`
- Add SOAP notes to existing visits
- Keep all Sprint 1 code unchanged
- Follow same 3 rules: deployable state, no breaking changes, frozen after complete

### 6 Sprints Total
```
Sprint 1: Patient Visit (✅ Complete)
Sprint 2: Consultation & SOAP (⏳ Next)
Sprint 3: Ayurvedic Assessment (⏳ After 2)
Sprint 4: Diagnosis & Prescription (⏳ After 3)
Sprint 5: Panchakarma (⏳ After 4)
Sprint 6: Follow-up & Timeline (⏳ After 5)

Result: Complete, independently testable clinical workflow
```

---

## Key Files

### Documentation
- **CLINICAL_CORE_FRAMEWORK.md** — Six-sprint roadmap with rules and dependencies
- **SPRINT1_FINAL_VERIFICATION.md** — 7 critical tests before sign-off
- **SPRINT1_LOCK.md** — Acceptance criteria and sign-off template
- **SPRINT1_UAT_ACCEPTANCE.md** — Detailed test scenarios

### Code
- **migrations/sprint1_patient_visit.sql** — Database schema
- **lib/emr/visit.service.ts** — Backend service
- **app/api/emr/visits/** — API endpoints
- **app/reception/** — Reception UI
- **app/doctor/** — Doctor UI

---

## Three Rules (All Sprints)

1. **Deployable State**: Each sprint leaves the app in a state that can go to production
2. **No Breaking Changes**: Code from Sprint N never breaks Sprint N-1
3. **Frozen After Complete**: After sign-off, only bug fixes allowed

---

## Questions?

- **"Is this production-ready?"** → Build: ✅ Runtime: ⏳ (after verification)
- **"When can we deploy?"** → After verification tests pass and sign-off is complete
- **"Can we add feature X to Sprint 1?"** → No. Sprint 1 is locked. Feature X goes to Sprint 2+
- **"How long until full EMR?"** → ~6-7 weeks for all 6 sprints (after Sprint 1 sign-off)
- **"What if verification fails?"** → Fix the issue, re-run test, then sign-off

---

## Success Criteria

Sprint 1 is **successfully signed off** when:
- ✅ All 7 verification tests pass
- ✅ Zero breaking changes to existing code
- ✅ Zero console errors or bugs
- ✅ Doctor queue works end-to-end
- ✅ Data persists correctly
- ✅ Sign-off document completed

Then: `git tag clinical-core-sprint1` and move to Sprint 2.

---

**Current Status**: 🟢 Ready for runtime verification  
**Next Action**: Deploy migration → Run tests → Sign-off → Tag  
**Timeline**: ~1-2 hours (verification + sign-off)

