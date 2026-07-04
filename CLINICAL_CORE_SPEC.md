# Ayurshala Clinical Core — Architecture & Implementation Summary

**Project**: Ayurshala Clinic — Clinical EMR System  
**Version**: v1.0 (Pre-Release)  
**Status**: Code Complete, Ready for Staging Deployment  
**Last Updated**: 2026-07-05

---

## Executive Summary

The Ayurshala Clinical Core is a complete electronic medical record (EMR) system designed for a small Ayurvedic clinic. It follows a **6-sprint vertical-slice architecture** where each sprint builds one complete clinical module (database → backend → API → frontend) linked to a central Visit entity.

**Key Achievement**: Single Visit record anchors all clinical data (vitals, consultation, assessment, diagnosis, prescription, treatment, follow-up). Every action is immutable after finalization and auto-logged to a unified timeline.

---

## Architecture Overview

### Core Model: Visit-Centric Design

```
Patient (via appointment) → Visit (PRIMARY ANCHOR)
                              ├── Vitals (Sprint 1)
                              ├── Consultation & SOAP (Sprint 2)
                              ├── Ayurvedic Assessment (Sprint 3)
                              ├── Diagnosis & Prescription (Sprint 4)
                              ├── Panchakarma & Therapy (Sprint 5)
                              └── Follow-ups (Sprint 6)
                                  
All linked via: visit_uuid (Foreign Key)
All logged to: emr_visit_timeline (Event log)
All immutable: After FINALIZED/DISPENSED status
```

### Database Schema (6 Tables + Timeline)

| Table | Purpose | Records per Visit | Status Machine |
|-------|---------|-------------------|-----------------|
| `emr_visit` | Clinic visit anchor | 1 (UNIQUE) | CHECKED_IN → IN_CONSULTATION → PRESCRIPTION_READY → THERAPY_ASSIGNED → COMPLETED |
| `emr_consultation` | SOAP notes | 1 (UNIQUE) | DRAFT → FINALIZED |
| `emr_ayurvedic_assessment` | Dosha, nadi, pulse analysis | 1 (UNIQUE) | DRAFT → FINALIZED |
| `emr_diagnosis` | Clinical diagnosis | 1 (UNIQUE) | DRAFT → FINALIZED |
| `emr_prescription` | Medicines & dosage | 1 (UNIQUE) | DRAFT → FINALIZED → DISPENSED |
| `emr_treatment_plan` | Panchakarma plan | 1 (UNIQUE) | DRAFT → ACTIVE → COMPLETED / CANCELLED |
| `emr_therapy_session` | Individual therapy sessions | Multiple per plan | SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED |
| `emr_follow_up` | Follow-up appointments | Multiple per visit | SCHEDULED → COMPLETED / CANCELLED |
| `emr_visit_timeline` | Event audit log | Multiple | (immutable, read-only) |

### Key Constraints

1. **One Record per Visit Type**: UNIQUE(visit_uuid) enforced on Consultation, Assessment, Diagnosis, Prescription, Treatment Plan
2. **Immutability**: Service layer blocks edits on FINALIZED/DISPENSED/COMPLETED records
3. **Cascading Deletes**: Deleting a visit cascades to all linked records
4. **Foreign Keys**: All clinical records require valid visit_uuid
5. **RLS (Row-Level Security)**:
   - Doctors can edit own records only
   - Reception can view (read-only)
   - Admin can view/edit/delete all
   - Pharmacist can view prescriptions only

---

## Sprint Breakdown

### Sprint 1: Patient Visit & Vitals ✅
- **Database**: `emr_visit`, `emr_visit_timeline`
- **Backend**: `VisitService` (8 methods)
- **API**: 7 endpoints (create, list, get, status transitions, vitals, timeline)
- **Frontend**: 4 pages (check-in, vitals form, queue, visit details)
- **Key Feature**: Daily visit number generation, status machine, timeline logging

### Sprint 2: Consultation & SOAP Notes ✅
- **Database**: `emr_consultation` (UNIQUE on visit_uuid)
- **Backend**: `ConsultationService` (4 methods: create, get, update, finalize)
- **API**: 3 endpoints (POST, GET, PUT)
- **Frontend**: Consultation form + list page
- **Key Feature**: SOAP note structure (Subjective, Objective, Assessment, Plan), immutability after finalization

### Sprint 3: Ayurvedic Assessment ✅
- **Database**: `emr_ayurvedic_assessment` (structured fields, not JSON)
- **Backend**: `AyurvedicAssessmentService` (4 methods)
- **API**: 3 endpoints
- **Frontend**: Assessment form with 12+ Ayurvedic fields
- **Key Feature**: Prakriti, Vikriti, Nadi, Doshas, Agni, Ojas, Satva assessments

### Sprint 4: Diagnosis & Prescription ✅
- **Database**: `emr_diagnosis`, `emr_prescription` (both UNIQUE per visit)
- **Backend**: 2 service classes, 8 methods total
- **API**: 6 endpoints (3 each for diagnosis, prescription)
- **Frontend**: Unified diagnosis-prescription form page
- **Key Feature**: Optional FK from prescription to diagnosis, 3-state prescription status (DRAFT → FINALIZED → DISPENSED)

### Sprint 5: Panchakarma Management ✅
- **Database**: `emr_treatment_plan`, `emr_therapy_session`
- **Backend**: `TreatmentPlanService`, `TherapySessionService` (8 methods)
- **API**: 4 endpoints (treatment plan + therapy sessions)
- **Frontend**: Treatment plan form + therapy session scheduling
- **Key Feature**: Multiple therapy sessions per plan, oils/medicines tracking, duration & temperature recording

### Sprint 6: Follow-up & Clinical Timeline ✅
- **Database**: `emr_follow_up`
- **Backend**: `FollowUpService`, `TimelineService` (5 methods)
- **API**: 3 endpoints (list, create, update follow-ups; timeline view)
- **Frontend**: Timeline page with follow-up sidebar
- **Key Feature**: Unified timeline view of all 6 sprints, auto-logged events, read-only audit trail

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (React 19) + TypeScript | Full-stack SSR web app |
| **Styling** | Tailwind CSS | Responsive UI |
| **Backend** | Next.js API Routes | RESTful endpoints |
| **Database** | PostgreSQL (Supabase) | ACID compliance, RLS |
| **ORM** | Supabase JS Client | Type-safe queries |
| **Auth** | Supabase Auth + RLS | Role-based access control |
| **Hosting** | Vercel (frontend) + Supabase (database) | Serverless, auto-scaling |

---

## API Endpoints (17 Total)

### Sprint 1: Visits
- `POST /api/emr/visits` — Create visit
- `GET /api/emr/visits` — List visits
- `GET /api/emr/visits/[visitId]` — Get visit detail
- `PUT /api/emr/visits/[visitId]` — Update visit status
- `POST /api/emr/visits/[visitId]/vitals` — Record vitals
- `GET /api/emr/visits/[visitId]/timeline` — Get timeline events
- `POST /api/emr/visits/[visitId]/timeline/log-event` — Manually log event

### Sprint 2: Consultation
- `GET /api/emr/visits/[visitId]/consultation`
- `POST /api/emr/visits/[visitId]/consultation`
- `PUT /api/emr/visits/[visitId]/consultation`

### Sprint 3: Assessment
- `GET /api/emr/visits/[visitId]/assessment`
- `POST /api/emr/visits/[visitId]/assessment`
- `PUT /api/emr/visits/[visitId]/assessment`

### Sprint 4: Diagnosis & Prescription
- `GET /api/emr/visits/[visitId]/diagnosis`
- `POST /api/emr/visits/[visitId]/diagnosis`
- `PUT /api/emr/visits/[visitId]/diagnosis`
- `GET /api/emr/visits/[visitId]/prescription`
- `POST /api/emr/visits/[visitId]/prescription`
- `PUT /api/emr/visits/[visitId]/prescription`

### Sprint 5: Panchakarma
- `GET /api/emr/visits/[visitId]/treatment-plan`
- `POST /api/emr/visits/[visitId]/treatment-plan`
- `PUT /api/emr/visits/[visitId]/treatment-plan`
- `GET /api/emr/visits/[visitId]/therapy-session` (query-based)
- `POST /api/emr/visits/[visitId]/therapy-session`
- `PUT /api/emr/visits/[visitId]/therapy-session`

### Sprint 6: Follow-up & Timeline
- `GET /api/emr/visits/[visitId]/follow-ups`
- `POST /api/emr/visits/[visitId]/follow-ups`
- `PUT /api/emr/visits/[visitId]/follow-ups/[followUpId]`
- `GET /api/emr/visits/[visitId]/timeline`

---

## Frontend Pages (8 Total)

### Doctor Views
- `/doctor/check-in` — Check in a patient (start visit)
- `/doctor/vitals/[visitId]` — Record vitals
- `/doctor/consultation/[visitId]` — SOAP notes
- `/doctor/assessment/[visitId]` — Ayurvedic assessment
- `/doctor/diagnosis-prescription/[visitId]` — Diagnosis & prescription (tabbed form)
- `/doctor/panchakarma/[visitId]` — Treatment plan + therapy scheduling
- `/doctor/timeline/[visitId]` — Clinical timeline + follow-up scheduling

### Reception Views
- `/reception/visits` — View all visits (read-only)

---

## Immutability & Status Machines

### Visit Status Flow
```
CHECKED_IN (initial)
  ↓
IN_CONSULTATION (after consultation finalized)
  ↓
PRESCRIPTION_READY (after prescription finalized)
  ↓
THERAPY_ASSIGNED (after treatment plan activated)
  ↓
COMPLETED (final)
```

### Consultation Status
```
DRAFT (editable) → FINALIZED (immutable)
```

### Prescription Status
```
DRAFT (editable) → FINALIZED (immutable) → DISPENSED (immutable)
```

### Treatment Plan Status
```
DRAFT (editable) → ACTIVE (sessions ongoing) → COMPLETED (immutable) or CANCELLED
```

**Enforcement**: Service layer throws error if editing FINALIZED/DISPENSED/COMPLETED record. Frontend disables form fields.

---

## Timeline Event Types (11 Total)

Every action auto-logs to `emr_visit_timeline`:
1. `CHECK_IN` — Visit started
2. `VITALS_RECORDED` — Vitals entered
3. `CONSULTATION_COMPLETED` — SOAP notes finalized
4. `AYURVEDIC_ASSESSMENT_COMPLETED` — Assessment finalized
5. `DIAGNOSIS_FINALIZED` — Diagnosis finalized
6. `PRESCRIPTION_CREATED` — Prescription finalized
7. `TREATMENT_PLAN_CREATED` — Treatment plan initiated
8. `THERAPY_SESSION_COMPLETED` — Therapy session completed
9. `TREATMENT_PLAN_COMPLETED` — All therapy sessions done
10. `FOLLOW_UP_SCHEDULED` — Follow-up created
11. `FOLLOW_UP_COMPLETED` — Follow-up attended

**No duplicates**: Triggers ensure each event logs exactly once (trigger fires on status change, not on every update).

---

## RLS Security Model

### Doctor Role
- ✅ CREATE own records
- ✅ EDIT own DRAFT records
- ❌ EDIT finalized records
- ✅ VIEW own records
- ❌ VIEW other doctor's records
- ✅ FINALIZE (status transition)

### Reception Role
- ✅ SELECT all records (read-only)
- ❌ INSERT, UPDATE, DELETE
- Cannot finalize or change status

### Admin Role
- ✅ SELECT, INSERT, UPDATE, DELETE all records
- Override immutability constraints
- Access to all patient data

### Pharmacist Role
- ✅ SELECT prescriptions only
- ❌ ACCESS consultation, assessment, diagnosis
- Can mark prescription as DISPENSED (if implemented)

### Therapist Role
- ✅ SELECT therapy sessions assigned to them
- ✅ UPDATE session status
- ❌ ACCESS treatment plan creation
- ✅ RECORD observations & patient response

---

## Data Integrity Checks

### Constraints Enforced
1. **No orphaned records**: All clinical records must have valid visit_uuid (FK enforced)
2. **No duplicate records per visit**: UNIQUE(visit_uuid) on Consultation, Assessment, Diagnosis, Prescription, Treatment Plan
3. **Cascading deletes**: Deleting a visit deletes all related records
4. **No NULL doctor_uuid**: All records require creator/owner identification
5. **Immutability after finalization**: Application layer prevents edits

### Verification Queries
SQL script (`verification/sql-integrity-check.sql`) checks:
- Zero orphaned records in all tables
- FK references valid
- No constraint violations
- Timeline event counts reasonable

---

## Build & Deployment

### Build Status
- ✅ `npm run build` passes (0 TypeScript errors)
- ✅ All migrations syntactically correct
- ✅ All API routes type-safe
- ✅ No missing environment variables at build time

### Deployment Targets
- **Frontend**: Vercel (auto-deploy on git push)
- **Database**: Supabase (PostgreSQL 14+)
- **Migrations**: Manual via psql or Supabase UI

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (server-only)
```

---

## Known Limitations & Future Work

### Clinical Core (Frozen After v1.0)
- No changes except critical bug fixes
- All future features built on top

### Non-Core Modules (Future)
- [ ] Analytics & reporting (read clinical data, generate reports)
- [ ] Automated reminders (email/SMS to patients)
- [ ] Inventory management (medicines, oils)
- [ ] Billing integration (sync with POS)
- [ ] Patient portal (self-service booking, history view)
- [ ] Mobile app (React Native or native iOS/Android)
- [ ] Prescription printing/PDF generation
- [ ] Multi-location support

---

## Git Repository Structure

```
ayurshala-website/
├── migrations/
│   ├── sprint1_patient_visit_emr.sql
│   ├── sprint2_consultation_soap.sql
│   ├── sprint3_ayurvedic_assessment.sql
│   ├── sprint4_diagnosis_prescription.sql
│   ├── sprint5_panchakarma.sql
│   └── sprint6_follow_up.sql
├── lib/emr/
│   ├── visit.service.ts
│   ├── consultation.service.ts
│   ├── ayurvedic-assessment.service.ts
│   ├── diagnosis-prescription.service.ts
│   ├── panchakarma.service.ts
│   └── follow-up.service.ts
├── app/api/emr/
│   └── visits/[visitId]/
│       ├── route.ts
│       ├── vitals/route.ts
│       ├── consultation/route.ts
│       ├── assessment/route.ts
│       ├── diagnosis/route.ts
│       ├── prescription/route.ts
│       ├── treatment-plan/route.ts
│       ├── therapy-session/route.ts
│       ├── follow-ups/route.ts
│       └── timeline/route.ts
├── app/doctor/
│   ├── check-in/page.tsx
│   ├── vitals/[visitId]/page.tsx
│   ├── consultation/[visitId]/page.tsx
│   ├── assessment/[visitId]/page.tsx
│   ├── diagnosis-prescription/[visitId]/page.tsx
│   ├── panchakarma/[visitId]/page.tsx
│   └── timeline/[visitId]/page.tsx
├── verification/
│   └── sql-integrity-check.sql
├── STAGING_DEPLOYMENT.md (this file)
├── RELEASE_CHECKLIST.md
└── git tags: clinical-core-v1.0 (after UAT)
```

---

## Rollback Plan

If production issues discovered:

1. **Immediate rollback**:
   ```bash
   git revert clinical-core-v1.0
   vercel --prod  # Deploy previous version
   ```

2. **Database rollback**:
   ```bash
   # Supabase auto-backups every 24 hours
   # Restore from backup via Supabase UI
   ```

3. **Communication**:
   - Notify Dr. Sanjay immediately
   - Document issue
   - Schedule incident review

---

## Support & Maintenance

### Post-Release (Week 1)
- Daily monitoring (Vercel logs, Supabase metrics)
- On-call support for clinic staff
- Track and log any issues reported

### Bug Fix Process
1. Doctor/staff reports issue
2. Dev reproduces in staging
3. Fix applied, tested locally
4. Deploy to staging for doctor verification
5. Deploy to production
6. Tag: `clinical-core-v1.0.1`, `v1.0.2`, etc.

### No Feature Changes
The Clinical Core is **frozen** after v1.0. Any new capabilities (analytics, automation, reporting, etc.) are built as separate modules on top of this stable foundation.

---

**Next Step**: Deploy to staging and execute verification checklist in `STAGING_DEPLOYMENT.md`.
