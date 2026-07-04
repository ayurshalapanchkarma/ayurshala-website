# Clinical Core EMR — Sprint 3 Ready to Implement

**Last Updated**: 2026-07-05 00:47 UTC  
**Build Status**: ✅ Passing (0 errors, 9.5s)  
**Production Status**: ⏳ Pending runtime verification before release

---

## Current Implementation Status

| Sprint | Scope | Status |
|--------|-------|--------|
| 1 | Patient Visit & Vitals | ✅ Implementation complete |
| 2 | Consultation & SOAP Notes | ✅ Implementation complete |
| 3 | Ayurvedic Assessment | 🚀 Ready to implement |
| 4 | Diagnosis & Prescription | 📋 Planned |
| 5 | Panchakarma & Therapy | 📋 Planned |
| 6 | Follow-up & Clinical Timeline | 📋 Planned |

---

## Sprint 3: Ayurvedic Assessment (Locked Scope)

### Implement Only

- Prakriti (constitution assessment)
- Vikriti (current imbalance)
- Nadi Pariksha (pulse assessment)
- Dashavidha Pariksha (10-fold examination)
- Ashtavidha Pariksha (8-fold examination)
- Agni (digestive fire)
- Kostha (body type)
- Ojas (vital essence)
- Satva (mental clarity)
- Assessment summary (clinical observations)

### Architectural Decision

- **Structured relational fields** (not JSON blob)
- **Strong typing** on each observation
- **Foreign key to visit_uuid** (no duplication)
- **Analytics-friendly schema** (enables reporting)
- **Optional free-text summary** (doctor observations)

### Sprint 3 Deliverables

**Database Migration**:
- Assessment table with structured columns
- Indexes on visit_uuid, doctor_uuid, status, created_at
- RLS policies (doctor owner, reception read, admin all)
- Timeline trigger for ASSESSMENT_COMPLETED event

**Backend Service**:
- `createAssessment()` → DRAFT status
- `getAssessment()` → fetch with context
- `updateAssessment()` → partial updates, reject if finalized
- `finalizeAssessment()` → status→FINALIZED, immutable

**API Endpoints**:
- POST `/api/emr/visits/[visitId]/assessment` → create
- GET `/api/emr/visits/[visitId]/assessment` → fetch
- PUT `/api/emr/visits/[visitId]/assessment` → update/finalize

**Frontend**:
- Assessment form (all fields, dosha display)
- Finalized read-only view (form disabled)

**Build & Test**:
- `npm run build` → zero TypeScript errors
- Smoke test: Create → refresh → finalize → immutable → timeline logged once
- Regression: Sprint 1 (check-in/vitals) unchanged, Sprint 2 (consultation) unchanged

**Commit**:
- One implementation commit (all code included)
- Update `CLINICAL_CORE_STATUS.md` if needed

### Out of Scope (Defer to Sprint 4)

- ❌ Diagnosis or condition names
- ❌ Treatment recommendations
- ❌ Prescription generation
- ❌ Pharmacy integration

---

## Development Pattern (Sprints 3-6)

For each remaining sprint:

```
Migration (tables, indexes, RLS, triggers)
    ↓
Service (implement required methods)
    ↓
API (create endpoints)
    ↓
UI (build forms and views)
    ↓
Build (npm run build, verify 0 errors)
    ↓
Smoke Test (DB + API + UI + persistence + immutability)
    ↓
Regression Test (Sprints 1-N workflows unchanged)
    ↓
Implementation Commit (one commit per sprint)
    ↓
Next Sprint
```

---

## Repository Rules

✅ **One implementation commit per sprint**  
✅ **One status file** (`CLINICAL_CORE_STATUS.md`)  
✅ **No duplicate planning documents**  
✅ **Git history documents implementation progress**  

---

## Architecture (Locked)

```
Patient
    ↓
Booking
    ↓
Visit (single clinical anchor)
    ├── Vitals (Sprint 1) ✅
    ├── Consultation & SOAP (Sprint 2) ✅
    ├── Ayurvedic Assessment (Sprint 3)
    ├── Diagnosis & Prescription (Sprint 4)
    ├── Panchakarma & Therapy (Sprint 5)
    └── Follow-up & Clinical Timeline (Sprint 6)
```

**Design Principles**:
- All records link to `visit_uuid` (no duplicates)
- Additive schema evolution only (no Visit rewrites)
- Structured fields for analytics
- Immutable finalization (status FINALIZED blocks edits)

---

## Release Path (After Sprints 3-6 Complete)

1. Deploy all 6 database migrations to Supabase
2. Execute comprehensive end-to-end verification
3. Fix any defects discovered during verification
4. Tag release: `git tag clinical-core-complete`
5. Deploy to production via Vercel

---

## Project State

✅ Sprint 1: Implemented  
✅ Sprint 2: Implemented  
🚀 Sprint 3: Ready to build  
✅ Architecture: Locked (Visit anchor, additive changes)  
✅ Build: Passing  
⏳ Runtime verification: Required before production  

**Next Milestone**: Complete Sprint 3 → pass build + smoke test → confirm no regressions → one implementation commit → move to Sprint 4.
