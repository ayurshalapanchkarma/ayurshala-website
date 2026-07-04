# Clinical Core EMR — Status & Progress

**Last Updated**: 2026-07-05 00:33 UTC  
**Overall Status**: Two sprints coded, build passing, runtime verification pending

---

## Sprint Status Summary

| Sprint | Scope | Status |
|--------|-------|--------|
| 1 | Patient Visit & Vitals | ✅ Code complete |
| 2 | Consultation & SOAP Notes | ✅ Code complete |
| 3 | Ayurvedic Assessment | 📋 Planned |
| 4 | Diagnosis & Prescription | 📋 Planned |
| 5 | Panchakarma & Therapy | 📋 Planned |
| 6 | Follow-up & Clinical Timeline | 📋 Planned |

**Workflow**: Sprints 1-6 → Full runtime verification → Fix bugs → Production release

---

## Sprint 1: Patient Visit

**Code Status**: ✅ Complete (180 lines migration, 300+ backend, 200+ API, 750+ frontend)  
**Build Status**: ✅ Passing  
**Runtime Status**: ⏳ Pending verification

**Core Functionality**:
- Patient check-in with chief complaint
- Vitals recording (height, weight, temperature, BP, HR, RR, SpO2, BMI auto-calc)
- Doctor queue with real-time status and wait times
- Visit status state machine (CHECKED_IN → IN_CONSULTATION → PRESCRIPTION_READY → THERAPY_ASSIGNED → COMPLETED, any → CANCELLED)
- Timeline event logging (automatic: CHECK_IN, VITALS_RECORDED, status changes)

**Critical Requirements** (must verify):
- [ ] UNIQUE(visit_number, visit_date) prevents duplicates
- [ ] Concurrent check-ins get sequential visit numbers
- [ ] Visit number resets daily (VIS-YYYYMMDD-NNNN)
- [ ] BMI calculated and persisted
- [ ] Status transitions enforced (no backward moves)
- [ ] Timeline events logged exactly once per action
- [ ] Cancelled bookings handled (reject or create walk-in)

---

## Sprint 2: Consultation & SOAP Notes

**Code Status**: ✅ Complete (140 lines migration, 300+ backend, 140 API, 470+ frontend)  
**Build Status**: ✅ Passing  
**Runtime Status**: ⏳ Pending verification

**Core Functionality**:
- Doctor captures SOAP notes (Subjective, Objective, Assessment, Plan)
- Clinical examination findings
- Additional flags/concerns notes
- Save as draft (repeatable)
- Finalize consultation (immutable state transition)
- Timeline integration (CONSULTATION_COMPLETED event on finalization)

**Critical Requirements** (must verify):
- [ ] UNIQUE(visit_uuid) constraint prevents multiple consultations per visit
- [ ] Two simultaneous browser tabs creating consultation → only one succeeds
- [ ] Save Draft is idempotent (multiple saves, one record)
- [ ] Finalize is irreversible (API rejects edits after FINALIZED)
- [ ] Timeline events written exactly once on finalization
- [ ] Frontend blocks edit UI when finalized
- [ ] API endpoint rejects updates to finalized consultation
- [ ] Deleting visit cascades and orphans consultation safely (FK ON DELETE CASCADE)
- [ ] Doctor ownership enforced (RLS + service layer)
- [ ] Admin can override and edit finalized (if policy allows)

---

## Runtime Verification Roadmap

### Before Sprint 1 Sign-Off

**Database Level**:
1. Check visit number uniqueness and daily reset
   ```sql
   SELECT visit_date, visit_number, COUNT(*) FROM emr_visit 
   GROUP BY visit_date, visit_number HAVING COUNT(*) > 1;
   -- Expected: 0 rows
   ```

2. Verify concurrent visit number generation (5 simultaneous check-ins)

3. Check BMI persistence matches calculation

4. Verify status transition enforcement (no backwards moves)

5. Verify timeline events are exactly once per action

**API Level**:
6. Create visit, verify visit_number returned
7. Record vitals, verify BMI auto-calculated
8. Update status, verify transitions valid
9. Get timeline, verify events match

**UI Level**:
10. Load reception check-in, create visit, verify redirect
11. Load vitals form, enter data, verify BMI displays
12. Load doctor queue, verify visits with tokens
13. Load visit details, verify vitals and timeline

### Before Sprint 2 Sign-Off

**Database Level**:
1. Verify UNIQUE(visit_uuid) prevents multiple consultations
2. Test concurrent creation (2 tabs simultaneously)
3. Verify idempotent Save Draft (5 PUTs, 1 record)
4. Verify immutable Finalization (UPDATE fails on FINALIZED)
5. Verify timeline event written exactly once
6. Verify cascading delete (delete visit → consultation orphaned safely)

**API Level**:
7. Create consultation, verify DRAFT status
8. Finalize consultation, verify FINALIZED status
9. Attempt update after finalize → verify error
10. Attempt second consultation for same visit → verify error

**UI Level**:
11. Load consultation form, verify empty
12. Save as Draft, reload, verify persists
13. Finalize, verify redirect
14. Reopen consultation, verify disabled
15. List consultations, verify status badges

---

## Build Status

```
✅ npm run build: PASSING (9.5s)
✅ TypeScript: 0 errors
✅ All imports: RESOLVING
✅ Routes: GENERATED
✅ Production: READY
```

**Build Time**: 9.5 seconds  
**Last Run**: 2026-07-05 00:28 UTC  

---

## Roadmap: Six Sprints

| Sprint | Feature | Status | Scope |
|--------|---------|--------|-------|
| 1 | Patient Visit | ✅ Code | Check-in, vitals, queue, status |
| 2 | Consultation & SOAP | ✅ Code | SOAP notes, clinical exam, finalization |
| 3 | Ayurvedic Assessment | ⏳ Next | Prakriti, Vikriti, Nadi, Doshas, Agni, Ojas |
| 4 | Diagnosis & Prescription | ⏳ Later | Diagnosis records, prescription generation |
| 5 | Panchakarma & Therapy | ⏳ Later | Treatment plans, therapy sessions |
| 6 | Follow-up & Timeline | ⏳ Later | Follow-up scheduling, complete timeline |

**Architecture**: All link to `emr_visit.uuid` anchor. No duplicate clinical data.

---

## Next Steps

**Phase 1: Complete Implementation** (Ongoing)
1. Finish Sprint 3 code (Ayurvedic Assessment)
2. Finish Sprint 4 code (Diagnosis & Prescription)
3. Finish Sprint 5 code (Panchakarma & Therapy)
4. Finish Sprint 6 code (Follow-up & Timeline)

**Phase 2: Runtime Verification** (After all sprints coded)
1. Deploy all 6 migrations to Supabase
2. Run verification tests (13 + 10 + 11 + X + X + X tests)
3. Document results
4. Fix any bugs found

**Phase 3: Production Release**
1. Tag: `git tag clinical-core-complete`
2. Deploy to production via Vercel
3. Health checks pass
4. Dr. Sanjay can use full system

**Key Principle**: Do not change Visit model. Implement improvements as additive changes only.

---

## Files to Maintain

**Single Source of Truth**:
- `CLINICAL_CORE_STATUS.md` — This file (updated after each sprint)

**Reference Guides**:
- `START_HERE_CLINICAL_CORE.md` — Quick orientation
- `DEPLOYMENT_PIPELINE.md` — How to deploy safely
- `CLINICAL_CORE_FRAMEWORK.md` — Discipline and rules

**Implementation Details**:
- Each sprint's migration and code files
- See `lib/emr/` for services
- See `app/api/emr/` for endpoints
- See `app/doctor/` and `app/reception/` for UI

---

## Architecture (Locked)

```
Patient
   ↓
Booking
   ↓
Visit (single anchor for all clinical data)
   ├── Vitals (Sprint 1) ✅
   ├── Consultation & SOAP (Sprint 2) ✅
   ├── Ayurvedic Assessment (Sprint 3)
   ├── Diagnosis & Prescription (Sprint 4)
   ├── Panchakarma & Therapy (Sprint 5)
   └── Follow-up & Clinical Timeline (Sprint 6)
```

**Design Principle**: All clinical records link to Visit via foreign key. No duplicate data across sprints.

**Future Changes**: Implement as additive changes only. Do not rewrite Visit model.

---

## Constraints & Discipline

✅ **One record per type per visit**: e.g., one consultation, one assessment, one diagnosis  
✅ **Immutable after finalization**: Status FINALIZED blocks edits  
✅ **Doctor ownership**: Only creator can edit (RLS + service layer)  
✅ **Timeline integration**: Important actions logged automatically  
✅ **RLS enforced**: Doctor/reception/admin access control  
✅ **Backward compatible**: Each sprint frozen after sign-off  

---

## Implementation Status

**Sprints 1-2**: ✅ Code complete (2500+ lines)  
**Build**: ✅ Passing (0 errors, 9.5s)  
**Implementation**: ✅ Complete for Sprints 1-2, pending runtime verification before production  
**Architecture**: ✅ Locked (Visit anchor, no duplicate clinical data)  

**Workflow**: Finish coding Sprints 3-6 → Full runtime verification → Fix bugs → Production release

---

## Runtime Verification Checklist (After All Sprints Coded)

Each sprint must pass before production release.

**Sprint 1 (13 checks)**: Database uniqueness, concurrency, BMI, status transitions, timeline, API, UI  
**Sprint 2 (10 checks)**: Consultation uniqueness, concurrent creation, idempotency, immutability, timeline, API, UI  
**Sprint 3 (11 checks)**: Assessment creation, idempotency, finalization, timeline, API, UI (same pattern as Sprint 2)  
**Sprints 4-6**: Similar verification suites (TBD as sprints are coded)

**Total Expected Tests**: ~60+ (13 + 10 + 11 + estimated 10-12 each for Sprints 4-6)

**Fix Phase**: Any failing tests fixed immediately before production release.

---

## Files to Maintain Going Forward

**Single Source of Truth**:
- `CLINICAL_CORE_STATUS.md` — This file (update after each sprint)

**Reference Guides**:
- `START_HERE_CLINICAL_CORE.md` — Quick orientation
- `DEPLOYMENT_PIPELINE.md` — How to deploy safely
- `CLINICAL_CORE_FRAMEWORK.md` — Project discipline and rules

**Implementation Code**:
- Migrations in `migrations/sprint*.sql`
- Services in `lib/emr/*.service.ts`
- API routes in `app/api/emr/**`
- UI pages in `app/doctor/**` and `app/reception/**`

**Git History**: Tells the story of progress. Each commit documents what was built.

Do NOT create new planning/status documents after each sprint. Update CLINICAL_CORE_STATUS.md instead.  

