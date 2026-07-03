# Production QA Test Plan - Discharge Summary Data Persistence

**Environment**: https://www.ayurshalapanchakarma.com (PRODUCTION ONLY)

**Focus**: Verify that discharge summary data persists correctly across all workflows

---

## TEST 1: Save → Refresh → Reload

**Objective**: Verify that all entered data reloads exactly as saved after page refresh

### Steps:
1. Open production site
2. Navigate to an Appointment (real or test appointment)
3. Click "Create Discharge Summary" or open existing draft
4. Fill these required fields:
   - Patient Name: `QA Test Patient`
   - Doctor: Select `Dr. Farha Naqvi` or `Dr. Sanjay Yadav`
   - Diagnosis: `QA Test Diagnosis`
   - Age: `45`
   - Sex: `M`
5. Fill at least one more field (e.g., address, vitals)
6. Click **Save** button
7. Wait for success message: "Discharge summary saved successfully"
8. **Press F5 to refresh page**

### Expected Results:
- ✓ Page reloads
- ✓ Patient Name shows: `QA Test Patient`
- ✓ Doctor shows: `Dr. Farha Naqvi` or selected doctor
- ✓ Diagnosis shows: `QA Test Diagnosis`
- ✓ Age shows: `45`
- ✓ Sex shows: `M`
- ✓ Address shows value you entered
- ✓ All other fields you filled are populated

### Pass/Fail:
- **PASS**: If ALL fields are populated exactly as entered
- **FAIL**: If ANY field is blank or shows different value

### Record ID for Next Tests:
Note the booking_id from URL: `?booking_id=___` (needed for later verification)

---

## TEST 2: Edit → Save Again → Single Record

**Objective**: Verify that re-saving updates the same record, not creates a duplicate

### Steps:
1. (Continue from Test 1)
2. Change Patient Name to: `QA Test Patient - Updated`
3. Click **Save** button
4. Wait for success message
5. **Press F5 to refresh page**
6. Verify Patient Name shows: `QA Test Patient - Updated`
7. Open browser **DevTools (F12)** → **Console** tab
8. Look for log messages:
   - Should see: `[EXPLICIT-UPSERT] Record exists with id: ...`
   - Should see: `[EXPLICIT-UPSERT] Performing UPDATE...`
   - Should see: `[EXPLICIT-UPSERT] UPDATE SUCCESS`

### Expected Results:
- ✓ Patient Name updated to: `QA Test Patient - Updated`
- ✓ Console shows "UPDATE" operation (not "INSERT")
- ✓ Page refreshes and still shows updated name

### Pass/Fail:
- **PASS**: If console shows UPDATE operation and name updated
- **FAIL**: If console shows INSERT operation, or if old name still shows

---

## TEST 3: Verify Single Record in Database

**Objective**: Confirm exactly ONE database row exists for this appointment

### Steps:
1. (Continue from Test 2)
2. Note the booking_id from URL: `?booking_id=ABC123`
3. Go to: **Supabase Dashboard** → Your Project
4. Click **SQL Editor** (left sidebar)
5. Click **New Query**
6. Run this SQL:
```sql
SELECT COUNT(*) as row_count, id, booking_id, patient_name, updated_at
FROM discharge_summaries
WHERE booking_id = 'PASTE_BOOKING_ID_HERE'
```
7. Replace `PASTE_BOOKING_ID_HERE` with your booking_id

### Expected Results:
- ✓ `row_count` = **1** (exactly one record)
- ✓ `patient_name` = `QA Test Patient - Updated`
- ✓ `updated_at` shows recent timestamp (within last minute)
- ✓ `id` is a valid UUID

### Pass/Fail:
- **PASS**: If exactly 1 row, and data matches what you saved
- **FAIL**: If 2+ rows (duplicates), or if data doesn't match

---

## TEST 4: Save Multiple Times → Still Single Record

**Objective**: Verify that repeated saves don't create duplicates

### Steps:
1. (Continue from Test 3)
2. Change Diagnosis to: `QA Test Diagnosis - Edit 1`
3. Click Save
4. Wait for success
5. Change Diagnosis to: `QA Test Diagnosis - Edit 2`
6. Click Save
7. Wait for success
8. Change Diagnosis to: `QA Test Diagnosis - Edit 3`
9. Click Save
10. Wait for success
11. Run same SQL query from Test 3:
```sql
SELECT COUNT(*) as row_count, id, booking_id, diagnosis, updated_at
FROM discharge_summaries
WHERE booking_id = 'PASTE_BOOKING_ID_HERE'
```

### Expected Results:
- ✓ `row_count` = **1** (still only one record)
- ✓ `diagnosis` = `QA Test Diagnosis - Edit 3` (latest value)
- ✓ `updated_at` shows most recent save time
- ✓ `created_at` unchanged from Test 3

### Pass/Fail:
- **PASS**: If row_count still 1, and shows latest values
- **FAIL**: If row_count > 1 (duplicates created)

---

## TEST 5: Close Browser → Reopen → Data Loads

**Objective**: Verify data persists after complete browser restart

### Steps:
1. (Continue from Test 4)
2. Copy the URL: `https://www.ayurshalapanchakarma.com/admin/discharge-summary?booking_id=ABC123`
3. **Close browser completely** (not just tab, entire application)
   - Mac: Cmd+Q
   - Windows: Alt+F4
4. Wait 3 seconds
5. **Reopen browser**
6. Paste the URL into address bar
7. Press Enter

### Expected Results:
- ✓ Page loads
- ✓ All fields populate automatically
- ✓ Patient Name shows: `QA Test Patient - Updated`
- ✓ Diagnosis shows: `QA Test Diagnosis - Edit 3`
- ✓ All other data loads correctly

### Pass/Fail:
- **PASS**: If all data loads without any user action
- **FAIL**: If page shows blank form, or data missing

---

## TEST 6: PDF Download Uses Database Data

**Objective**: Verify PDF is generated from saved database record, not current form state

### Steps:
1. (Continue from Test 5)
2. Note current Diagnosis: `QA Test Diagnosis - Edit 3`
3. Note current Patient Name: `QA Test Patient - Updated`
4. **Change Diagnosis in form to**: `TEMP VALUE - DO NOT SAVE`
5. **Do NOT click Save**
6. Click **Download PDF** button
7. Open the downloaded PDF
8. Search for (Ctrl+F / Cmd+F):
   - `QA Test Diagnosis - Edit 3` (should exist)
   - `TEMP VALUE - DO NOT SAVE` (should NOT exist)
9. Verify Patient Name in PDF: `QA Test Patient - Updated`

### Expected Results:
- ✓ PDF contains: `QA Test Diagnosis - Edit 3` (saved value)
- ✓ PDF does NOT contain: `TEMP VALUE - DO NOT SAVE` (unsaved value)
- ✓ PDF Patient Name: `QA Test Patient - Updated` (saved value)
- ✓ This proves PDF uses database, not form state

### Pass/Fail:
- **PASS**: If PDF contains saved values, not unsaved form changes
- **FAIL**: If PDF contains unsaved form changes

---

## TEST 7: Open From Appointments → Same Record Loads

**Objective**: Verify workflow: Appointments → Select Appointment → Discharge Summary

### Steps:
1. Navigate to: `https://www.ayurshalapanchakarma.com/admin/appointments`
2. Find the appointment you created in Test 1
3. Click on it (or "View Discharge Summary" if available)
4. System should navigate to: `/admin/discharge-summary?booking_id=ABC123`

### Expected Results:
- ✓ Page loads with your booking_id
- ✓ All fields populate with saved data
- ✓ Patient Name: `QA Test Patient - Updated`
- ✓ Diagnosis: `QA Test Diagnosis - Edit 3`
- ✓ Same data as Test 5

### Pass/Fail:
- **PASS**: If previously saved data loads automatically
- **FAIL**: If page shows blank form or missing data

---

## TEST 8: Open From Patient Profile → Same Record

**Objective**: Verify workflow: Patient Profile → Discharge Summaries → Same Record

### Steps:
1. Navigate to: `https://www.ayurshalapanchakarma.com/admin/patients`
2. Find your test patient (search for `QA Test Patient`)
3. Open patient profile
4. Go to "Discharge Summaries" section
5. Click on the summary you created in Test 1

### Expected Results:
- ✓ Page loads with your booking_id
- ✓ Same data as Test 5 and Test 7
- ✓ Patient Name: `QA Test Patient - Updated`
- ✓ All fields match what you saved

### Pass/Fail:
- **PASS**: If same discharge summary loads from different navigation path
- **FAIL**: If different data or blank form

---

## TEST 9: Verify Timestamps in Database

**Objective**: Confirm created_at and updated_at behave correctly

### Steps:
1. (Continue from any previous test)
2. Supabase → SQL Editor → New Query:
```sql
SELECT 
  id,
  booking_id,
  patient_name,
  created_at,
  updated_at,
  (updated_at - created_at) as time_difference
FROM discharge_summaries
WHERE booking_id = 'PASTE_BOOKING_ID_HERE'
```

### Expected Results:
- ✓ `created_at` = timestamp from first save (Test 1)
- ✓ `updated_at` = timestamp from last save (Test 4 Edit 3)
- ✓ `updated_at` > `created_at`
- ✓ `time_difference` shows how long between first and last save

### Pass/Fail:
- **PASS**: If timestamps are accurate and show correct progression
- **FAIL**: If timestamps are wrong or created_at changed

---

## TEST 10: Console Logging Verification

**Objective**: Verify backend is logging correct operation type

### Steps:
1. Open any discharge summary page
2. Open DevTools (F12) → Console tab
3. Perform a SAVE action
4. Look for these log messages in console:

**For first save (INSERT):**
```
[EXPLICIT-UPSERT] Checking if booking_id exists: xyz
[EXPLICIT-UPSERT] Record does not exist
[EXPLICIT-UPSERT] Performing INSERT...
[EXPLICIT-UPSERT] INSERT SUCCESS
```

**For subsequent saves (UPDATE):**
```
[EXPLICIT-UPSERT] Checking if booking_id exists: xyz
[EXPLICIT-UPSERT] Record exists with id: abc-123-def
[EXPLICIT-UPSERT] Performing UPDATE...
[EXPLICIT-UPSERT] UPDATE SUCCESS
```

### Expected Results:
- ✓ First save shows INSERT operation
- ✓ Subsequent saves show UPDATE operation
- ✓ Operation matches what's actually happening in database

### Pass/Fail:
- **PASS**: If logs show correct operation type each time
- **FAIL**: If logs show wrong operation, or missing logs

---

## TEST 11: Edge Case - Same Appointment, Different Browser

**Objective**: Verify data is consistent across browser instances

### Steps:
1. Open discharge summary in Browser A (Chrome, Firefox, etc.)
2. Save some data
3. Open SAME booking_id in Browser B (Safari, different profile, incognito, etc.)
4. Verify Browser B shows data saved in Browser A

### Expected Results:
- ✓ Browser B loads the same data
- ✓ Consistent across browser instances
- ✓ Proves data is in database, not local cache

### Pass/Fail:
- **PASS**: If data is consistent across browsers
- **FAIL**: If data differs between browsers

---

## TEST 12: Final Verification - No Corruption

**Objective**: Ensure no duplicate or orphaned records

### Steps:
1. Supabase → SQL Editor:
```sql
-- Find all discharge summaries with duplicate booking_ids
SELECT booking_id, COUNT(*) as count
FROM discharge_summaries
GROUP BY booking_id
HAVING COUNT(*) > 1

-- Check for NULL booking_ids
SELECT COUNT(*) as null_booking_count
FROM discharge_summaries
WHERE booking_id IS NULL
```

### Expected Results:
- ✓ First query returns 0 rows (no duplicates)
- ✓ Second query returns 0 (no NULL booking_ids)
- ✓ Database is clean

### Pass/Fail:
- **PASS**: If no duplicates and no NULL values
- **FAIL**: If duplicates found or NULL values exist

---

## SUMMARY: Pass All Tests To Confirm

| Test | Scenario | Pass ✓ | Fail ✗ |
|------|----------|--------|--------|
| 1 | Save → Refresh → All fields reload | [ ] | [ ] |
| 2 | Edit → Save Again → Logs show UPDATE | [ ] | [ ] |
| 3 | Database check → Exactly 1 row | [ ] | [ ] |
| 4 | Save 3x → Still 1 row, latest values | [ ] | [ ] |
| 5 | Browser restart → Data loads | [ ] | [ ] |
| 6 | PDF uses DB values, not form state | [ ] | [ ] |
| 7 | Open from Appointments → Same data | [ ] | [ ] |
| 8 | Open from Patient Profile → Same data | [ ] | [ ] |
| 9 | Timestamps correct (created vs updated) | [ ] | [ ] |
| 10 | Console logs show correct operation type | [ ] | [ ] |
| 11 | Data consistent across browsers | [ ] | [ ] |
| 12 | No duplicate or orphaned records | [ ] | [ ] |

---

## WHAT TO REPORT IF ANY TEST FAILS

Include:
1. **Which test failed** (Test #X)
2. **What you expected** (from Expected Results section)
3. **What actually happened** (actual outcome)
4. **Screenshots** of:
   - Browser showing the issue
   - DevTools console (F12 → Console tab)
   - Supabase query results (if applicable)
5. **Booking ID** you were testing with
6. **Exact timestamp** when test was run
7. **Your browser/OS** (Chrome on Mac, Firefox on Windows, etc.)

---

## PRODUCTION ONLY

⚠️ **DO NOT test locally first**

Test only on: https://www.ayurshalapanchakarma.com

Reason: Production deployment might have different environment variables, database permissions, or configurations.

Once ALL tests pass on production → Data persistence is confirmed safe for real patient records.

Then proceed to: PDF layout polish and remaining features.
