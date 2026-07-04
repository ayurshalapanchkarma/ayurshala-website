# Sprint 1: Patient Visit EMR — User Acceptance Test (UAT)

## Acceptance Criteria (Locked)

Sprint 1 is **COMPLETE** when all scenarios pass end-to-end.

### Reception User Stories

**US1: Check-In an Existing Patient**

```gherkin
Given reception opens /reception/checkin
When they search for "Raj Kumar"
And they select him from the dropdown
And they assign "Dr. Sanjay"
And they record chief complaint "Headache"
And they click "Check In & Record Vitals"
Then the system redirects to vitals form
And a visit is created with visit_number = VIS-YYYYMMDD-0001
And the visit_status is CHECKED_IN
And a CHECK_IN timeline event is created
```

**US2: Record Vitals**

```gherkin
Given reception is on /reception/vitals/{visitId}
When they enter:
  | Field | Value |
  | Systolic BP | 120 |
  | Diastolic BP | 80 |
  | Pulse | 72 |
  | Temperature | 98.6 |
  | Height | 170 |
  | Weight | 70 |
And they click "Save Vitals"
Then vitals are saved to emr_visit
And BMI is calculated as 24.22
And a VITALS_RECORDED timeline event is created with metadata
And the form redirects to /reception/queue
```

**US3: See Patient in Doctor's Queue**

```gherkin
Given vitals have been saved for "Raj Kumar"
When reception opens /reception/queue (or any queue view)
Then they see "Raj Kumar" with:
  | Field | Expected |
  | Visit Number | VIS-20260704-0001 |
  | Token | 1 |
  | Patient Name | Raj Kumar |
  | Phone | 9821224767 |
  | Status | Waiting |
  | Waiting Time | 2 min |
```

---

### Doctor User Stories

**US4: Doctor Sees Queue on Login**

```gherkin
Given Dr. Sanjay opens /doctor/queue
Then they see a dashboard with:
  | Card | Expected |
  | Total Patients | 1 |
  | Waiting | 1 |
  | In Progress | 0 |
  | Ready for Pharmacy | 0 |
And they see a table with columns:
  | Token | Visit # | Patient | Phone | Status | Waiting | Action |
  | 1 | VIS-20260704-0001 | Raj Kumar | 9821... | Waiting | 2 min | Open |
```

**US5: Open Patient Visit**

```gherkin
Given Dr. Sanjay clicks "Open" for Token 1
When the page loads /doctor/visit/{visitId}
Then they see:
  | Section | Content |
  | Header | Visit #VIS-20260704-0001, Status: "Waiting" |
  | Patient Info | Name: Raj Kumar, Phone: 9821... |
  | Vitals | BP 120/80, Pulse 72, Temp 98.6°C, etc. |
  | Timeline | CHECK_IN, VITALS_RECORDED events |
And status buttons are available:
  | Button | Enabled |
  | In Consultation | Yes |
  | Prescription Ready | Yes |
  | Therapy Assigned | Yes |
  | Complete | Yes |
  | Cancel Visit | Yes |
```

**US6: Change Status to In Consultation**

```gherkin
Given Dr. Sanjay is viewing the visit
When they click "In Consultation"
Then:
  | Check | Expected |
  | visit_status updates to | IN_CONSULTATION |
  | UI status badge changes to | "In Progress" (blue) |
  | Timeline gets new event | CONSULTATION_STARTED |
  | Doctor queue refreshes | Status shows "In Progress" |
And if Dr. navigates back to /doctor/queue:
  | Field | Expected |
  | Raj Kumar's Status | In Progress (blue badge) |
  | Waiting Time | 5 min (continues counting) |
```

---

## Test Data Setup

### Pre-requisites

1. **Database migration applied**: `sprint1_patient_visit.sql` executed
2. **Patient exists in DB**:
   ```sql
   INSERT INTO patients (id, name, phone, email)
   VALUES ('patient-uuid', 'Raj Kumar', '9821224767', 'raj@example.com')
   ON CONFLICT DO NOTHING;
   ```

3. **Doctor exists in profiles**:
   ```sql
   INSERT INTO profiles (id, name, role)
   VALUES ('doctor-uuid', 'Dr. Sanjay', 'DOCTOR')
   ON CONFLICT DO NOTHING;
   ```

4. **Booking exists** (optional, for booking flow):
   ```sql
   INSERT INTO bookings_new (patient_uuid, doctor_uuid, preferred_date, preferred_time, status)
   VALUES ('patient-uuid', 'doctor-uuid', CURRENT_DATE, '14:00', 'CONFIRMED')
   ON CONFLICT DO NOTHING;
   ```

---

## Execution Steps

### Phase 1: Reception Workflow (30 minutes)

#### Step 1.1: Navigate to Check-In Page
- [ ] Open http://localhost:3000/reception/checkin
- [ ] Page loads without errors
- [ ] Form fields visible: Patient Search, Doctor, Visit Type, Chief Complaint

#### Step 1.2: Search Patient
- [ ] Type "Raj" in patient search
- [ ] Dropdown shows "Raj Kumar" with phone
- [ ] Click to select
- [ ] Input field updates to "Raj Kumar"

#### Step 1.3: Select Doctor & Record Chief Complaint
- [ ] Click Doctor dropdown
- [ ] "Dr. Sanjay" appears in list
- [ ] Select "Dr. Sanjay"
- [ ] Visit Type auto-set to "OPD"
- [ ] Type "Headache" in chief complaint

#### Step 1.4: Submit Check-In
- [ ] Click "Check In & Record Vitals"
- [ ] Form submits without errors
- [ ] Redirects to /reception/vitals/{visitId}
- [ ] Visit number displayed (e.g., "Visit #VIS-20260704-0001")

#### Step 1.5: Record Vitals
- [ ] Record following vitals:
  - Systolic BP: 120
  - Diastolic BP: 80
  - Pulse: 72
  - Temp: 98.6
  - Height: 170 cm
  - Weight: 70 kg
- [ ] BMI auto-calculates to 24.22 (check display)
- [ ] Click "Save Vitals"

#### Step 1.6: Database Verification (Phase 1)
```sql
-- Run in Supabase SQL Editor
SELECT 
  uuid, visit_number, visit_status, 
  systolic_bp, pulse_rate, bmi,
  checked_in_at, vitals_recorded_at
FROM emr_visit
WHERE patient_uuid = 'patient-uuid'
  AND DATE(visit_date) = CURRENT_DATE
LIMIT 1;

-- Expected: 1 row with VIS-YYYYMMDD-0001, status CHECKED_IN, vitals populated

SELECT event_type, title, created_at
FROM emr_visit_timeline
WHERE visit_uuid = (SELECT uuid FROM emr_visit WHERE patient_uuid = 'patient-uuid' LIMIT 1)
ORDER BY created_at ASC;

-- Expected: 2 events (CHECK_IN, VITALS_RECORDED)
```

---

### Phase 2: Doctor Workflow (30 minutes)

#### Step 2.1: Open Doctor Queue
- [ ] Navigate to http://localhost:3000/doctor/queue
- [ ] Page loads without errors
- [ ] Summary cards visible: Total (1), Waiting (1), In Progress (0), Ready (0)

#### Step 2.2: Verify Queue Display
- [ ] Table shows 1 row:
  - [ ] Token: 1
  - [ ] Visit #: VIS-20260704-0001
  - [ ] Patient: Raj Kumar
  - [ ] Phone: 9821...
  - [ ] Status: Waiting (yellow badge)
  - [ ] Waiting Time: ~X min
- [ ] "Open" button visible and clickable

#### Step 2.3: Auto-Refresh Queue
- [ ] Checkbox "Auto-refresh" is checked
- [ ] Queue refreshes every 30 seconds (manual test not needed, but log display time)
- [ ] Click "Refresh" button manually
- [ ] Queue updates immediately

#### Step 2.4: Open Patient Visit
- [ ] Click "Open" for Token 1
- [ ] Redirects to /doctor/visit/{visitId}
- [ ] Page loads without errors

#### Step 2.5: Verify Visit Details
- [ ] Header shows: "Visit #VIS-20260704-0001" ✓
- [ ] Status badge: "Waiting" (yellow)
- [ ] Patient section: Raj Kumar, 9821224767
- [ ] Vitals displayed:
  - [ ] BP (Systolic): 120 mmHg
  - [ ] BP (Diastolic): 80 mmHg
  - [ ] Pulse: 72 bpm
  - [ ] Temperature: 98.6 °C
  - [ ] BMI: 24.22 kg/m²
- [ ] Timeline section shows events:
  - [ ] CHECK_IN (with timestamp)
  - [ ] VITALS_RECORDED (with timestamp)

#### Step 2.6: Change Status
- [ ] Click "In Consultation" button
- [ ] Verify no errors in console
- [ ] Status badge changes to "In Progress" (blue)
- [ ] Timeline updates with new CONSULTATION_STARTED event
- [ ] Buttons update (greyed out accordingly)

#### Step 2.7: Verify Queue Auto-Update
- [ ] Navigate back to /doctor/queue
- [ ] Raj Kumar's row shows:
  - [ ] Status: "In Progress" (blue badge)
  - [ ] Waiting time increased (e.g., 7 min instead of 2 min)

#### Step 2.8: Database Verification (Phase 2)
```sql
SELECT visit_status FROM emr_visit
WHERE visit_number = 'VIS-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-0001';

-- Expected: IN_CONSULTATION

SELECT event_type, title, created_at
FROM emr_visit_timeline
WHERE visit_uuid = (
  SELECT uuid FROM emr_visit 
  WHERE visit_number LIKE 'VIS-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-%'
  LIMIT 1
)
ORDER BY created_at ASC;

-- Expected: 3 events (CHECK_IN, VITALS_RECORDED, CONSULTATION_STARTED)
```

---

## Pass/Fail Criteria

### ✅ PASS if:
- [ ] All 8 steps in Phase 1 complete without errors
- [ ] All 8 steps in Phase 2 complete without errors
- [ ] Database queries return expected results
- [ ] Timeline events logged correctly (no duplicates)
- [ ] Visit number generated correctly (VIS-YYYYMMDD-0001)
- [ ] Status transitions work end-to-end
- [ ] No console errors or 500 responses

### ❌ FAIL if:
- Any step produces an error
- Visit number is not generated
- Timeline events are duplicated or missing
- Status transitions don't persist
- Doctor queue doesn't update
- Vitals not saved correctly
- BMI calculation incorrect

---

## Additional Test Scenarios (Optional)

### Scenario A: Multiple Patients (Concurrency Test)

```gherkin
Given reception checks in 2 patients simultaneously (5 seconds apart):
  Patient 1: Amit, Dr. Sanjay
  Patient 2: Bhavna, Dr. Sanjay

Then visit numbers generated are:
  Patient 1: VIS-20260704-0001
  Patient 2: VIS-20260704-0002

And no duplicate numbers exist
And doctor queue shows both with tokens 1 and 2
```

**Test Steps**:
1. In Terminal 1, start check-in for Amit
2. Submit vitals
3. In Terminal 2, start check-in for Bhavna
4. Submit vitals
5. Verify /doctor/queue shows both patients with sequential tokens

### Scenario B: Status Transitions

```gherkin
Given a visit is checked in
When doctor transitions: CHECKED_IN → IN_CONSULTATION → PRESCRIPTION_READY → COMPLETED
Then each transition creates a timeline event
And all transitions are recorded in database
And no invalid transitions occur
```

**Test Steps**:
1. From visit details, click each status button in sequence
2. After each click, verify:
   - UI status badge updates
   - New timeline event appears
   - Database status updated
3. Verify all 4 timeline events present

### Scenario C: Walk-In Patient (Optional)

```gherkin
Given a patient not in system
When reception checks in as walk-in (no booking)
Then visit is created with is_walkin = TRUE
And visit appears in doctor queue normally
And no booking linkage required
```

**Test Steps**:
1. Modify check-in form to create new patient on-the-fly (future UI)
2. Submit vitals for walk-in
3. Verify is_walkin flag in database

---

## Sign-Off

When all tests pass:

```
Date: ________________
Tester: ________________
Status: ✅ PASSED / ❌ FAILED

Issues Found (if any):
_________________________________________________________________
_________________________________________________________________

Sign-off: ________________
```

---

## Next: Sprint 2 Readiness

Once Sprint 1 UAT passes, **freeze the code**:

```bash
git tag clinical-core-sprint1
git checkout -b sprint2/consultation
```

Sprint 2 will add:
- SOAP notes (Subjective, Objective, Assessment, Plan)
- Examination findings
- Clinical observations
- Links to prescriptions and assessments

**Do not expand Sprint 1 further.**

---

## Troubleshooting

### Visit not appearing in queue
- Check: Is visit_status = 'CHECKED_IN'?
- Check: Is visit_date = CURRENT_DATE?
- Check: Is patient_uuid linked correctly?

### Visit number not generated
- Check: Did migration run successfully?
- Check: Function `emr_generate_visit_number()` exists?
- Check: No duplicate visit_number in DB?

### Timeline events missing
- Check: Are triggers created?
- Check: Did transaction commit?
- Check: Any trigger errors in logs?

### BMI not calculated
- Check: Both height_cm and weight_kg provided?
- Check: Values in reasonable range (>0)?
- Check: Formula: weight_kg / (height_m²)?

### Status not updating
- Check: PUT request succeeded (200 status)?
- Check: updated_by UUID valid?
- Check: visit_status valid enum value?

---
