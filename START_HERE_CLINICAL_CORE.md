# Clinical Core EMR — Start Here

**Status**: Sprint 1 Complete, Ready for Runtime Verification  
**Date**: 2026-07-05

---

## What You Have

A complete, integrated software implementation for Ayurshala's clinical workflow:

### Sprint 1: Patient Visit (✅ Complete)
- Patient check-in with vitals
- Auto-generated visit numbers (VIS-YYYYMMDD-0001)
- Doctor queue with token numbers
- Visit status management
- Timeline event logging

**Code Status**: Complete, integrated implementation that builds successfully and is ready for runtime verification  
**Build Status**: ✅ TypeScript compiles, zero errors  
**Runtime Status**: ⏳ Awaiting verification in live database

---

## Quick Navigation

### If You Want To...

**Understand the big picture**  
→ Read: `CLINICAL_CORE_FRAMEWORK.md` (6-sprint roadmap, 3 rules, interdependencies)

**See what Sprint 1 is**  
→ Read: `README_CLINICAL_CORE_STATUS.md` (current status, next steps)

**Run runtime verification**  
→ Read: `SPRINT1_FINAL_VERIFICATION.md` (7 critical tests, exact procedures)

**Understand the implementation**  
→ Read: `SPRINT1_PATIENT_VISIT.md` (database, backend, API, frontend deep-dive)

**Get safety reassurance**  
→ Read: `SPRINT1_SAFETY_DECISIONS.md` (edge cases, concurrency, idempotency)

**Sign off Sprint 1**  
→ Read: `SPRINT1_LOCK.md` (acceptance criteria, sign-off template)

---

## Key Points

1. **Build: ✅ Passing**
   - Code compiles successfully
   - No TypeScript errors
   - All endpoints typed correctly
   - Ready for deployment

2. **Runtime: ⏳ Pending Verification**
   - Code has NOT run in live database yet
   - 7 critical verification tests required
   - All tests must pass before sign-off
   - Takes ~45 minutes to run

3. **Framework: ✅ Locked**
   - 6 sprints planned (Sprint 1-6)
   - Each sprint independently deployable
   - Each sprint frozen after sign-off
   - Only bug fixes allowed after frozen

4. **Discipline: ✅ Enforced**
   - No feature creep mid-sprint
   - No breaking changes between sprints
   - Each sprint solves one complete workflow
   - Quality gates: build, runtime, sign-off

---

## Next Steps (In Order)

### 1. Deploy Migration (1 minute)
```bash
# In Supabase SQL Editor:
# Paste entire contents of: migrations/sprint1_patient_visit.sql
# Click Execute
```

### 2. Create Test Data (2 minutes)
```sql
INSERT INTO patients VALUES ('patient-id', 'Raj Kumar', ...);
INSERT INTO profiles VALUES ('doctor-id', 'Dr. Sanjay', 'DOCTOR');
```

### 3. Deploy Frontend (1 minute)
```bash
npm run build
npm run start
```

### 4. Run 7 Verification Tests (45 minutes)
Follow `SPRINT1_FINAL_VERIFICATION.md` — each test is clearly described with pass/fail criteria.

### 5. Fix Bugs (if any, immediately)
If verification finds issues:
- Fix the bug in code
- Re-run the test
- Fix immediately while code is fresh
- **Do not proceed to Sprint 2 with known bugs**

### 6. Sign-Off (5 minutes)
Complete the sign-off document in `SPRINT1_FINAL_VERIFICATION.md`.

### 7. Tag & Freeze (2 minutes)
```bash
git tag clinical-core-sprint1
git push origin clinical-core-sprint1
```

### 8. Start Sprint 2 (Next day)
New branch: `sprint2/consultation` — add SOAP notes to existing visits

---

## Files You'll Need

| File | When to Read |
|------|--------------|
| **START_HERE_CLINICAL_CORE.md** | Now (this file) |
| **CLINICAL_CORE_FRAMEWORK.md** | To understand the 6-sprint roadmap |
| **SPRINT1_FINAL_VERIFICATION.md** | To run verification tests |
| **SPRINT1_LOCK.md** | To sign off Sprint 1 |
| **SPRINT1_PATIENT_VISIT.md** | To understand implementation details |
| **SPRINT1_SAFETY_DECISIONS.md** | To understand edge cases |
| **README_CLINICAL_CORE_STATUS.md** | For current status recap |

---

## The Three Rules (All Sprints)

1. **Each sprint leaves the app in a deployable state**
2. **No sprint introduces breaking changes to prior sprints**
3. **Each sprint is frozen after sign-off (only bug fixes allowed)**

This ensures 6 independently testable milestones instead of one large unverified feature set.

---

## Important Distinction

- **Build ✅**: Code compiles (TypeScript verifies syntax/types)
- **Runtime ⏳**: Code hasn't executed in a live database yet (needs verification)
- **Production ⏳**: Will be ready after runtime verification + sign-off

**Sprint 1 is currently**: Building ✅, Runtime verification ⏳, not yet production

---

## After Verification Passes

Sprint 1 is tagged: `clinical-core-sprint1`  
Sprint 1 code is frozen: no new features  
Sprint 2 development begins: SOAP notes on existing visits

Then repeat the same process for Sprints 2-6.

---

## Timeline

| When | What |
|------|------|
| Now (< 1 hour) | Deploy + verify Sprint 1 |
| Day 2 | Start Sprint 2 development |
| Week 2 | Verify + sign-off Sprint 2 |
| Week 3 | Sprint 3 (Ayurvedic assessment) |
| Week 4 | Sprint 4 (Diagnosis & prescription) |
| Week 5 | Sprint 5 (Panchakarma) |
| Week 6 | Sprint 6 (Follow-up) |
| Week 7 | Complete Clinical Core EMR |

---

## Summary

✅ **Code is complete and builds successfully**  
⏳ **Awaiting runtime verification** (7 tests, ~45 min)  
🔒 **Architecture locked** (6-sprint framework established)  
📋 **Process disciplined** (each sprint frozen after sign-off)

**Next**: Run verification tests → Sign-off → Tag `clinical-core-sprint1` → Begin Sprint 2

---

**Questions?**
- Build issues? Check `SPRINT1_PATIENT_VISIT.md` implementation section
- Runtime? See `SPRINT1_FINAL_VERIFICATION.md` for exact test procedures
- Design? Read `SPRINT1_SAFETY_DECISIONS.md` for rationale
- Roadmap? Check `CLINICAL_CORE_FRAMEWORK.md` for interdependencies
