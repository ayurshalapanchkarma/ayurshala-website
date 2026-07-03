# CLINICAL SIGN-OFF CHECKLIST

**Module**: Discharge Summary  
**Status**: Awaiting Visual & PDF Verification  
**Test Booking ID**: e88627e3-8470-4a91-89ee-7cef9f95ee24  
**Discharge ID**: 529072d7-1bff-4a8b-8f8e-1bfbe8dd8fcb  
**Production URL**: https://www.ayurshalapanchakarma.com  

---

## SECTION 1: FORM VISUAL VERIFICATION

### Test 1.1: Initial Load After Data Save
**Purpose**: Verify all form fields populated from saved database record

**Steps**:
1. Open: https://www.ayurshalapanchakarma.com/admin/discharge-summary?booking_id=e88627e3-8470-4a91-89ee-7cef9f95ee24
2. Wait for page to load
3. Verify the following fields are populated:

**Verification Checklist**:
- [ ] Patient Name: "Final Acceptance Test Patient - Updated"
- [ ] Doctor Name: "Dr. Sanjay Yadav"
- [ ] Age: "46"
- [ ] Sex: "F"
- [ ] DOA Date: "2026-07-03"
- [ ] DOA Time: "11:00"
- [ ] DOD Date: "2026-07-03"
- [ ] DOD Time: "16:00"
- [ ] Diagnosis: "Final Acceptance Test - UPDATED Diagnosis"
- [ ] Address: "Test Address - Updated"
- [ ] All other fields populated (not blank)

**Evidence to Capture**:
- [ ] Screenshot of form (entire visible area)
- [ ] Screenshot of scroll-down sections

**Result**: 
- ✅ PASS: All fields populated
- ❌ FAIL: Any field blank

---

### Test 1.2: Page Refresh
**Purpose**: Verify data persists after F5 refresh

**Steps**:
1. (Continue from Test 1.1 - form loaded)
2. Press F5 (or Cmd+R on Mac)
3. Wait for page to reload
4. Verify same fields still populated

**Verification Checklist**:
- [ ] All fields from Test 1.1 still present
- [ ] No blank fields
- [ ] Same values as before refresh

**Evidence to Capture**:
- [ ] Screenshot after refresh
- [ ] Browser console (press F12, check for red errors)

**Result**:
- ✅ PASS: All fields reloaded
- ❌ FAIL: Any field blank after refresh

---

### Test 1.3: Browser Restart
**Purpose**: Verify data loads after closing and reopening browser

**Steps**:
1. (Continue from Test 1.2 - form loaded after refresh)
2. **Close browser completely** (Cmd+Q on Mac, Alt+F4 on Windows)
3. Wait 5 seconds
4. **Reopen browser**
5. Navigate to: https://www.ayurshalapanchakarma.com/admin/appointments
6. Find the test appointment
7. Click to open discharge summary
8. Verify same data loads

**Verification Checklist**:
- [ ] Patient Name: "Final Acceptance Test Patient - Updated"
- [ ] Doctor Name: "Dr. Sanjay Yadav"
- [ ] All fields populated
- [ ] No manual reload needed

**Evidence to Capture**:
- [ ] Screenshot of loaded form
- [ ] Browser console (check for errors)

**Result**:
- ✅ PASS: Data auto-loads
- ❌ FAIL: Fields blank or error

---

## SECTION 2: PDF VISUAL VERIFICATION

### Test 2.1: PDF Generation
**Purpose**: Generate PDF and verify visual layout

**Steps**:
1. (Continue from previous tests - form loaded)
2. Click "Download PDF" button
3. Save file
4. Open in PDF reader (Preview on Mac, Adobe Reader, etc.)
5. Verify every page

**Page 1 Verification Checklist**:
- [ ] Header is visible
- [ ] Header text is **centered** (not left-aligned)
- [ ] Header only appears on page 1 (check by going to page 2)
- [ ] Orange border visible on left edge
- [ ] Orange border visible on right edge
- [ ] Orange border visible on top
- [ ] Orange border visible on bottom
- [ ] No text overlapping other text
- [ ] No text cut off at edges
- [ ] Line spacing is consistent (not too tight, not too loose)
- [ ] Paragraph spacing is adequate (space between sections)
- [ ] Section headings clearly visible and separated
- [ ] All text readable (proper font size)

**Evidence to Capture**:
- [ ] Screenshot of page 1 (full page)
- [ ] Close-up screenshot of header (showing it's centered)
- [ ] Screenshot showing orange border

**Page 2+ Verification Checklist** (if multi-page):
- [ ] Header from page 1 **does NOT appear**
- [ ] Document starts cleanly without repeated header
- [ ] Orange border present on all sides
- [ ] Content flows naturally from page 1
- [ ] No blank pages between content
- [ ] All content readable

**Evidence to Capture**:
- [ ] Screenshot of page 2 (showing no header)
- [ ] Screenshot of any additional pages

**Medicine Table Verification**:
- [ ] Table has visible borders
- [ ] Column headers visible and readable
- [ ] Medicine names properly aligned in columns
- [ ] Dosage values properly aligned
- [ ] Instructions column properly aligned
- [ ] Table doesn't have text overlapping
- [ ] Table wraps to next page cleanly if needed

**Evidence to Capture**:
- [ ] Screenshot of medicine table section

**Lists Verification**:
- [ ] Numbered lists show 1, 2, 3... (not bullets)
- [ ] Lists are vertically arranged (one per line)
- [ ] Not horizontally arranged
- [ ] Proper indentation
- [ ] Bullet points (if any) properly indented

**Evidence to Capture**:
- [ ] Screenshot of any numbered lists
- [ ] Screenshot of any bulleted lists

**Signature Block Verification**:
- [ ] Signature block is visible
- [ ] Doctor name shown
- [ ] Signature line visible
- [ ] Block doesn't split across pages
- [ ] Stays together as one unit

**Evidence to Capture**:
- [ ] Screenshot of signature block

**QR/Barcode Verification**:
- [ ] QR code or barcode visible on final page only
- [ ] **NOT** on page 1
- [ ] **NOT** on intermediate pages
- [ ] Only on last page
- [ ] Properly sized and readable

**Evidence to Capture**:
- [ ] Screenshot of final page showing QR code
- [ ] Screenshot of page 1 showing QR code is NOT there

**Footer Verification**:
- [ ] Footer visible on all pages
- [ ] Page numbers visible (1, 2, 3...)
- [ ] Footer properly aligned (usually centered or right)
- [ ] Footer not overlapping content

**Evidence to Capture**:
- [ ] Screenshot showing footer with page number

**Overall PDF Quality Checklist**:
- [ ] Professional appearance (looks like a hospital discharge form)
- [ ] Not a debug output (no raw data dumps)
- [ ] Proper typography (readable fonts, good sizes)
- [ ] No excessive blank space
- [ ] No unnecessary page breaks
- [ ] All margins consistent
- [ ] Content stays within orange border
- [ ] Looks like a real medical document

**Evidence to Capture**:
- [ ] Screenshots of all pages
- [ ] Overall impression notes

**Result**:
- ✅ PASS: Professional PDF layout, all items correct
- ❌ FAIL: Visual issues (overlaps, misaligned, unprofessional)

---

### Test 2.2: PDF Content Verification
**Purpose**: Verify PDF contains the correct saved data (not form state)

**Steps**:
1. (Continue from Test 2.1 - PDF open)
2. Compare PDF content with saved database values

**Content Verification Checklist**:
- [ ] Patient Name in PDF: "Final Acceptance Test Patient - Updated" (latest)
- [ ] Doctor in PDF: "Dr. Sanjay Yadav" (latest)
- [ ] Diagnosis in PDF: "Final Acceptance Test - UPDATED Diagnosis" (latest)
- [ ] Age in PDF: "46" (latest)
- [ ] Address in PDF: "Test Address - Updated" (latest)
- [ ] All other fields match latest database values

**Evidence to Capture**:
- [ ] Screenshot of PDF showing patient data
- [ ] Screenshot of PDF showing diagnosis
- [ ] Note: Compare with database values from earlier

**Result**:
- ✅ PASS: PDF shows latest saved data
- ❌ FAIL: PDF shows old data or wrong data

---

## SECTION 3: FUNCTIONAL VERIFICATION

### Test 3.1: Edit and Save
**Purpose**: Verify edit persists and updates timestamp

**Steps**:
1. Go back to form (still at: https://www.ayurshalapanchakarma.com/admin/discharge-summary?booking_id=e88627e3-8470-4a91-89ee-7cef9f95ee24)
2. Change Diagnosis field to: "CLINICAL SIGN-OFF TEST - EDIT 3"
3. Click Save button
4. Wait for success message
5. Press F5 to refresh
6. Verify Diagnosis shows: "CLINICAL SIGN-OFF TEST - EDIT 3"

**Verification Checklist**:
- [ ] Save button clicked
- [ ] Success message shown
- [ ] Diagnosis field changed to new value
- [ ] After refresh, diagnosis still shows new value
- [ ] No duplicate records created (row count = 1)

**Evidence to Capture**:
- [ ] Screenshot of form with new diagnosis
- [ ] Screenshot after refresh showing new diagnosis
- [ ] Browser console (F12 - check for errors)

**Result**:
- ✅ PASS: Edit persists after refresh
- ❌ FAIL: Edit lost or error after refresh

---

### Test 3.2: PDF After Edit
**Purpose**: Verify PDF shows updated data after edit

**Steps**:
1. (Continue from Test 3.1 - form has new diagnosis)
2. Click "Download PDF" button
3. Open PDF
4. Verify Diagnosis field shows: "CLINICAL SIGN-OFF TEST - EDIT 3"

**Verification Checklist**:
- [ ] PDF contains new diagnosis
- [ ] PDF doesn't contain old diagnosis
- [ ] All other recent updates present

**Evidence to Capture**:
- [ ] Screenshot of PDF showing new diagnosis

**Result**:
- ✅ PASS: PDF shows updated data
- ❌ FAIL: PDF shows old data

---

## SECTION 4: DATABASE VERIFICATION

### Test 4.1: SQL Queries
**Purpose**: Verify database integrity

**Booking ID to Use**: e88627e3-8470-4a91-89ee-7cef9f95ee24

**Query 1: Row Count**
```sql
SELECT COUNT(*)
FROM discharge_summaries
WHERE booking_id='e88627e3-8470-4a91-89ee-7cef9f95ee24';
```

**Expected Result**: 1

**Verification Checklist**:
- [ ] Query executed successfully
- [ ] Result: 1
- [ ] No errors

**Evidence to Capture**:
- [ ] Screenshot of SQL query result

---

**Query 2: Full Record**
```sql
SELECT id, booking_id, patient_name, diagnosis, age, doctor_name, created_at, updated_at
FROM discharge_summaries
WHERE booking_id='e88627e3-8470-4a91-89ee-7cef9f95ee24';
```

**Expected Results**:
- id: 529072d7-1bff-4a8b-8f8e-1bfbe8dd8fcb (or latest)
- patient_name: "Final Acceptance Test Patient - Updated"
- diagnosis: "CLINICAL SIGN-OFF TEST - EDIT 3" (after our edit)
- age: "46"
- doctor_name: "Dr. Sanjay Yadav"
- created_at: 2026-07-03T06:57:25.78461+00:00 (original)
- updated_at: More recent than created_at

**Verification Checklist**:
- [ ] Exactly 1 row returned
- [ ] Patient name matches latest update
- [ ] Diagnosis matches latest edit ("CLINICAL SIGN-OFF TEST - EDIT 3")
- [ ] Age is 46
- [ ] Doctor name correct
- [ ] created_at unchanged
- [ ] updated_at is newer than created_at
- [ ] No errors

**Evidence to Capture**:
- [ ] Screenshot of complete SQL result

**Result**:
- ✅ PASS: Single record with correct data and timestamps
- ❌ FAIL: Multiple records or data mismatch

---

## SECTION 5: BROWSER & NETWORK VERIFICATION

### Test 5.1: Browser Console
**Purpose**: Verify no JavaScript errors

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Note any yellow warnings

**Verification Checklist**:
- [ ] No red error messages
- [ ] No uncaught exceptions
- [ ] Warnings (yellow) are acceptable, errors (red) are not

**Evidence to Capture**:
- [ ] Screenshot of Console tab (showing no errors)

**Result**:
- ✅ PASS: No errors in console
- ❌ FAIL: Red errors present

---

### Test 5.2: Network Requests
**Purpose**: Verify API calls show INSERT and UPDATE operations

**Steps**:
1. DevTools still open (F12)
2. Go to Network tab
3. Filter by "admin/discharge" or "fetch"
4. Look for:
   - POST to `/api/admin/discharge-summary/save`
   - Check Response for "operation": "INSERT" or "UPDATE"

**Verification Checklist** (from our earlier test):
- [ ] First request shows: "operation": "INSERT"
- [ ] Second request (after edit) shows: "operation": "UPDATE"
- [ ] Responses contain full record data
- [ ] No failed requests (status 200)

**Evidence to Capture**:
- [ ] Screenshot of Network tab
- [ ] Screenshot of API response showing operation type

**Result**:
- ✅ PASS: Correct operations logged
- ❌ FAIL: Wrong operations or errors

---

## FINAL SUMMARY

### Verification Completion

| Section | Tests | Status |
|---------|-------|--------|
| 1. Form Visual | 3 tests | [ ] Complete |
| 2. PDF Visual | 2 tests | [ ] Complete |
| 3. Functional | 2 tests | [ ] Complete |
| 4. Database | 2 queries | [ ] Complete |
| 5. Browser/Network | 2 tests | [ ] Complete |

**Total Evidence to Capture**: ~20 screenshots

---

### Final Checklist

- [ ] All form fields populate from database
- [ ] Data persists after page refresh
- [ ] Data persists after browser restart
- [ ] PDF layout is professional
- [ ] PDF headers centered on page 1 only
- [ ] Orange borders present on all pages
- [ ] No text overlaps
- [ ] Tables render correctly
- [ ] Lists numbered vertically
- [ ] QR code only on final page
- [ ] Signature block together
- [ ] PDF shows latest saved data
- [ ] Edit persists after save and refresh
- [ ] PDF updates with latest data
- [ ] Database shows single record
- [ ] Timestamps correct
- [ ] No JavaScript errors
- [ ] Network requests show INSERT and UPDATE

---

## SIGN-OFF CRITERIA

### Clinical Sign-Off Will Be APPROVED When:

✅ **ALL** of the following are true:
1. Form loads with all fields populated
2. Form persists after refresh
3. Form persists after browser restart
4. PDF is professional quality
5. PDF has centered header on page 1 only
6. PDF has orange borders on all pages
7. No text overlaps in PDF
8. Tables render correctly in PDF
9. Lists numbered vertically
10. QR code only on final page
11. Signature block stays together
12. PDF shows latest saved data
13. Edit and re-save works
14. PDF updates after edit
15. Database shows exactly 1 record
16. Timestamps correct in database
17. No JavaScript errors
18. Network requests correct

---

## AFTER SIGN-OFF

Once you verify ALL items above and confirm everything works:

1. **Report Results**: Provide the evidence (screenshots)
2. **Mark As Approved**: Module becomes "Production Ready"
3. **Freeze Module**: No UI changes unless bug is reported
4. **Begin Clinical Use**: Ready for real patient data

---

## NOTES

- Test Booking ID: `e88627e3-8470-4a91-89ee-7cef9f95ee24`
- Production URL: `https://www.ayurshalapanchakarma.com`
- Commit: `50bf0a4` (implementation), `4d7ec63` (sign-off)
- Expected to take: 20-30 minutes for complete verification
- Report findings to engineering team
