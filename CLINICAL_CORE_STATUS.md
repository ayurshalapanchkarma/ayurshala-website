# Clinical Core EMR — Sprint 3 Ready to Implement

**Last Updated**: 2026-07-05 00:50 UTC  
**Build**: ✅ Passing  
**Runtime verification**: ⏳ Pending  
**Production**: ⏳ Pending completion of Sprints 3–6 and final end-to-end verification

---

## Current Status

| Sprint | Scope | Status |
|--------|-------|--------|
| ✅ 1 | Patient Visit & Vitals | Implementation complete |
| ✅ 2 | Consultation & SOAP Notes | Implementation complete |
| 🚀 3 | Ayurvedic Assessment | Ready to implement |
| 📋 4 | Diagnosis & Prescription | Planned |
| 📋 5 | Panchakarma & Therapy | Planned |
| 📋 6 | Follow-up & Clinical Timeline | Planned |

---

## Sprint 3: Ayurvedic Assessment (Locked Scope)

### Implement Only

- Prakriti (constitution)
- Vikriti (current imbalance)
- Nadi Pariksha (pulse assessment)
- Dashavidha Pariksha (10-fold examination)
- Ashtavidha Pariksha (8-fold examination)
- Agni (digestive fire)
- Kostha (body type)
- Ojas (vital essence)
- Satva (mental clarity)
- Assessment summary (clinical observations)

### Out of Scope

- Diagnosis
- Prescription
- Panchakarma workflow
- Billing integration

### Architecture

- Structured relational schema
- Strongly typed fields
- Foreign key to `visit_uuid`
- No duplicated patient or booking data
- Optional clinical summary

### Sprint 3 Deliverables

| Component | Deliverable |
|-----------|-------------|
| **Database** | Migration, indexes, RLS, timeline trigger |
| **Backend** | Create, Get, Update, Finalize methods |
| **API** | POST, GET, PUT endpoints |
| **Frontend** | Assessment form + finalized read-only view |
| **Build** | Zero TypeScript errors |
| **Verification** | Smoke test + regression test |
| **Git** | One implementation commit |

---

## Development Pattern

```
Migration
    ↓
Service
    ↓
API
    ↓
UI
    ↓
Build
    ↓
Smoke Test
    ↓
Regression Test
    ↓
Commit
```

---

## Clinical Data Model

```
Visit (Primary Clinical Anchor)
├── Vitals                  ✅ Sprint 1
├── Consultation & SOAP     ✅ Sprint 2
├── Ayurvedic Assessment    🚀 Sprint 3
├── Diagnosis               📋 Sprint 4
├── Prescription            📋 Sprint 4
├── Panchakarma             📋 Sprint 5
└── Follow-up               📋 Sprint 6
```

All clinical records reference `visit_uuid`. Schema evolution remains additive.

---

## Definition of Done (Every Sprint)

Before moving to next sprint, verify:

✅ **Database migration succeeds on clean database**  
✅ **Database migration succeeds on existing dev database (no data loss)**  
✅ **Build passes** (`npm run build`, 0 errors)  
✅ **Smoke tests pass** (feature works, data persists after refresh)  
✅ **Regression tests pass** (prior sprints unchanged)  
✅ **One implementation commit** (all code included)

## Repository Rules

✅ One implementation commit per sprint  
✅ One status document (`CLINICAL_CORE_STATUS.md`)  
✅ No duplicate planning/status documents  
✅ Git history records implementation progress

---

## Release Gate (Must All Pass Before Production)

✅ Sprints 1–6 implemented  
✅ All database migrations succeed on clean database  
✅ All database migrations succeed on existing dev database (no data loss)  
✅ `npm run build` passes with zero errors  
✅ Smoke tests pass for every sprint  
✅ Regression tests pass across all workflows  
✅ End-to-end patient journey verification passes  
✅ Production environment variables and migrations applied  
✅ Release tag created  
✅ Production deployment succeeds  
✅ Post-deployment health check passes  

---

## Next Milestone

Complete Sprint 3:

1. Implement database migration
2. Implement service layer
3. Implement API
4. Implement UI
5. Pass build (`npm run build`)
6. Pass Sprint 3 smoke test
7. Verify Sprint 1–2 regressions
8. Create Sprint 3 implementation commit
9. Continue to Sprint 4

---

**State**: Sprints 1-2 implemented, Sprint 3 ready to code. Build passing. Runtime verification pending before production release.
