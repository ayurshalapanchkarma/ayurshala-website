# Deployment Checklist - Data Persistence Fix

**Status**: Ready for production deployment

---

## PRE-DEPLOYMENT VERIFICATION

- [x] Code builds successfully (no TypeScript errors)
- [x] Explicit upsert logic implemented (application-level, not database-level)
- [x] Save endpoint returns full record with operation type
- [x] Frontend reloads from database after save
- [x] Console logging shows INSERT/UPDATE operations

---

## FILES MODIFIED

### Backend Changes
1. **`/app/api/admin/discharge-summary/save/route.ts`**
   - ✓ Explicit upsert implementation
   - ✓ Check if record exists first
   - ✓ Perform UPDATE if exists
   - ✓ Perform INSERT if not exists
   - ✓ Return full record with operation type
   - ✓ Enhanced logging for debugging

### Frontend Changes
2. **`/app/admin/discharge-summary/page.tsx`**
   - ✓ Reload from database after save
   - ✓ Call loadDischargeSummary(bookingId) after successful save
   - ✓ Ensures React state matches Supabase reality
   - ✓ No changes needed to other functions

### Database Changes
3. **`/migrations/discharge_summaries_001.sql`** (already applied)
   - ✓ Added UNIQUE constraint on booking_id (safety net)

4. **`/migrations/discharge_summaries_002_add_unique_booking_id.sql`** (new)
   - ✓ Standalone migration for clarity

---

## DEPLOYMENT STEPS

### Step 1: Verify Local Build
```bash
cd ~/Documents/ayurshala-website
npm run build
# Expected: Build completes successfully ✓
```

### Step 2: Commit Changes
```bash
git add app/api/admin/discharge-summary/save/route.ts
git add app/admin/discharge-summary/page.tsx
git add migrations/
git commit -m "Implement explicit application-level upsert for discharge summary data persistence

- Refactor save endpoint to explicitly check if record exists first
- Perform UPDATE if booking_id exists, INSERT if new
- Return full record with operation type for verification
- Frontend reloads from database after save to ensure persistence
- Enhanced logging shows INSERT/UPDATE operations in console
- This ensures data persistence across page refresh and browser restart"
```

### Step 3: Push to GitHub
```bash
git push origin main
# (or your deployment branch)
```

### Step 4: Wait for Vercel Deployment
- Vercel automatically deploys on push to main
- Wait for deployment to complete (typically 2-3 minutes)
- Check Vercel dashboard for green checkmark

### Step 5: Verify Deployment
```
Go to: https://www.ayurshalapanchakarma.com
Check: Page loads without errors
```

---

## PRODUCTION QA TESTING

### Quick Smoke Test (5 minutes)
1. Open: https://www.ayurshalapanchakarma.com/admin/discharge-summary?booking_id=TEST
2. Fill Patient Name: "Test"
3. Select Doctor
4. Click Save → should see "Discharge summary saved successfully"
5. Press F5 (refresh) → Patient Name should still show "Test"
6. If successful → Full QA can proceed

### Full QA Test Plan
See: `PRODUCTION_QA_TEST_PLAN.md`

Complete all 12 tests before considering deployment successful.

---

## ROLLBACK PLAN (if needed)

If production deployment has critical issues:

### Option 1: Revert Code Changes
```bash
git revert HEAD
git push origin main
# Vercel automatically redeployed with previous version
```

### Option 2: Roll Back Database
If data got corrupted:
```
Supabase → Backups → Restore from recent backup
(data from before deployment)
```

---

## MONITORING AFTER DEPLOYMENT

### Check Error Logs
- Supabase → Edge Function Logs
- Vercel → Deployment Logs
- Browser Console (F12) → check for JavaScript errors

### Watch for Issues
- Console errors like "Cannot read property"
- Network errors (5xx status codes)
- Slow response times (should be <1 second)
- Failed saves (alert messages)

### If Issues Appear
1. Take screenshot of error
2. Check browser console (F12 → Console tab)
3. Check Vercel logs for backend errors
4. Report with exact error message and timestamp

---

## SUCCESS CRITERIA

Deployment is successful when:

✓ All 12 production QA tests pass
✓ No JavaScript errors in browser console
✓ No backend errors in Vercel logs
✓ Save → Refresh → Data loads (consistently)
✓ Multiple saves don't create duplicates
✓ Database shows exactly 1 record per booking_id
✓ Console logs show correct operation (INSERT/UPDATE)

---

## NEXT STEPS AFTER DEPLOYMENT

Once data persistence is confirmed working:

1. ✓ PDF generation uses database values (already tested in QA Test 6)
2. Refine PDF layout (header, spacing, typography)
3. Add email sending functionality
4. Test full clinical workflows
5. Deploy to production

---

## CONTACT & SUPPORT

If deployment or testing issues:
1. Check the error/symptom in browser console
2. Review backend logs in Vercel dashboard
3. Verify all code changes were deployed
4. Run a fresh build locally to reproduce
5. Report with screenshots and exact error message

---

## DEPLOYED

Date Deployed: __________
Deployed By: __________
All QA Tests Passed: __________

Confirmation:
- [ ] Code deployed to production
- [ ] All 12 QA tests passed
- [ ] Data persists across refresh
- [ ] No duplicate records
- [ ] PDF uses database data
- [ ] Ready for clinical use
