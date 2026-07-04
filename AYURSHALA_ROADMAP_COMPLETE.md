# Ayurshala ERP: Complete Roadmap

**Status**: Locked & Disciplined  
**Date**: 2026-07-05  
**Architecture**: Modular, independently deployable phases

---

## Module Status Overview

| Module | Status | Completion | Notes |
|--------|--------|-----------|-------|
| **Inventory Management** | ✅ Complete | 100% | Phase 1-13, all modules built |
| **Pharmacy POS** | ✅ Complete | 100% | Medicine sales, stock tracking, billing |
| **Clinic Billing** | ✅ Complete | 100% | Consultation & therapy billing |
| **Clinical Core – Sprint 1** | 🔄 Code Complete | 95% | Code done, runtime verification pending |
| **Clinical Core – Sprint 2** | ⏳ Next | 0% | Consultation & SOAP Notes |
| **Clinical Core – Sprint 3** | ⏳ Backlog | 0% | Ayurvedic Assessment |
| **Clinical Core – Sprint 4** | ⏳ Backlog | 0% | Diagnosis & Prescription |
| **Clinical Core – Sprint 5** | ⏳ Backlog | 0% | Panchakarma |
| **Clinical Core – Sprint 6** | ⏳ Backlog | 0% | Follow-up & Timeline |
| **Analytics & Reports** | ⏳ After Clinical Core | 0% | OPD trends, revenue, medicine usage |
| **Administration & Maintenance** | ⏳ Final | 0% | Clinic settings, backups, audit logs |

---

## Clinical Core: Data Architecture

**Single Anchor**: Visit (created in Sprint 1, extended by all subsequent sprints)

```
Patient (existing, reused)
    ↓
Appointment/Booking (existing, reused)
    ↓
Visit (Sprint 1) ← ANCHOR
    ├── Vitals (Sprint 1)
    ├── Consultation (Sprint 2)
    ├── Ayurvedic Assessment (Sprint 3)
    ├── Diagnosis (Sprint 4)
    ├── Prescription (Sprint 4)
    ├── Treatment Plan (Sprint 5)
    ├── Therapy Sessions (Sprint 5)
    └── Follow-up (Sprint 6)
```

**Key Rule**: Every clinical record in Sprints 2-6 must link to `emr_visit.uuid`. This ensures:
- Single source of truth (one visit per appointment)
- Complete patient journey visible from any sprint
- Seamless integration with Inventory, Pharmacy, Billing
- No duplicate clinical data

---

## Sprint-by-Sprint Workflow

### Sprint 1: Patient Visit ✅

**Current Phase**: Code Complete → Runtime Verification

```
Code Complete (✅ Done)
    ↓
Deploy Migration to Supabase
    ↓
Run 7 Verification Tests (~45 min)
    ↓
If Tests Fail → Fix Issues Immediately (while code fresh)
    ↓
All Tests Pass
    ↓
Sign-off Document
    ↓
Tag: git tag clinical-core-sprint1
    ↓
Sprint 1 FROZEN (no new features, only bug fixes)
```

**What's Delivered**:
- Visit creation, vitals recording
- Auto-generated visit numbers
- Doctor queue with tokens
- Status management & timeline
- Completely usable workflow

**Definition of Done**:
- All 7 verification tests pass
- Zero runtime errors
- Data persists correctly
- No regressions to existing modules

---

### Sprint 2: Consultation & SOAP Notes ⏳

**Workflow** (same pattern as Sprint 1):

```
Design & Implementation
    ↓
Backend: ConsultationService
    ↓
API: 5 endpoints
    ↓
Frontend: SOAP form + history display
    ↓
Build: npm run build (✅ must pass)
    ↓
Deploy: Add migration
    ↓
Runtime Verification (7 tests)
    ↓
If Tests Fail → Fix Immediately
    ↓
Sign-off
    ↓
Tag: git tag clinical-core-sprint2
    ↓
Sprint 2 FROZEN
```

**Data Linkage**:
```sql
emr_consultation
    ├── visit_uuid (links to Sprint 1 emr_visit)
    ├── subjective
    ├── objective
    ├── assessment
    └── plan
```

**What's Delivered**:
- Doctor records SOAP notes
- Consultation history visible
- Timeline updated automatically
- Consultation table indexed and queryable

**Non-Changes**:
- Sprint 1 code untouched
- Visit creation unchanged
- Doctor queue unchanged
- No breaking changes

---

### Sprint 3: Ayurvedic Assessment ⏳

**Workflow**: (same as Sprint 2)

**Data Linkage**:
```sql
emr_ayurvedic_assessment
    ├── visit_uuid (links to Sprint 1 emr_visit)
    ├── consultation_uuid (links to Sprint 2 emr_consultation)
    ├── prakriti (constitutional type with scoring)
    ├── vikriti (current imbalance with scoring)
    ├── nadi_findings
    ├── ashtavidha_findings
    └── clinical_observations
```

**What's Delivered**:
- Complete Ayurvedic assessment capture
- Prakriti/Vikriti scoring (0-100)
- 8-part examination documentation
- Assessment history & comparison over time

**This Sprint Differentiates Ayurshala** from generic EMRs.

---

### Sprint 4: Diagnosis & Prescription ⏳

**Data Linkage**:
```sql
emr_diagnosis
    ├── visit_uuid
    ├── consultation_uuid
    ├── assessment_uuid (links to Sprint 3)
    ├── ayurvedic_diagnosis
    ├── dosha_involvement
    └── treatment_recommendation

emr_prescription
    ├── visit_uuid
    ├── diagnosis_uuid
    ├── medicine_items
    └── auto_sends_to_pharmacy
```

**Integration Points**:
- Auto-creates draft bill in pharmacy (existing module)
- Uses inventory stock (existing module)
- No duplicate medicine entry
- Seamless flow: Diagnosis → Prescription → Pharmacy → Billing

---

### Sprint 5: Panchakarma ⏳

**Data Linkage**:
```sql
emr_treatment_plan
    ├── visit_uuid
    ├── prescription_uuid (links to Sprint 4)
    ├── panchakarma_type
    ├── phase_count
    └── duration

emr_therapy_session
    ├── visit_uuid
    ├── treatment_plan_uuid
    ├── therapist_uuid
    ├── room_id
    ├── medicines_used
    ├── oils_used
    ├── duration_minutes
    ├── patient_response
    └── next_session_date
```

**Integration Points**:
- Therapist role (new permission level)
- Room tracking (new resource type)
- Medicine/oil consumption (inventory deduction)
- Session billing (auto-create line item)

**What's Delivered**:
- Complete Panchakarma workflow (from planning to completion)
- Session-by-session tracking
- Outcome documentation
- Therapist accountability

---

### Sprint 6: Follow-up & Clinical Timeline ⏳

**Data Linkage**:
```sql
emr_follow_up
    ├── visit_uuid (original visit)
    ├── next_visit_uuid (new appointment)
    ├── progress_notes
    ├── treatment_response
    └── next_steps

emr_clinical_timeline (aggregated view)
    ├── visit → consultation → assessment → diagnosis
    ├── prescription → pharmacy_bill
    ├── treatment_plan → therapy_sessions → outcomes
    └── follow_up → progress
```

**What's Delivered**:
- Follow-up scheduling (automatic from any sprint)
- Progress tracking (patient improving or not?)
- Complete clinical narrative (one patient's journey)
- Treatment outcome tracking
- Patient portal access (future)

---

## Architecture Principle: Single Visit Anchor

**Every clinical record links to the Visit created in Sprint 1**:

```
Patient (UUID)
    ↓
Booking (date + doctor + time)
    ↓
Visit (Sprint 1, unique per booking)
    ├── visit_number: VIS-20260704-0001
    ├── visit_status: CHECKED_IN → IN_CONSULTATION → COMPLETED
    └── timeline: [events]
    
    ↓ All future sprints link here:
    
    ├── Consultation (Sprint 2)
    │   └── SOAP notes, history
    │
    ├── Assessment (Sprint 3)
    │   └── Ayurvedic findings
    │
    ├── Diagnosis (Sprint 4)
    │   └── Clinical impression
    │
    ├── Prescription (Sprint 4)
    │   └── Medicines (→ Pharmacy auto-bill)
    │
    ├── Treatment Plan (Sprint 5)
    │   └── Panchakarma schedule
    │
    ├── Therapy Sessions (Sprint 5)
    │   └── Session-by-session tracking
    │
    └── Follow-up (Sprint 6)
        └── Progress & next visit
```

**Benefits**:
- ✅ No duplicate clinical data
- ✅ Complete journey visible from any point
- ✅ Seamless pharmacy/billing integration
- ✅ Query any sprint's data by visit_uuid
- ✅ Audit trail immutable (timeline append-only)
- ✅ Scalable (add new clinical modules without redesign)

---

## Quality Gates (All Sprints)

Every sprint must:
1. ✅ **Build**: `npm run build` passes with zero errors
2. ✅ **Runtime Verification**: 7+ critical tests pass
3. ✅ **No Breaking Changes**: Prior sprints still work
4. ✅ **Frozen**: Tagged and locked after sign-off
5. ✅ **Single Anchor**: All data links to Visit

---

## Deployment Timeline

| Phase | Timeline | Deliverable |
|-------|----------|------------|
| Pre-Sprint 1 | ✅ Complete | Inventory, Pharmacy, Billing modules |
| Sprint 1 | Now | Patient visit module (code complete, verifying) |
| Sprint 1 Verification | < 1 hour | Runtime validation + sign-off |
| Sprint 2 | Week 2 | Consultation & SOAP notes |
| Sprint 3 | Week 3-4 | Ayurvedic assessment |
| Sprint 4 | Week 4-5 | Diagnosis & prescription |
| Sprint 5 | Week 5-6 | Panchakarma & therapy |
| Sprint 6 | Week 6-7 | Follow-up & timeline |
| **Complete EMR** | **~7 weeks** | Full clinical workflow |

---

## Risk Mitigation

### Idempotency
- Visit creation is idempotent (no duplicates)
- Each sprint preserves prior data (no deletions)

### Concurrency
- Advisory locks on visit numbers (per-day basis)
- No race conditions on timing fields

### Data Integrity
- Foreign keys from all sprints to Sprint 1 `emr_visit`
- Cascading deletes prevent orphans
- Audit trail (timeline) immutable

### Integration
- Pharmacy/billing modules unchanged (only extended)
- Existing inventory queries still work
- No schema modifications to prior modules

---

## Sign-Off Checklist (Each Sprint)

```
SPRINT [N] SIGN-OFF

Date: ________________
Code Complete: ✅
Build Passing: ✅
Runtime Tests Passed: ✅ (all 7)
No Regressions: ✅
Breaking Changes: ❌ (none)
Data Integrity: ✅
Ready to Freeze: ✅

Tag: git tag clinical-core-sprint[N]
Frozen: ✅ (no new features)

Next Sprint: clinical-core-sprint[N+1]
```

---

## Current Status Summary

| Area | Status | Notes |
|------|--------|-------|
| **Code** | ✅ Complete | All 4 layers (DB, backend, API, frontend) |
| **Build** | ✅ Passing | Zero TypeScript errors |
| **Runtime** | ⏳ Pending | 7 verification tests required |
| **Architecture** | ✅ Locked | Visit anchor, 6-sprint roadmap, 3 rules |
| **Discipline** | ✅ Enforced | Each sprint independent, frozen after sign-off |
| **Integration** | ✅ Designed | All modules link to single Visit entity |

---

## Next Action (Sprint 1)

1. ✅ Code complete (already done)
2. ⏳ Deploy migration to Supabase
3. ⏳ Run 7 verification tests
4. ⏳ Fix any bugs immediately (if found)
5. ⏳ Sign-off
6. ⏳ Tag `clinical-core-sprint1`
7. ✅ Begin Sprint 2 development

**Timeline**: < 1 hour verification → Ready for Sprint 2

---

## Summary

**Complete Ayurshala ERP** now consists of:
- ✅ Inventory (all 13 phases)
- ✅ Pharmacy POS
- ✅ Clinic Billing
- 🔄 Clinical Core – Sprint 1 (code complete, verifying)
- ⏳ Clinical Core – Sprints 2-6 (coming over next 6 weeks)

**Design Principle**: Single Visit entity is the anchor. Every clinical record links back to it. No duplicate data. Complete patient journey visible from any point.

**Process**: Each sprint is independent, testable, deployable, and frozen after sign-off.

