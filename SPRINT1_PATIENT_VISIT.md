# Sprint 1: Patient Visit EMR — Complete Implementation

## Overview

Sprint 1 implements the foundational patient visit workflow for Ayurshala EMR. This sprint delivers a complete end-to-end flow from patient check-in through vitals recording, with automatic doctor queue management.

**Status**: ✅ COMPLETE (Ready for Testing)

---

## What Was Built

### Database Layer

**File**: `migrations/sprint1_patient_visit.sql`

#### 1. Extended `emr_visit` Table
- Added visit number generation (VIS-YYYYMMDD-0001)
- Added vital signs fields (BP, pulse, temp, SpO2, height, weight, BMI)
- Added timing fields (checked_in_at, consultation_started_at, etc.)
- Auto-generates visit numbers on insert using trigger

#### 2. Created `emr_visit_timeline` Table
Generic event log table with:
- `event_type` (enum): CHECK_IN, VITALS_RECORDED, CONSULTATION_STARTED, etc.
- `title` & `description`: Human-readable event info
- `actor_uuid`: Who triggered the event
- `metadata` (JSONB): Event-specific data (extensible without schema changes)
- Automatically logs visit creation and status changes via triggers

#### 3. Visit Status Enum
States: CHECKED_IN → IN_CONSULTATION → PRESCRIPTION_READY → THERAPY_ASSIGNED → COMPLETED/CANCELLED

#### 4. Automated Triggers
- **trg_emr_visit_created**: Generates visit number, sets CHECK_IN event
- **trg_emr_visit_status_changed**: Logs status transitions
- **trg_emr_vitals_recorded**: Logs VITALS_RECORDED event with metadata

#### 5. Helper Functions
- `emr_generate_visit_number()`: Daily visit numbers VIS-YYYYMMDD-NNNN
- `emr_calculate_bmi(height, weight)`: BMI calculation
- Views for queues: `v_todays_queue`, `v_doctor_queue`

---

### Backend Layer

**File**: `lib/emr/visit.service.ts`

Core service class with methods:

| Method | Purpose |
|--------|---------|
| `createVisit()` | Create new visit from patient/doctor/date |
| `getVisit()` | Fetch visit with all nested data |
| `getTodaysQueue()` | All patients checked in today |
| `getDoctorQueue()` | Specific doctor's queue for today |
| `updateVisitStatus()` | Change visit status (triggers timeline event) |
| `recordVitals()` | Record patient vitals (auto-calculates BMI) |
| `getTimeline()` | Fetch visit events |
| `logTimelineEvent()` | Service-layer business events |
| `findOrCreateVisitFromBooking()` | Link booking to visit |

---

### API Layer

#### 1. Create & List Visits
**Route**: `POST/GET /api/emr/visits`

```bash
# Create visit
curl -X POST http://localhost:3000/api/emr/visits \
  -H "Content-Type: application/json" \
  -d '{
    "patient_uuid": "...",
    "doctor_uuid": "...",
    "visit_date": "2026-07-04",
    "visit_type": "OPD",
    "chief_complaint": "Headache",
    "created_by": "..."
  }'

# Get today's queue
curl http://localhost:3000/api/emr/visits

# Get doctor's queue
curl "http://localhost:3000/api/emr/visits?queue_type=doctor&doctor_uuid=..."
```

#### 2. Visit Details
**Route**: `GET/PUT /api/emr/visits/[visitId]`

```bash
# Get visit with vitals
curl http://localhost:3000/api/emr/visits/{visitId}

# Update visit status
curl -X PUT http://localhost:3000/api/emr/visits/{visitId} \
  -d '{"visit_status": "IN_CONSULTATION", "updated_by": "..."}'
```

#### 3. Record Vitals
**Route**: `POST/GET /api/emr/visits/[visitId]/vitals`

```bash
# Record vitals
curl -X POST http://localhost:3000/api/emr/visits/{visitId}/vitals \
  -d '{
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "pulse_rate": 72,
    "temperature_c": 98.6,
    "spo2": 98,
    "height_cm": 170,
    "weight_kg": 70,
    "recorded_by": "..."
  }'
```

#### 4. Timeline Events
**Route**: `GET/POST /api/emr/visits/[visitId]/timeline`

```bash
# Get timeline
curl http://localhost:3000/api/emr/visits/{visitId}/timeline

# Log business event (from service layer)
curl -X POST http://localhost:3000/api/emr/visits/{visitId}/timeline \
  -d '{
    "event_type": "PRESCRIPTION_CREATED",
    "title": "Prescription Generated",
    "description": "5 medicines prescribed",
    "actor_uuid": "...",
    "metadata": {"rx_count": 5}
  }'
```

---

### Frontend Layer

#### 1. Reception Check-In Page
**File**: `app/reception/checkin/page.tsx`

- Search patients by name/phone
- Select doctor
- Set visit type & chief complaint
- Auto-redirects to vitals entry

**Route**: `/reception/checkin`

#### 2. Vitals Entry Form
**File**: `app/reception/vitals/[visitId]/page.tsx`

- Record all vital signs
- Auto-calculates BMI
- Validates minimum data
- Redirects to queue on save

**Route**: `/reception/vitals/{visitId}`

#### 3. Doctor Queue Dashboard
**File**: `app/doctor/queue/page.tsx`

**This is the primary landing page for Dr. Sanjay.**

Features:
- Lists all patients checked in today
- Columns: Token #, Visit #, Patient Name, Phone, Status, Waiting Time
- Summary cards: Total patients, waiting, in progress, ready for pharmacy
- Auto-refresh every 30 seconds
- Manual refresh button
- Color-coded status badges

**Route**: `/doctor/queue`

#### 4. Visit Details Page
**File**: `app/doctor/visit/[visitId]/page.tsx`

Doctor opens a patient from queue:
- Full visit header with patient/doctor info
- Vitals display (all recorded values as cards)
- Status buttons: In Consultation → Prescription Ready → Therapy → Complete
- Timeline of all events (auto-updates)
- Quick action buttons: Assessment, Prescription

**Route**: `/doctor/visit/{visitId}`

---

## Definition of Done — Sprint 1

### ✅ Database
- [x] emr_visit extended with vitals fields
- [x] Visit number generation (VIS-YYYYMMDD-NNNN)
- [x] emr_visit_timeline table with event tracking
- [x] Status enum and transitions
- [x] Automatic triggers for timeline events
- [x] Indexes for performance
- [x] RLS policies for data access
- [x] Helper functions and views

### ✅ Backend
- [x] VisitService with 8 core methods
- [x] Vitals recording with auto-BMI
- [x] Doctor queue queries
- [x] Timeline event logging
- [x] Booking-to-visit linking

### ✅ API
- [x] POST /api/emr/visits (create)
- [x] GET /api/emr/visits (queue)
- [x] GET /api/emr/visits/[id] (details)
- [x] PUT /api/emr/visits/[id] (update status)
- [x] POST /api/emr/visits/[id]/vitals (record)
- [x] GET /api/emr/visits/[id]/timeline (events)
- [x] POST /api/emr/visits/[id]/timeline (log event)

### ✅ Frontend
- [x] Reception check-in page
- [x] Vitals form with validation
- [x] Doctor queue dashboard
- [x] Visit details with timeline
- [x] Status transitions UI
- [x] Auto-refresh queue

### ✅ End-to-End Workflow

```
Patient Arrives
      ↓
Reception searches & selects patient
      ↓
Reception assigns doctor, logs chief complaint
      ↓
Visit created (auto-numbered VIS-20260704-0001)
      ↓
Reception enters vitals
      ↓
Visit appears in Dr. Sanjay's queue with token #1
      ↓
Dr. opens visit from queue
      ↓
Sees all vitals, patient info, timeline
      ↓
Changes status → IN_CONSULTATION
      ↓
[Later: Create assessment, prescription, etc.]
      ↓
Changes status → COMPLETED
      ↓
System logs all events to timeline
```

---

## How to Deploy Sprint 1

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor, run:
-- Copy contents of migrations/sprint1_patient_visit.sql
-- Paste into SQL Editor
-- Execute
```

### Step 2: Verify Schema
```sql
-- Check visit table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'emr_visit' AND column_name LIKE '%bp%';

-- Check timeline table exists
SELECT * FROM emr_visit_timeline LIMIT 1;

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'emr_%';
```

### Step 3: Deploy Frontend
```bash
npm run build
npm run deploy  # or git push if using Vercel
```

### Step 4: UAT Checklist

#### Reception Flow
- [ ] Navigate to `/reception/checkin`
- [ ] Search for test patient
- [ ] Select doctor (Dr. Sanjay)
- [ ] Enter vitals
- [ ] Check visit number generated (VIS-YYYYMMDD-0001)
- [ ] Confirm vitals saved with no errors

#### Doctor Flow
- [ ] Navigate to `/doctor/queue`
- [ ] See patient in queue with token #1
- [ ] Click "Open"
- [ ] Verify vitals display correctly
- [ ] Click "In Consultation" button
- [ ] Check timeline updated
- [ ] Return to queue, verify status changed

#### Database Verification
- [ ] emr_visit record has visit_number
- [ ] emr_visit has vitals_recorded_at timestamp
- [ ] emr_visit_timeline has CHECK_IN event
- [ ] emr_visit_timeline has CONSULTATION_STARTED event
- [ ] BMI calculated correctly (weight / (height/100)²)

---

## Key Design Decisions

### 1. Why No Separate Vitals Table?
For a single clinic, vitals are recorded once per visit. Normalizing into a separate table adds complexity. If multi-recording is needed later, it can be added then.

### 2. Why JSONB Metadata?
Timeline events can have very different schemas (prescription has medicine counts, vitals have 8 measurements). JSONB allows extensibility without migrations.

### 3. Why Daily Visit Numbers?
- Human-readable on prescriptions and print-outs
- Resets naturally each day
- Works offline (no server round-trip for sequence)
- Patients easily remember: "I'm VIS-0005 today"

### 4. Why Not a Sequence?
PostgreSQL sequences don't reset daily. Would need complex triggers. Daily visit numbers are simpler and more practical.

### 5. Why Doctor Queue as Primary View?
Most clinics are doctor-centric. Dr. Sanjay needs to see his queue immediately on login. Reception views filtered queues later if needed.

---

## Testing Scenarios

### Scenario 1: Complete Check-In
1. Reception checks in patient "Raj Kumar"
2. Dr. Sanjay assigned
3. Vitals: BP 120/80, pulse 72, temp 98.6
4. Visit number: VIS-20260704-0001
5. Dr. sees token #1 in queue

**Expected**: All data persists, timeline has 2 events (CHECK_IN, VITALS_RECORDED)

### Scenario 2: Status Transitions
1. Dr. opens patient from queue
2. Clicks "In Consultation"
3. Verifies status changed in UI
4. Returns to queue, sees status updated

**Expected**: visit_status updated, timeline has CONSULTATION_STARTED event

### Scenario 3: Multiple Patients
1. Check in 3 patients consecutively
2. Verify visit numbers: VIS-20260704-0001, VIS-20260704-0002, VIS-20260704-0003
3. All visible in doctor queue with correct token numbers

**Expected**: Sequence increments, tokens are 1, 2, 3

### Scenario 4: Timeline Completeness
1. Complete full workflow
2. Navigate to visit, check timeline
3. Verify all events present with timestamps

**Expected**: CHECK_IN, VITALS_RECORDED, CONSULTATION_STARTED visible

---

## Known Limitations (By Design)

- ❌ No video consultation support yet (Sprint X)
- ❌ No appointment linking yet (will add in future sprint)
- ❌ No multi-visit recording (future: if needed)
- ❌ No doctor availability blocking (future: will add)
- ❌ No SMS/WhatsApp notifications (future: after basic flow)

These are intentionally omitted to keep Sprint 1 focused and deliverable.

---

## Next: Sprint 2 — Consultation

Sprint 1 creates the visit container. Sprint 2 adds consultation recording:

- SOAP Notes (Subjective, Objective, Assessment, Plan)
- Chief complaint expansion
- Examination findings
- Clinical observations

Once Sprint 2 is done, consultations become digital, and Dr. Sanjay can reference prior notes.

---

## Files Modified/Created

| File | Type | Status |
|------|------|--------|
| migrations/sprint1_patient_visit.sql | SQL Migration | ✅ |
| lib/emr/visit.service.ts | Backend Service | ✅ |
| app/api/emr/visits/route.ts | API Endpoints | ✅ |
| app/api/emr/visits/[visitId]/route.ts | API Endpoints | ✅ |
| app/api/emr/visits/[visitId]/vitals/route.ts | API Endpoints | ✅ |
| app/api/emr/visits/[visitId]/timeline/route.ts | API Endpoints | ✅ |
| app/reception/checkin/page.tsx | Frontend | ✅ |
| app/reception/vitals/[visitId]/page.tsx | Frontend | ✅ |
| app/doctor/queue/page.tsx | Frontend | ✅ |
| app/doctor/visit/[visitId]/page.tsx | Frontend | ✅ |

---

## Questions? Issues?

If there are any gaps in implementation, refer to:
- `phase7_clinical_emr.sql` — Core EMR schema definitions
- `supabase_migration.sql` — Patient/booking tables
- Existing services in `lib/inventory/` for patterns

Next commit: Run migration and UAT checklist.
