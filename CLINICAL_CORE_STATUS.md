# Clinical Core EMR — Status & Progress

**Last Updated**: 2026-07-05 00:33 UTC  
**Overall Status**: Two sprints coded, build passing, runtime verification pending

---

## Sprint Status Summary

| Sprint | Feature | Code | Build | Runtime | Sign-Off | Frozen |
|--------|---------|------|-------|---------|----------|--------|
| 1 | Patient Visit | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| 2 | Consultation & SOAP | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| 3 | Ayurvedic Assessment | ⏳ | — | — | — | — |
| 4 | Diagnosis & Prescription | ⏳ | — | — | — | — |
| 5 | Panchakarma & Therapy | ⏳ | — | — | — | — |
| 6 | Follow-up & Clinical Timeline | ⏳ | — | — | — | — |

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

## Next Sprint: Ayurvedic Assessment (Sprint 3)

**Focus**: Ayurvedic clinical assessment data only.

**Scope (Locked)**:
- Prakriti (constitution type: Vata, Pitta, Kapha, combinations)
- Vikriti (current imbalance)
- Nadi Pariksha (pulse assessment)
- Dashavidha Pariksha (10 diagnostic methods)
- Ashtavidha Pariksha (8 diagnostic examinations)
- Agni status (digestive fire assessment)
- Ojas level (vital essence assessment)
- Satva level (mental clarity assessment)
- General observations/notes

**Out of Scope** (defer to Sprint 4):
- Diagnosis/condition names
- Prescription generation
- Treatment planning

**Implementation Plan**:
1. Create `emr_ayurvedic_assessment` table (FK to visit)
2. Build `AyurvedicAssessmentService` (4 methods)
3. Add 3 API endpoints (create, get, update)
4. Build 2 UI pages (assessment form, list)
5. Build: ~3-4 hours, then verify

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

## Key Architecture

```
Patient
    ↓
Booking
    ↓
Visit (anchor point for all clinical data)
    ├── Vitals (Sprint 1)
    ├── Consultation & SOAP (Sprint 2)
    ├── Ayurvedic Assessment (Sprint 3, incoming)
    ├── Diagnosis (Sprint 4)
    ├── Prescription (Sprint 4)
    ├── Panchakarma Plan (Sprint 5)
    ├── Therapy Sessions (Sprint 5)
    └── Follow-ups (Sprint 6)
```

**No duplicate data**: Each clinical record links to Visit via foreign key.

---

## Constraints & Discipline

✅ **One record per type per visit**: e.g., one consultation, one assessment, one diagnosis  
✅ **Immutable after finalization**: Status FINALIZED blocks edits  
✅ **Doctor ownership**: Only creator can edit (RLS + service layer)  
✅ **Timeline integration**: Important actions logged automatically  
✅ **RLS enforced**: Doctor/reception/admin access control  
✅ **Backward compatible**: Each sprint frozen after sign-off  

---

## Code Status

**Written**: 2500+ lines (Sprints 1-2)  
**Build**: ✅ Passing (0 errors, 9.5s)  
**Runtime**: ⏳ Pending verification  
**Production**: ⏳ After tests pass  

**Next Action**: Verify Sprints 1-2, then begin Sprint 3

---

## Verification Checklist (Before Sign-Off)

Each sprint must pass before freezing:

**Sprint 1 (13 checks)**:
- [ ] Daily visit number reset works
- [ ] Concurrent check-ins get unique numbers
- [ ] BMI auto-calculated correctly
- [ ] Status transitions enforced
- [ ] Timeline events (exactly one per action)
- [ ] API create returns visit_number
- [ ] API vitals calculates BMI
- [ ] UI check-in → vitals flow works
- [ ] UI queue displays correctly
- [ ] UI visit details shows data
- [ ] Cannot move backward in status
- [ ] Cancelled booking handled
- [ ] RLS blocks cross-doctor access

**Sprint 2 (10 checks)**:
- [ ] UNIQUE(visit_uuid) enforced
- [ ] Concurrent creation (only 1 succeeds)
- [ ] Save Draft is idempotent
- [ ] Finalize is irreversible
- [ ] Timeline event logged once
- [ ] API rejects edits to finalized
- [ ] UI disables form when finalized
- [ ] Cascading delete works
- [ ] RLS enforces doctor ownership
- [ ] List page filters work

---

## Commit History

```
✅ clinical-core-sprint1-code (tag: stable checkpoint)
✅ Sprint 2 implementation + documentation
✅ Status update (this commit)
```

Next: Verify → Sign-off → Tag → Begin Sprint 3  

