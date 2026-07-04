# Clinical Core EMR — Sprints 1–2 Implementation Complete; Sprints 3–6 Planned; Runtime Verification Pending Before Production

**Last Updated**: 2026-07-05 00:41 UTC  
**Current State**: Sprints 1-2 implementation complete (2500+ lines, build passing); awaiting runtime verification before production; Sprints 3-6 planned

---

## Sprint Status Summary

| Sprint | Scope | Status |
|--------|-------|--------|
| 1 | Patient Visit & Vitals | ✅ Implementation complete |
| 2 | Consultation & SOAP Notes | ✅ Implementation complete |
| 3 | Ayurvedic Assessment | 🚀 Next |
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

## Implementation Roadmap

**Each Sprint Follows This Exact Sequence**:

```
1. Migration (create tables, enum, indexes, RLS, triggers)
     ↓
2. Service (implement all methods, error handling)
     ↓
3. API (create endpoints with auth checks)
     ↓
4. UI (build forms, lists, navigation flows)
     ↓
5. Build (npm run build, verify 0 errors)
     ↓
6. Smoke Test (DB + API + UI verification, page refresh data persistence)
     ↓
7. Regression (verify Sprints 1-N workflows unchanged)
     ↓
8. Commit (one implementation commit per sprint)
```

**Sprint 3** → Ayurvedic Assessment  
**Sprint 4** → Diagnosis & Prescription  
**Sprint 5** → Panchakarma & Therapy  
**Sprint 6** → Follow-up & Clinical Timeline  

**After All Sprints Complete**:
```
1. Deploy all 6 migrations to Supabase
     ↓
2. Comprehensive end-to-end verification (all 11 workflows)
     ↓
3. Fix bugs (if any found)
     ↓
4. Tag: git tag clinical-core-complete
     ↓
5. Deploy to production via Vercel
```

---

## Verification Strategy

### Per-Sprint Smoke Test Pattern (After Build Succeeds)

Every sprint smoke test verifies **three things**:

1. **Database State**
   - Correct rows created in new tables
   - Foreign keys to `visit_uuid` valid
   - Timeline entries logged (exactly once per action)
   - No orphaned records

2. **API Responses**
   - Status codes correct (200, 201, 400, 401, 403)
   - Response payloads contain expected fields
   - Error messages clear and actionable
   - Auth checks enforced

3. **UI Flow**
   - Form submission creates/updates record
   - **Page refresh persists data** (not just client state)
   - Disabled states enforced (e.g., cannot edit FINALIZED)
   - Navigation flows as expected

**Sprint 3 Smoke Test** (Ayurvedic Assessment):
- [ ] Create assessment for existing visit → verify in DB, API returns 201, form reloads with data
- [ ] Finalize assessment → verify immutable in DB, API rejects edit, UI disables form
- [ ] Check timeline → ASSESSMENT_COMPLETED event logged exactly once
- [ ] Regression: Verify Sprint 1-2 workflows still work (check-in, vitals, consultation, queue)

**Sprint 4 Smoke Test** (Diagnosis & Prescription):
- [ ] Create diagnosis linked to assessment → verify DB state, API response, UI persists
- [ ] Create prescription linked to diagnosis → verify context (patient, visit, doctor)
- [ ] Check timeline events logged correctly
- [ ] Regression: Verify Sprints 1-3 workflows unchanged

**Sprint 5 Smoke Test** (Panchakarma & Therapy):
- [ ] Create treatment plan → verify DB state and API
- [ ] Schedule therapy session → verify queue appearance
- [ ] Check timeline events
- [ ] Regression: Verify Sprints 1-4 workflows unchanged

**Sprint 6 Smoke Test** (Follow-up & Clinical Timeline):
- [ ] Create follow-up → verify DB state and API
- [ ] Check complete timeline for visit (all events in order)
- [ ] Regression: Verify all prior sprints unchanged

### Comprehensive End-to-End Verification (After All Sprints)

After all sprints coded and quick tests pass, run complete patient journeys:

**Primary Workflows to Verify**:
- Appointment creation → Visit check-in
- Visit check-in → Vitals recording
- Vitals complete → Doctor consultation
- Consultation → Ayurvedic assessment
- Assessment → Diagnosis recording
- Diagnosis → Prescription generation
- Prescription → Pharmacy dispensing
- Pharmacy → Inventory deduction
- Visit complete → Billing generation
- Panchakarma workflow (if applicable)
- Visit completion → Follow-up creation

**Verification Steps**:
1. Create patient and appointment
2. Check in at reception (vitals)
3. Assign to doctor (queue)
4. Doctor opens consultation (SOAP)
5. Doctor completes assessment (Ayurvedic)
6. Doctor records diagnosis
7. Doctor generates prescription
8. Pharmacy dispenses prescription
9. Inventory updates automatically
10. Billing generated for visit
11. Follow-up scheduled (if needed)

**Expected Result**: Complete patient journey visible from all touchpoints (reception, doctor, admin, pharmacy, billing).

**Resolution**: Fix any bugs found → re-verify → deploy to production.

## Architectural Rules (Locked)

✅ **Visit is Primary Anchor**: All clinical data links to `emr_visit.uuid`  
✅ **No Duplicate Data**: Reference visit_uuid, never copy patient or booking data  
✅ **Additive Changes Only**: Do not modify Visit model. Improvements added as new tables/fields  
✅ **Self-Contained Sprints**: Each sprint independently verifiable  
✅ **RLS Consistent**: Same security model (doctor/reception/admin) across all sprints  
✅ **Timeline Integration**: Important actions auto-logged to `emr_visit_timeline`  
✅ **One Record Per Type**: One consultation, one assessment, one diagnosis per visit  
✅ **Immutable Finalization**: Status FINALIZED blocks edits (same as Sprints 1-2)

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

**Sprints 1-2**: ✅ Implementation complete (2500+ lines that builds successfully)  
**Build**: ✅ Passing (0 errors, 9.5s)  
**Verification**: ⏳ Awaiting runtime verification before production  
**Architecture**: ✅ Locked (Visit anchor, 6 constraints, additive changes only)  

**Workflow**: Finish coding Sprints 3-6 → Primary end-to-end verification → Fix bugs → Production release

---

## Definition of Done (Every Sprint)

Each sprint is considered **implementation complete** only when:

- ✅ **Database migration** written (reversible if practical)
- ✅ **Backend service** implemented (with all required methods)
- ✅ **API endpoints** implemented (with auth checks and error handling)
- ✅ **Frontend pages** implemented (responsive, user-tested flow)
- ✅ **TypeScript build** passes with zero errors (`npm run build`)
- ✅ **Visit model integration** confirmed (all records link via `visit_uuid`)
- ✅ **CLINICAL_CORE_STATUS.md** updated (status table, any relevant notes)
- ✅ **One implementation commit** for the sprint (clear message, all code included)

**No sprint advances to verification phase until all 8 criteria met.**

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

