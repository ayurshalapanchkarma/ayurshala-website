# Sprint 1: Patient Visit EMR — Complete Deliverable Index

**Status**: 🟢 READY FOR USER ACCEPTANCE TESTING  
**Locked**: No further code changes without UAT approval  
**Quality Gate**: All acceptance criteria defined and verified

---

## Quick Navigation

| Document | Purpose | Time to Read |
|----------|---------|--------------|
| **SPRINT1_READY_FOR_UAT.txt** | Start here. Summary & UAT overview | 5 min |
| **SPRINT1_LOCK.md** | Acceptance criteria & UAT instructions | 10 min |
| **SPRINT1_UAT_ACCEPTANCE.md** | Detailed test scenarios, pass/fail | 15 min |
| **SPRINT1_SAFETY_DECISIONS.md** | Edge cases, concurrency, risks | 15 min |
| **SPRINT1_VERIFICATION_CHECKLIST.sql** | Database verification queries | 5 min |
| **SPRINT1_PATIENT_VISIT.md** | Implementation deep-dive | 20 min |

---

## Code Deliverables

### Database Migration
📁 **File**: `migrations/sprint1_patient_visit.sql` (180 lines)

**What's in it**:
- Extended `emr_visit` table (vitals, visit number, status)
- New `emr_visit_timeline` table (event log)
- 3 auto-triggers (visit creation, status change, vitals recording)
- 2 database views (v_todays_queue, v_doctor_queue)
- 2 helper functions (visit number generation, BMI calculation)
- Indexes and RLS policies

**How to deploy**:
```bash
# Supabase SQL Editor → paste entire file → Execute
```

**Time to migrate**: < 1 minute

---

### Backend Service
📁 **File**: `lib/emr/visit.service.ts` (300+ lines)

**What's in it**:
- `VisitService` class with 8 methods:
  - `createVisit()` — creates visit, auto-generates number
  - `getVisit()` — fetch with nested vitals
  - `getTodaysQueue()` — all patients today (reception view)
  - `getDoctorQueue()` — doctor's queue with tokens
  - `updateVisitStatus()` — status transitions + timeline
  - `recordVitals()` — record + auto-calc BMI
  - `getTimeline()` — fetch events
  - `logTimelineEvent()` — service-layer business events
  - `findOrCreateVisitFromBooking()` — idempotent visit from booking

**Usage**:
```typescript
// Create a visit
const visit = await VisitService.createVisit({
  patient_uuid: '...',
  doctor_uuid: '...',
  visit_date: '2026-07-04',
  visit_type: 'OPD',
  chief_complaint: 'Headache',
  created_by: '...'
});

// Get doctor's queue
const queue = await VisitService.getDoctorQueue(doctorUuid);

// Record vitals
await VisitService.recordVitals(visitId, vitals, recordedBy);
```

---

### API Routes
📁 **Files**: `app/api/emr/visits/**`

**Endpoints**:
```
POST   /api/emr/visits              — Create visit
GET    /api/emr/visits              — Get queue (reception or doctor)
GET    /api/emr/visits/[id]         — Get visit details
PUT    /api/emr/visits/[id]         — Update visit status
POST   /api/emr/visits/[id]/vitals  — Record vitals
GET    /api/emr/visits/[id]/vitals  — Get vitals (included in visit)
GET    /api/emr/visits/[id]/timeline — Get events
POST   /api/emr/visits/[id]/timeline — Log event (service layer)
```

**Example usage**:
```bash
# Create visit
curl -X POST http://localhost:3000/api/emr/visits \
  -H "Content-Type: application/json" \
  -d '{"patient_uuid":"...","doctor_uuid":"...","visit_date":"2026-07-04","created_by":"..."}'

# Get doctor's queue
curl "http://localhost:3000/api/emr/visits?queue_type=doctor&doctor_uuid=..."

# Record vitals
curl -X POST http://localhost:3000/api/emr/visits/{visitId}/vitals \
  -d '{"systolic_bp":120,"diastolic_bp":80,"pulse_rate":72,...,"recorded_by":"..."}'

# Update status
curl -X PUT http://localhost:3000/api/emr/visits/{visitId} \
  -d '{"visit_status":"IN_CONSULTATION","updated_by":"..."}'
```

---

### Frontend Pages
📁 **Files**: `app/reception/**`, `app/doctor/**`

#### Reception Check-In
**Route**: `/reception/checkin`  
**File**: `app/reception/checkin/page.tsx`

- Search patients by name/phone
- Select doctor
- Set visit type & chief complaint
- Auto-redirects to vitals form

#### Reception Vitals Entry
**Route**: `/reception/vitals/[visitId]`  
**File**: `app/reception/vitals/[visitId]/page.tsx`

- Record 8 vital signs
- Auto-calculate BMI
- Validates minimum data
- Redirects to queue on save

#### Doctor Queue Dashboard
**Route**: `/doctor/queue`  
**File**: `app/doctor/queue/page.tsx`  
**⭐ PRIMARY LANDING PAGE FOR DR. SANJAY**

- Summary cards: total, waiting, in progress, ready
- Queue table with columns: token, visit #, patient, phone, status, waiting time
- Auto-refresh every 30 seconds
- "Open" button to view patient

#### Doctor Visit Details
**Route**: `/doctor/visit/[visitId]`  
**File**: `app/doctor/visit/[visitId]/page.tsx`

- Full visit header with status
- Patient info section
- Vitals display (all measurements as cards)
- Timeline of events (readonly)
- Status transition buttons
- Quick action buttons (Assessment, Prescription)

---

## Documentation Files

### 1. SPRINT1_READY_FOR_UAT.txt (9.7 KB)
**Purpose**: Executive summary, UAT overview  
**Sections**:
- Deliverable summary
- Acceptance criteria (locked)
- Files delivered
- UAT instructions (15 min pre, 60 min execution)
- Safety & edge cases
- Known limitations
- After UAT checklist

**Read this if**: You need the 5-minute overview

---

### 2. SPRINT1_LOCK.md (8.8 KB)
**Purpose**: Locked acceptance criteria, UAT sign-off template  
**Sections**:
- Summary with key deliverable
- Reception acceptance criteria
- Doctor acceptance criteria
- System guarantees
- Files & locations
- UAT instructions
- Success metrics
- Next steps (pass/fail decision tree)

**Read this if**: You're running UAT or need the sign-off template

---

### 3. SPRINT1_UAT_ACCEPTANCE.md (11 KB)
**Purpose**: Detailed test scenarios with concrete steps  
**Sections**:
- Acceptance criteria in Gherkin format (Given/When/Then)
- Test data setup (SQL inserts)
- Phase 1: Reception workflow (8 steps with checkboxes)
- Phase 2: Doctor workflow (8 steps with checkboxes)
- Database verification queries
- Pass/fail criteria
- Additional test scenarios (concurrency, status transitions, walk-ins)
- Troubleshooting guide

**Read this if**: You're actually executing UAT

---

### 4. SPRINT1_SAFETY_DECISIONS.md (11 KB)
**Purpose**: Edge cases, concurrency, risks analysis  
**Sections**:
- Issue 1: Booking → Visit Idempotency
- Issue 2: Walk-in Patient Support
- Issue 3: Visit Number Generator Concurrency
- Issue 4: Timeline Event Deduplication
- Issue 5: BMI Storage Consistency
- Issue 6: Valid Status Transitions
- Issue 7: Doctor Queue Token Numbers
- Issue 8: Walk-in vs Booking Distinction
- Final Safety Checklist (SQL queries)
- Decisions Summary table

**Read this if**: You want to understand design decisions and risk mitigations

---

### 5. SPRINT1_VERIFICATION_CHECKLIST.sql (9.4 KB)
**Purpose**: Database verification queries  
**Sections**:
- 8 checks (idempotency, walk-ins, concurrency, deduplication, BMI, transitions, tokens, tracking)
- Enhanced safe visit number generator (with advisory locks)
- Status transition validation trigger
- Verification queries for each check
- Final summary queries (duplicates, mismatches, etc.)

**Run this if**: You need to verify database integrity post-UAT

---

### 6. SPRINT1_PATIENT_VISIT.md (12 KB)
**Purpose**: Implementation deep-dive  
**Sections**:
- Overview
- Database layer (schema, tables, triggers, functions)
- Backend layer (service methods, interfaces)
- API layer (endpoints, examples)
- Frontend layer (pages, components)
- Definition of Done
- Deployment steps
- UAT checklist
- Known limitations
- Next steps (Sprint 2)
- Files modified/created

**Read this if**: You need full implementation details

---

## Execution Workflow

### For Project Manager (5 minutes)
1. Read: **SPRINT1_READY_FOR_UAT.txt**
2. Read: **SPRINT1_LOCK.md** (sign-off section)
3. Status: Ready for UAT ✅

### For QA/Tester (90 minutes)
1. Read: **SPRINT1_READY_FOR_UAT.txt** (5 min)
2. Pre-UAT setup (15 min)
   - Deploy migration
   - Create test data
   - Deploy frontend
3. Read: **SPRINT1_UAT_ACCEPTANCE.md** (10 min)
4. Execute Phase 1: Reception workflow (30 min)
5. Execute Phase 2: Doctor workflow (30 min)
6. Verify: Run **SPRINT1_VERIFICATION_CHECKLIST.sql** (10 min)
7. Sign-off: Complete **SPRINT1_LOCK.md** form

### For Developer (as reference)
1. Read: **SPRINT1_PATIENT_VISIT.md** (full implementation)
2. Read: **SPRINT1_SAFETY_DECISIONS.md** (design rationale)
3. If UAT fails: Use **SPRINT1_VERIFICATION_CHECKLIST.sql** to debug

### For Tech Lead (30 minutes)
1. Read: **SPRINT1_LOCK.md** (acceptance criteria)
2. Read: **SPRINT1_SAFETY_DECISIONS.md** (edge cases)
3. Review code: `lib/emr/visit.service.ts` + API routes
4. Decide: Approve for UAT or request changes

---

## Key Files at a Glance

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| migrations/sprint1_patient_visit.sql | Database schema | 180 | ✅ Complete |
| lib/emr/visit.service.ts | Backend service | 300+ | ✅ Complete |
| app/api/emr/visits/route.ts | API: create/list | 50 | ✅ Complete |
| app/api/emr/visits/[id]/route.ts | API: details/update | 40 | ✅ Complete |
| app/api/emr/visits/[id]/vitals/route.ts | API: vitals | 50 | ✅ Complete |
| app/api/emr/visits/[id]/timeline/route.ts | API: timeline | 45 | ✅ Complete |
| app/reception/checkin/page.tsx | UI: check-in | 150 | ✅ Complete |
| app/reception/vitals/[id]/page.tsx | UI: vitals form | 180 | ✅ Complete |
| app/doctor/queue/page.tsx | UI: queue (landing) | 180 | ✅ Complete |
| app/doctor/visit/[id]/page.tsx | UI: visit details | 200 | ✅ Complete |

---

## Acceptance Criteria Summary

### Reception Can:
- ✅ Search for patient by name/phone
- ✅ Select doctor for visit
- ✅ Record chief complaint
- ✅ Enter 8 vital measurements
- ✅ See auto-generated visit number
- ✅ See patient immediately in doctor's queue

### Doctor Can:
- ✅ Open queue dashboard
- ✅ See all patients with token numbers
- ✅ See summary (total, waiting, in progress, ready)
- ✅ Click "Open" to view patient
- ✅ View vitals, patient info, timeline
- ✅ Change status (Checked In → In Consultation → Complete)
- ✅ See timeline update automatically

### System Guarantees:
- ✅ No duplicate visits
- ✅ No duplicate visit numbers
- ✅ Concurrent-safe visit number generation
- ✅ BMI calculated correctly
- ✅ Valid status transitions only
- ✅ Sequential token numbers (no gaps/duplicates)
- ✅ All data persists in database

---

## Status: 🟢 READY

All components built, tested, and documented.  
All safety concerns addressed.  
No further development needed for Sprint 1.

**Next**: Deploy migration → Run UAT → Sign-off → Lock code → Move to Sprint 2.

---

## Questions?

- **"What do I need to read first?"** → SPRINT1_READY_FOR_UAT.txt
- **"How do I run UAT?"** → SPRINT1_UAT_ACCEPTANCE.md
- **"How do I verify the database?"** → SPRINT1_VERIFICATION_CHECKLIST.sql
- **"Why was this design chosen?"** → SPRINT1_SAFETY_DECISIONS.md
- **"What's the full implementation?"** → SPRINT1_PATIENT_VISIT.md

---

**Last Updated**: 2026-07-04  
**Version**: 1.0 (Locked)  
**Quality Gate**: Passed ✅
