# APPLY DATA PERSISTENCE FIX - STEP BY STEP

## ⚠️ CRITICAL: DO THIS NOW

Your discharge summary data is NOT being saved. This fixes it.

---

## STEP 1: Apply Database Migration

### Go to Supabase Dashboard

1. Open https://app.supabase.com
2. Select your project "ayurshala-website"
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**

### Copy and Run This SQL

```sql
-- Add unique constraint to booking_id for proper UPSERT
ALTER TABLE discharge_summaries 
ADD CONSTRAINT unique_booking_id UNIQUE (booking_id);
```

### What to expect:
- ✓ Success: "Query executed successfully"
- ⚠️ If error "already exists": That's fine, constraint is already there
- ❌ If different error: Report it

---

## STEP 2: Deploy Frontend Code

All code changes are already in your repository:

### File 1: Backend Save Endpoint
**Path**: `/app/api/admin/discharge-summary/save/route.ts`
- ✓ Already fixed to return full record
- ✓ Already fixed to use UPSERT with booking_id conflict

### File 2: Frontend Page Component
**Path**: `/app/admin/discharge-summary/page.tsx`
- ✓ Already fixed to reload from database after save
- ✓ Already fixed to handle booking_id URL parameter

**Deploy**: Commit and push these files to GitHub

```bash
cd ~/Documents/ayurshala-website
git add .
git commit -m "Fix discharge summary data persistence - add unique constraint and reload after save"
git push
```

If using Vercel deployment: It will auto-deploy after push.

---

## STEP 3: RUN VERIFICATION TESTS

### Test A: Save → Refresh → Data Persists

```
1. Open your app in browser
2. Go to: /admin/discharge-summary?booking_id=TEST123
3. Fill these fields:
   - Patient Name: "Test Patient"
   - Doctor: Select a doctor
   - Diagnosis: "Test diagnosis"
   - Age: "35"
4. Click "Save"
5. Wait for: "Discharge summary saved successfully"
6. Press F5 to refresh page
7. CHECK:
   ✓ Patient Name still shows "Test Patient"
   ✓ Doctor name still shows selected doctor
   ✓ Diagnosis still shows "Test diagnosis"
   ✓ Age still shows "35"
   If ANY field is blank → PROBLEM (report below)
```

### Test B: Save Again (Update, not duplicate)

```
1. (continuing from Test A)
2. Change Patient Name to "Updated Name"
3. Click Save again
4. Open browser DevTools (F12)
5. Go to Console tab
6. Check logs show: [FRONTEND] Reloading saved data from database...
7. Open Supabase Dashboard → SQL Editor
8. Run this query:
   SELECT COUNT(*) FROM discharge_summaries 
   WHERE booking_id = 'TEST123'
9. CHECK: Count should be exactly 1
   If count is 2 or more → PROBLEM (duplicate records)
```

### Test C: Close Browser Completely → Reopen

```
1. (continuing from Test B)
2. CLOSE browser completely
3. Wait 5 seconds
4. REOPEN browser
5. Type in address bar: http://localhost:3000/admin/discharge-summary?booking_id=TEST123
6. CHECK: All data loads immediately
   ✓ Patient Name shows "Updated Name"
   ✓ All other fields populated
   If blank → PROBLEM (not loading from database)
```

### Test D: Check Supabase Directly

```
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
   SELECT id, booking_id, patient_name, age, doctor_name, 
          created_at, updated_at
   FROM discharge_summaries 
   WHERE booking_id = 'TEST123'
3. CHECK:
   ✓ Exactly 1 row
   ✓ patient_name = "Updated Name"
   ✓ age = "35"
   ✓ doctor_name shows doctor you selected
   ✓ updated_at shows recent timestamp
   ✓ created_at shows earlier than updated_at
```

---

## IF TESTS FAIL

### Symptom 1: After Save + Refresh, fields are blank

**Check:**
1. Open DevTools (F12) → Network tab
2. Refresh page
3. Look for request: `GET /api/admin/discharge-summary?bookingId=...`
4. Check Response tab:
   - Should show: `{ "data": { "patient_name": "...", ... } }`
   - If shows: `{ "data": null }` → Record not in database
   - If shows error → API problem

**Fix:**
- Verify booking_id in URL matches what was saved
- Check Supabase: is the record actually there?
- Check browser console for JavaScript errors

### Symptom 2: Multiple records for same booking_id

**Check:**
1. Supabase → SQL Editor
2. Run: `SELECT booking_id, COUNT(*) FROM discharge_summaries GROUP BY booking_id HAVING COUNT(*) > 1`
3. If any results → duplicates exist

**Fix:**
- Verify constraint was applied: `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'discharge_summaries'`
- If constraint not there: apply Step 1 again
- If constraint exists but duplicates exist: contact support (old duplicates need cleanup)

### Symptom 3: Save shows success but nothing happens

**Check:**
1. Open DevTools (F12) → Console tab
2. Trigger save
3. Look for messages:
   - Should see: `[FRONTEND] POST payload: {...}`
   - Should see: `[FRONTEND] API response: ...`
   - Should see: `[FRONTEND] Reloading saved data from database...`
4. If missing messages:
   - Check Network tab for failed requests
   - Check if there are JavaScript errors (red text in console)

**Fix:**
- Verify deployment was successful
- Clear browser cache: Ctrl+Shift+Delete → Clear browsing data
- Try incognito window

---

## VERIFICATION CHECKLIST ✓

Before considering this fixed, you must verify:

- [ ] Test A: Save → Refresh → data persists
- [ ] Test B: Save again → only 1 record in database
- [ ] Test C: Close browser → reopen → data loads
- [ ] Test D: Supabase query shows correct record

All 4 tests MUST pass. If any fail, report:
- [ ] Which test failed
- [ ] Exact symptom
- [ ] Any error messages from console

---

## ONCE VERIFIED ✓

Once all tests pass:

1. ✓ Data persistence is FIXED
2. ✓ Safe to work on PDF generation
3. ✓ Safe to test with real patient data

---

## SUPPORT

If anything fails:
1. Take screenshot of DevTools console (F12)
2. Copy the browser console errors
3. Note which test failed
4. Report with these details
