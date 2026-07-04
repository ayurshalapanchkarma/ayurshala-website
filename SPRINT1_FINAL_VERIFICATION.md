# Sprint 1: Final Verification Checklist

**Status**: ⏳ PENDING UAT  
**Quality Gate**: Implemented, not yet validated in running application  
**Goal**: Verify 7 critical scenarios before tagging and freezing

---

## Pre-Verification Status

| Area | Status |
|------|--------|
| Database | ✅ Implemented |
| Backend | ✅ Implemented |
| API | ✅ Implemented |
| Frontend | ✅ Implemented |
| Architecture | ✅ Locked |
| Build | ✅ Passing |
| UAT | ⏳ Pending |
| Production Validation | ⏳ Pending |

---

## 7 Critical Verification Tests

### Test 1: Idempotency — Duplicate Check-In Prevention

**Scenario**: Reception clicks "Check In & Record Vitals" twice for the same patient in quick succession (or refreshes page mid-flow).

**Expected Behavior**:
- First submit: Visit created, visit_number = VIS-20260704-0001
- Second submit (same form data): Same visit returned, no new visit created
- No duplicate visits in database

**Test Steps**:
1. Open `/reception/checkin`
2. Search patient "Raj Kumar"
3. Select doctor, enter vitals
4. Click "Check In & Record Vitals"
5. **Before page redirects**, click button again (double-click or rapid retry)
6. OR: After redirect to vitals form, navigate back to check-in, submit same data again

**Verification**:
```sql
SELECT COUNT(*) as visit_count
FROM emr_visit
WHERE patient_uuid = (SELECT id FROM patients WHERE name = 'Raj Kumar')
  AND DATE(visit_date) = CURRENT_DATE;
-- Expected: 1 (not 2 or more)

SELECT COUNT(DISTINCT visit_number) as unique_numbers
FROM emr_visit
WHERE DATE(visit_date) = CURRENT_DATE;
-- Expected: same as total visit count
```

**Pass Criteria**: ✅ Only 1 visit created, no duplicates

---

### Test 2: Concurrent Visit Numbers

**Scenario**: Two receptionists check in different patients at exactly the same time.

**Expected Behavior**:
- Patient 1: VIS-20260704-0001
- Patient 2: VIS-20260704-0002
- No collision on visit numbers

**Test Steps**:
1. Open two browser windows
2. Window 1: Navigate to `/reception/checkin`, prepare to submit
3. Window 2: Navigate to `/reception/checkin`, prepare to submit
4. Both windows submit check-in forms **simultaneously** (within 1 second)
5. Wait for both to complete

**Verification**:
```sql
SELECT visit_number FROM emr_visit
WHERE DATE(visit_date) = CURRENT_DATE
ORDER BY created_at ASC;
-- Expected: VIS-20260704-0001, VIS-20260704-0002 (sequential, no duplicates)
```

**Pass Criteria**: ✅ Visit numbers sequential, no collisions

---

### Test 3: Cancelled Booking Rejection

**Scenario**: A booking is cancelled, then reception tries to check in the same patient with that booking ID.

**Expected Behavior**:
- Check-in should either:
  - A) Fail with error message ("Booking is cancelled"), OR
  - B) Create new visit with `appointment_uuid = NULL` (treat as walk-in)
- NOT: Create visit linked to cancelled booking

**Test Steps**:
1. Create a test booking with status = 'CANCELLED'
2. Try to check in with that booking
3. Observe what happens

**Verification**:
```sql
-- Option A: System rejects cancelled bookings
-- Query should show error message or validation failure in logs

-- Option B: System creates walk-in visit (no booking link)
SELECT is_walkin, appointment_uuid
FROM emr_visit
WHERE patient_uuid = 'test-patient-id'
  AND DATE(visit_date) = CURRENT_DATE;
-- Expected: is_walkin = TRUE or appointment_uuid = NULL
```

**Pass Criteria**: ✅ Either rejected with error OR created as walk-in (not linked to cancelled)

---

### Test 4: Doctor Queue Ordering Deterministic

**Scenario**: Multiple patients in queue; ordering should be consistent and predictable.

**Expected Behavior**:
- Patients ordered by `checked_in_at` (earliest first)
- Token numbers: 1, 2, 3, 4... (sequential, no gaps)
- Refreshing page: same ordering
- Navigating away and back: same ordering

**Test Steps**:
1. Check in 3 patients at 2-second intervals:
   - Amit at 14:00:00
   - Bhavna at 14:00:02
   - Chirag at 14:00:04
2. Open `/doctor/queue`
3. Note the order and token numbers
4. Refresh page (F5)
5. Note the order again — should be identical
6. Navigate to a visit, then back to queue
7. Note the order again — should still be identical

**Verification**:
```sql
SELECT 
  visit_number,
  checked_in_at,
  ROW_NUMBER() OVER (ORDER BY checked_in_at ASC) as token
FROM emr_visit
WHERE DATE(visit_date) = CURRENT_DATE
  AND visit_status != 'CANCELLED'
ORDER BY checked_in_at ASC;
-- Expected: Token 1, 2, 3 in checked_in_at order (no gaps)
```

**Pass Criteria**: ✅ Ordering deterministic, tokens sequential, no gaps

---

### Test 5: Timeline Event Uniqueness

**Scenario**: After a complete workflow (check-in → vitals → status change), timeline should have exactly 3 events, each appearing once.

**Expected Behavior**:
- CHECK_IN: 1 event (on visit creation)
- VITALS_RECORDED: 1 event (on vitals save)
- CONSULTATION_STARTED: 1 event (on status change)
- Total: 3 events, no duplicates

**Test Steps**:
1. Complete full workflow:
   - Check in patient
   - Record vitals
   - Open doctor visit
   - Click "In Consultation"
2. Navigate to visit details page
3. Check timeline section
4. Count events visually (should show 3)
5. Query database

**Verification**:
```sql
SELECT event_type, COUNT(*) as count
FROM emr_visit_timeline
WHERE visit_uuid = (
  SELECT uuid FROM emr_visit 
  WHERE patient_uuid = 'test-patient-id'
    AND DATE(visit_date) = CURRENT_DATE
  LIMIT 1
)
GROUP BY event_type;
-- Expected: 
-- CHECK_IN: 1
-- VITALS_RECORDED: 1
-- CONSULTATION_STARTED: 1

SELECT COUNT(*) as total_events
FROM emr_visit_timeline
WHERE visit_uuid = (SELECT uuid FROM emr_visit WHERE ... LIMIT 1);
-- Expected: 3 (exactly)
```

**Pass Criteria**: ✅ Each event type appears exactly once, total = 3

---

### Test 6: Valid Status Transitions Only

**Scenario**: Doctor can only transition through valid states. Invalid transitions should fail.

**Expected Behavior**:
- ✅ CHECKED_IN → IN_CONSULTATION (valid)
- ✅ IN_CONSULTATION → PRESCRIPTION_READY (valid)
- ✅ PRESCRIPTION_READY → COMPLETED (valid)
- ❌ CHECKED_IN → PRESCRIPTION_READY (invalid, should fail)
- ❌ IN_CONSULTATION → CHECKED_IN (invalid backward, should fail)
- ✅ Any → CANCELLED (valid emergency exit)

**Test Steps**:
1. Create a visit in CHECKED_IN state
2. Try: Click "In Consultation" button → should work
3. Try: Click "Prescription Ready" button → should work
4. Try: Navigate back to queue, manually construct request to go from PRESCRIPTION_READY to CHECKED_IN
   ```bash
   curl -X PUT http://localhost:3000/api/emr/visits/{visitId} \
     -d '{"visit_status":"CHECKED_IN","updated_by":"..."}'
   ```
   Should fail with validation error
5. Try: Click "Complete" from PRESCRIPTION_READY → should work
6. Try: Click "Cancel" button → should work

**Verification**:
```sql
-- Query timeline, verify all status transitions are valid
SELECT 
  lag(event_type) OVER (ORDER BY created_at) as from_event,
  event_type as to_event,
  COUNT(*) as count
FROM emr_visit_timeline
WHERE DATE(created_at) = CURRENT_DATE
  AND event_type IN ('CONSULTATION_STARTED', 'PRESCRIPTION_CREATED', ...)
GROUP BY from_event, to_event;
-- All transitions should be in valid state machine
```

**Pass Criteria**: ✅ Valid transitions work, invalid transitions fail with error

---

### Test 7: Browser Refresh & Navigation — No Stale Client State

**Scenario**: Data should always be fetched from backend, not cached on client.

**Expected Behavior**:
- Doctor opens queue
- Another reception checks in new patient
- First doctor refreshes page (F5)
- New patient appears in queue
- Doctor navigates away and back
- Queue still shows new patient
- No stale data, no "loading" indefinitely

**Test Steps**:
1. Doctor 1 opens `/doctor/queue`
2. Notes 1 patient in queue
3. In another window, Reception checks in new patient (Patient 2)
4. Doctor 1 presses F5 (refresh)
5. Wait for page to reload
6. Verify Patient 2 appears in queue (queue size = 2)
7. Doctor 1 clicks "Open" on Patient 1
8. Doctor 1 goes back to `/doctor/queue`
9. Verify both patients still visible
10. Doctor 1 navigates to `/doctor/visit/{visitId}` directly
11. Page loads with correct data (verify patient name, vitals)

**Verification**:
- Check browser Network tab: Each page load makes fresh API call
- Check API response timestamps: Each call returns current data
- Check console: No errors, no stuck loading states

**Example checks**:
```javascript
// In browser console, after refresh:
fetch('/api/emr/visits?queue_type=doctor&doctor_uuid=...')
  .then(r => r.json())
  .then(d => console.log(d.data.length)) // Should show 2
```

**Pass Criteria**: ✅ Data always fresh from backend, no stale client state

---

## Test Execution Order

1. **Local Testing** (Developer):
   - Test 1: Idempotency
   - Test 2: Concurrency
   - Test 7: Browser refresh

2. **UAT Testing** (Tester):
   - Test 1: Idempotency (repeat)
   - Test 3: Cancelled booking
   - Test 4: Queue ordering
   - Test 5: Timeline uniqueness
   - Test 6: Status transitions
   - Test 7: Browser refresh (repeat)

---

## Pass/Fail Decision Tree

```
All 7 tests pass?
├─ YES → Tag sprint, freeze code, proceed to Sprint 2
└─ NO → Document failures
    ├─ Critical (idempotency, concurrency, timeline) → Fix before tag
    ├─ Major (ordering, transitions) → Fix before tag
    └─ Minor (UI polish, error messages) → Log for Sprint 2, can tag
```

---

## Tagging & Freezing

### When All Tests Pass:

```bash
# Tag the sprint
git tag clinical-core-sprint1

# Push tag to remote
git push origin clinical-core-sprint1

# Create release notes file
cat > SPRINT1_RELEASE_NOTES.md << EOF
# Clinical Core - Sprint 1: Patient Visit EMR

## Release Date
2026-07-04

## Verified Workflows
- [x] Reception check-in with idempotency
- [x] Concurrent visit number generation
- [x] Doctor queue with deterministic ordering
- [x] Status transitions with validation
- [x] Timeline events without duplication
- [x] Data persistence and browser refresh handling

## Tested Scenarios
1. Idempotency: Duplicate check-in prevention
2. Concurrency: Simultaneous visit numbers
3. Cancelled booking rejection
4. Queue ordering deterministic
5. Timeline event uniqueness
6. Valid status transitions only
7. Browser refresh and navigation

## Known Limitations (Intentional)
- No SOAP notes (Sprint 2)
- No Ayurvedic assessment (Sprint 3)
- No prescription (Sprint 4)
- No Panchakarma tracking (Sprint 5)
- No walk-in patient UI (Sprint 2)

## Next: Sprint 2
Consultation & SOAP Notes workflow
EOF

# Commit and push
git add SPRINT1_RELEASE_NOTES.md
git commit -m "Release: clinical-core-sprint1"
git push

# Create feature branch for Sprint 2
git checkout -b sprint2/consultation
```

### Sprint 1 Frozen

```
No further changes to Sprint 1 code.
Only bug fixes if production issues discovered.
All new features go to Sprint 2.
```

---

## Sprint 2 Scope (Locked)

**Do NOT add**:
- Diagnosis
- Prescription
- Panchakarma
- Follow-up scheduling
- Any other modules

**Do add**:
- Consultation (SOAP Notes)
- Chief Complaint (expansion)
- Clinical Examination
- Consultation History
- Doctor Notes

Keep Sprint 2 equally disciplined and independently usable.

---

## Sign-Off

```
Sprint 1 Verification Complete?

Date: ________________
Tester: ________________

Test 1 (Idempotency): ☐ PASS ☐ FAIL
Test 2 (Concurrency): ☐ PASS ☐ FAIL
Test 3 (Cancelled Booking): ☐ PASS ☐ FAIL
Test 4 (Queue Ordering): ☐ PASS ☐ FAIL
Test 5 (Timeline Uniqueness): ☐ PASS ☐ FAIL
Test 6 (Valid Transitions): ☐ PASS ☐ FAIL
Test 7 (Browser Refresh): ☐ PASS ☐ FAIL

Overall Status: ☐ READY TO TAG ☐ NEEDS FIXES

Issues (if any):
_________________________________________________________________
_________________________________________________________________

Sign-off: ________________
```

---

**Critical**: Do NOT tag Sprint 1 until all 7 tests pass.  
**Goal**: Each sprint is independently usable and production-validated.
