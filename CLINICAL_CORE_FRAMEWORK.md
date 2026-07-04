# Clinical Core: Six-Sprint Framework

**Status**: Sprint 1 Implementation Complete, Runtime Verification Pending  
**Date**: 2026-07-05  
**Discipline**: Each sprint is independently deployable and frozen after completion

---

## Sprint Completion Status

| Sprint | Module | Database | Backend | API | Frontend | Build | Runtime | Sign-Off |
|--------|--------|----------|---------|-----|----------|-------|---------|----------|
| 1 | Patient Visit | ✅ | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ |
| 2 | Consultation | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| 3 | Ayurvedic Assessment | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| 4 | Diagnosis & Prescription | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| 5 | Panchakarma | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| 6 | Follow-up & Timeline | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## Three Rules for All Sprints

### Rule 1: Deployable State
Each sprint leaves the application in a state that can be deployed to production.

- ✅ Database migrations are idempotent
- ✅ Backward-compatible with previous sprints
- ✅ API endpoints functional and documented
- ✅ Frontend pages usable end-to-end
- ✅ No breaking changes to prior sprints

### Rule 2: No Breaking Changes
Code added in Sprint N never breaks functionality from Sprint N-1.

- ✅ Existing tables/APIs remain unchanged (only extended, never modified)
- ✅ RLS policies respect doctor/reception/admin roles
- ✅ Timeline remains append-only (new event types, never deleted)
- ✅ Visit statuses only expand (new states added, old states preserved)

### Rule 3: Frozen After Implementation
After implementation, a sprint is locked. Only bug fixes allowed.

- ✅ No feature creep mid-sprint
- ✅ No scope expansion post-completion
- ✅ New requirements go to next sprint
- ✅ Bug fixes go to current sprint only if critical

---

## Sprint 1: Patient Visit ✅

**Status**: Implementation Complete, Runtime Verification Pending

### What Exists
- ✅ Complete, integrated code that **builds successfully**
- ✅ Ready for **runtime verification** in a live database
- ✅ Database migration: `migrations/sprint1_patient_visit.sql`
- ✅ Backend: `lib/emr/visit.service.ts`
- ✅ API: 7 endpoints in `app/api/emr/visits/**`
- ✅ Frontend: 4 pages (`/reception/**`, `/doctor/**`)

### What Doesn't Exist (Intentional)
- ❌ SOAP notes → Sprint 2
- ❌ Ayurvedic assessment → Sprint 3
- ❌ Diagnosis/prescription → Sprint 4
- ❌ Panchakarma → Sprint 5
- ❌ Follow-up scheduling → Sprint 6

### Verification Required
Before sign-off:
1. Deploy migration to live database
2. Run 7 critical verification tests (SPRINT1_FINAL_VERIFICATION.md)
3. Sign-off document
4. Tag: `git tag clinical-core-sprint1`

### No Changes After Sign-Off
- Sprint 1 code is frozen
- Only critical bug fixes allowed
- New features go to Sprint 2+

---

## Sprint 2: Consultation & SOAP Notes ⏳

**Scope**: Add digital consultation recording to existing visits

### What Will Be Built
- **Database**: emr_consultation table (links to emr_visit)
- **Backend**: ConsultationService (create, get, update)
- **API**: 5 endpoints for consultation CRUD
- **Frontend**: Consultation entry form + display

### Components
- Subjective (patient's story)
- Objective (examination findings, vital sign interpretation)
- Assessment (diagnosis impression)
- Plan (treatment recommendation)

### What Stays Untouched
- All Sprint 1 code remains frozen
- Visit creation workflow unchanged
- Doctor queue unchanged
- Timeline remains append-only (new CONSULTATION_COMPLETED event)

### Linked to Sprint 1
```
emr_visit (Sprint 1)
    ↓
emr_consultation (Sprint 2)
    ↓
[emr_diagnosis → Sprint 4]
[emr_prescription → Sprint 4]
[emr_treatment_plan → Sprint 5]
```

### Database Changes
- New table: `emr_consultation`
- New view: `v_consultation_history` (show past consultations for patient)
- New indexes: speed up consultation queries
- **No changes to Sprint 1 tables** (only extensions)

### Deliverable
- Doctor can:
  - Record SOAP notes during consultation
  - Save consultation to database
  - View past consultation history
  - Consultation appears in visit timeline

- Reception cannot see consultations (doctor-only)

### Sign-Off Criteria
- Consultation saved end-to-end
- History retrievable and queryable
- Timeline updated with CONSULTATION_COMPLETED
- No regressions to Sprint 1 (visit creation, queue, status still work)

---

## Sprint 3: Ayurvedic Assessment ⏳

**Scope**: Add Ayurvedic-specific assessment (what differentiates Ayurshala)

### Components
- Prakriti (constitutional type) with scoring
- Vikriti (current imbalance) with scoring
- Nadi Pariksha (pulse examination)
- Dashavidha Parikshan (10 examinations)
- Ashtavidha Parikshan (8 components)
- Agni, Kostha, Ojas, Satva assessment

### Linked to Sprint 1 & 2
```
emr_visit (Sprint 1)
    ↓
emr_consultation (Sprint 2)
    ↓
emr_ayurvedic_assessment (Sprint 3)
    ↓
[emr_diagnosis → Sprint 4]
```

### Deliverable
- Doctor can:
  - Record full Ayurvedic assessment after consultation
  - Score Prakriti/Vikriti (0-100 scales)
  - Document examination findings
  - Assessment appears in visit timeline

### No Changes to Previous Sprints
- Visit creation: unchanged
- Consultation: unchanged
- Doctor queue: unchanged

---

## Sprint 4: Diagnosis & Prescription ⏳

**Scope**: Clinical decision + medicine recommendation

### Components
- Ayurvedic diagnosis (with ICD coding)
- Dosha/Dhatu/Mala involvement
- Digital prescription (medicine + dosage + duration)
- Auto-link to pharmacy (bill draft creation)
- Prescription history

### Linked to Sprints 1-3
```
emr_visit
    ↓
emr_consultation
    ↓
emr_ayurvedic_assessment
    ↓
emr_diagnosis + emr_prescription (Sprint 4)
    ↓
ph_bills (existing pharmacy module)
```

### Deliverable
- Doctor can:
  - Enter diagnosis after assessment
  - Create digital prescription (auto-formatted)
  - Prescription auto-sends to pharmacy
  - Pharmacy creates draft bill (zero manual entry)
  - No duplicate medicines in prescriptions

### Integration Points
- Existing pharmacy module (no changes, only linkage)
- Existing billing module (no changes, only linkage)
- Existing inventory module (no changes, only linkage)

---

## Sprint 5: Panchakarma ⏳

**Scope**: Treatment plan + therapy session tracking

### Components
- Treatment plan (phases, objectives, expected outcome)
- Therapy sessions (therapist, room, oils, medicines, duration)
- Daily tracking (observations, patient response)
- Session completion status
- Outcome documentation

### Linked to Sprints 1-4
```
emr_visit
    ↓
emr_consultation
    ↓
emr_ayurvedic_assessment
    ↓
emr_diagnosis + emr_prescription
    ↓
emr_treatment_plan + emr_therapy_session (Sprint 5)
```

### Deliverable
- Doctor can:
  - Create treatment plan (specify which Panchakarma, duration, phases)
  - Therapist can:
    - Record session (what was done, how long, observations)
    - Track medicine/oil consumption
    - Document patient response
  - Doctor can:
    - Monitor ongoing therapy
    - Update plan if needed
    - Document final outcome

### New Integrations
- Therapist role (new permission level)
- Room/inventory tracking (tie to existing inventory)
- Session billing (link to existing billing)

---

## Sprint 6: Follow-up & Clinical Timeline ⏳

**Scope**: Continuity of care + clinical narrative

### Components
- Follow-up scheduling (auto-create from visit/treatment)
- Progress tracking (how patient doing since last visit?)
- Clinical timeline (complete patient journey, all sprints)
- Treatment history (what worked, what didn't)
- Automatic appointment creation

### Linked to All Previous Sprints
```
emr_visit → emr_consultation → emr_ayurvedic_assessment → 
emr_diagnosis → emr_prescription → emr_treatment_plan → 
emr_follow_up (Sprint 6)
    ↓
Timeline (aggregated view of entire journey)
```

### Deliverable
- Doctor can:
  - Schedule follow-up automatically
  - Record progress notes at each follow-up
  - View complete clinical timeline (all visits, consultations, treatments)
  - Track treatment outcomes over time

- Reception can:
  - See scheduled follow-ups
  - Auto-create appointments

- Patient (portal, future):
  - View their clinical journey
  - See upcoming follow-ups

---

## Interdependencies Map

```
Sprint 1: Patient Visit
    └─→ Visit creation, vitals, queue, status management

Sprint 2: Consultation
    └─→ SOAP notes attached to visits (depends on Sprint 1)

Sprint 3: Ayurvedic Assessment
    └─→ Assessment attached to consultations (depends on Sprint 2)

Sprint 4: Diagnosis & Prescription
    └─→ Diagnosis/Rx attached to assessments (depends on Sprint 3)
    └─→ Auto-bill creation (integrates with pharmacy, no changes)

Sprint 5: Panchakarma
    └─→ Treatment plan attached to prescriptions (depends on Sprint 4)
    └─→ Sessions recorded during therapy (depends on treatment plan)

Sprint 6: Follow-up
    └─→ Follow-ups linked to any prior sprint (depends on all)
    └─→ Timeline aggregates all sprints (depends on all)
```

---

## Implementation Rules

### For All Sprints
1. **Build successful**: `npm run build` must pass
2. **No breaking changes**: All prior sprint code untouched
3. **Deployable**: Migration + backend + API + frontend work together
4. **Frozen**: Once signed off, only bug fixes
5. **Independent**: Each sprint solves a complete workflow, not partial features

### Database Rule
- Extend, never modify existing tables
- New tables link via foreign keys to existing
- RLS policies respect existing roles
- Migrations are idempotent

### Code Rule
- Services inherit from prior sprints (VisitService → ConsultationService → etc.)
- APIs extend not replace (add /consultation, don't modify /visit)
- Frontend reuses components (queue page unchanged, new consultation page added)

### Testing Rule
- Each sprint has 7+ verification tests (like Sprint 1)
- Tests run end-to-end (database → API → frontend)
- All tests must pass before sign-off
- Tests remain in code for regression prevention

---

## Sign-Off Template (Every Sprint)

```
CLINICAL CORE SPRINT [N] SIGN-OFF

Date: ________________
Sprint: ________________
Components: ✅ Database ✅ Backend ✅ API ✅ Frontend ✅ Build ✅ Runtime

Verification Tests Passed: [7+]
- Test 1: ✅
- Test 2: ✅
- ...
- Test 7: ✅

No Regressions: ✅ (all prior sprints still work)
Breaking Changes: ❌ (none)
Frozen: ✅ (ready to tag)

Sign-off: ________________
```

---

## Git Tagging Strategy

```bash
# After each sprint signs off:
git tag clinical-core-sprint1
git tag clinical-core-sprint2
git tag clinical-core-sprint3
git tag clinical-core-sprint4
git tag clinical-core-sprint5
git tag clinical-core-sprint6

# Branch strategy:
main (production, tagged releases)
  ├─ sprint1/patient-visit (frozen after merge)
  ├─ sprint2/consultation (active)
  ├─ sprint3/ayurvedic-assessment (backlog)
  ├─ sprint4/diagnosis-prescription (backlog)
  ├─ sprint5/panchakarma (backlog)
  └─ sprint6/follow-up (backlog)
```

---

## Estimated Timeline

| Sprint | Focus | Effort | Timeline |
|--------|-------|--------|----------|
| 1 | Visit (✅ Complete) | Done | ✅ 2026-07-05 |
| 2 | Consultation | Horizontal (SOAP) | ~1 week |
| 3 | Assessment | Vertical (Ayurvedic) | ~1-2 weeks |
| 4 | Diagnosis & Rx | Horizontal (integration) | ~1-2 weeks |
| 5 | Panchakarma | Vertical (new roles) | ~1-2 weeks |
| 6 | Follow-up | Horizontal (aggregation) | ~1 week |
| **Total** | **Complete EMR** | | **~6-7 weeks** |

---

## Quality Gates

Each sprint must:
- ✅ Build successfully (`npm run build` → 0 errors)
- ✅ Have zero console errors
- ✅ Pass 7+ runtime verification tests
- ✅ Have zero breaking changes to prior sprints
- ✅ Be deployable to production (even if not deployed)
- ✅ Be frozen after sign-off (no feature creep)

---

## After All 6 Sprints

Clinical Core is complete and production-ready:
- ✅ Patient visits tracked end-to-end
- ✅ Consultations recorded digitally
- ✅ Ayurvedic assessments captured
- ✅ Diagnoses and prescriptions generated
- ✅ Panchakarma treatments monitored
- ✅ Follow-ups scheduled and tracked
- ✅ Complete clinical timeline maintained

Next phases (future):
- **Analytics**: OPD trends, Panchakarma statistics, revenue
- **Administration**: Clinic settings, backups, audit logs
- **Performance**: Caching, query optimization, production monitoring

---

## Current Position

**Now**: Sprint 1 implementation complete, awaiting runtime verification  
**Next**: 7 verification tests → sign-off → tag → Sprint 2 development begins  
**Goal**: Six independently deployable, testable milestones leading to complete EMR

