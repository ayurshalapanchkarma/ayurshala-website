# Diagnostic Test Protocol: Trace booking_uuid from Appointments → Save

**Objective:** Determine where `booking_uuid=54` is being introduced and fix it.

**Commit:** `98630a6`

---

## Step 1: Verify Deployment (2 minutes)

### 1.1 Check what code is deployed

**In production URL (or local dev):**

```
GET https://www.ayurshalapanchakarma.com/api/version
```

Or locally:
```
GET http://localhost:3000/api/version
```

**Expected response:**
```json
{
  "environment": "production",
  "commit": "98630a6",
  "branch": "main",
  "buildTime": "2026-07-04T...",
  "timestamp": "..."
}
```

**Check:**
- Does `commit` match `98630a6`?
- If it's an older commit (like `41db626`), the fix hasn't been deployed yet
- If it's `98630a6`, code is deployed and logging is active

---

## Step 2: Test Appointments → Discharge Summary Navigation (5 minutes)

### 2.1 Open Chrome DevTools

1. Go to `/admin/appointments`
2. Press `Cmd+Shift+J` (or right-click → Inspect → Console)
3. Keep DevTools open

### 2.2 Select a booking and click Discharge

1. Find any booking row in the table
2. **Click the discharge button** (or open row drawer and click "Discharge Summary")
3. **Immediately check Console** — look for these logs:

```
[APPOINTMENTS] Full selectedRow object: {
  id: 54,
  booking_id: "AYB-2026-000005",
  booking_uuid: "a76f621d-4639-...",
  ...other fields...
}

[APPOINTMENTS] Identifier fields: {
  id: 54,
  booking_id: "AYB-2026-000005",
  booking_uuid: "a76f621d-..."
}

[APPOINTMENTS] Navigating to: /admin/discharge-summary?booking_uuid=a76f621d-...
```

### 2.3 Inspect the actual URL in the address bar

After navigation, the URL should show:
```
/admin/discharge-summary?booking_uuid=a76f621d-4639-...
```

**NOT:**
```
/admin/discharge-summary?booking_uuid=54
```

### Result A: If booking_uuid is correct (UUID format)

✅ Frontend is working correctly. Move to Step 3.

### Result B: If booking_uuid is still 54

❌ **The appointments page has a problem:**
- Either the fix wasn't deployed
- Or the API is not returning `booking_uuid` field

**Action:**
1. Check `/api/version` again — was code deployed?
2. Check the console log `[APPOINTMENTS] Full selectedRow object` — is `booking_uuid` field present?
3. If `booking_uuid` is undefined in the log, the API is the problem. Jump to Step 4.

---

## Step 3: Test Save Request (5 minutes)

### 3.1 Open Network Tab

1. Still at `/admin/discharge-summary?booking_uuid=...`
2. Press `Cmd+Shift+K` to open Network tab
3. Refresh the page (Cmd+R)

### 3.2 Fill in minimal fields

- Doctor Name: Dr. Farha Naqvi
- (Leave other fields as default)

### 3.3 Click Save and capture the request

1. **Click the Save button**
2. **In Network tab**, find the POST request to `/api/admin/discharge-summary/save`
3. **Click on it** → Open the "Request" and "Response" tabs

### 3.4 Check the Request payload

**Click:** Request body (or use Preview tab)

**Look for:**
```json
{
  "booking_uuid": "a76f621d-4639-...",
  "doctor_name": "Dr. Farha Naqvi",
  ...
}
```

**NOT:**
```json
{
  "booking_uuid": "54",
  ...
}
```

### 3.5 Check the Response

**Click:** Response tab

**If status is 200:**
```json
{
  "success": true,
  "booking_uuid": "a76f621d-...",
  "booking_number": "AYB-2026-000005"
}
```

**If status is 500 or 400:**
```json
{
  "success": false,
  "code": "...",
  "message": "...",
  "supabaseError": {
    "code": "...",
    "message": "..."
  }
}
```

**Capture the full response** — this is the actual error.

---

## Step 4: Check Appointments API (5 minutes)

**Only do this if Step 2 showed `booking_uuid` is undefined**

### 4.1 Open Network tab (at appointments page)

1. Go to `/admin/appointments`
2. Press `Cmd+Shift+K` (Network tab)
3. Refresh page

### 4.2 Look for GET request to `/api/admin/bookings`

1. Should appear in Network tab
2. **Click on it**
3. **Open Response tab**

### 4.3 Check a single booking object

Look for a booking in the response:

```json
{
  "id": 54,
  "booking_id": "AYB-2026-000005",
  "booking_uuid": "a76f621d-...",
  "patient_name": "...",
  ...
}
```

**Check:**
- Is `booking_uuid` field present?
- Does it contain a UUID (not null)?

### Result A: booking_uuid is present and valid

✅ API is correct. Problem is in the frontend navigation (Step 2 issue).

### Result B: booking_uuid is null or missing

❌ **API is not returning the field.**

**File to check:** `/app/api/admin/bookings/route.ts`

Line 60 should have:
```typescript
let query = supabase.from('bookings_new').select('*')...
```

The `select('*')` should include all columns including `booking_uuid`.

If it's missing, add it to the SELECT explicitly.

---

## Summary Table

| Step | Check | ✅ Pass | ❌ Fail | Next |
|------|-------|--------|--------|------|
| 1 | Deployment commit is `98630a6` | Move to 2 | Redeploy, then retry | 2 |
| 2 | URL shows UUID (not 54) | Move to 3 | Check console logs | 4 |
| 2 | Console shows `booking_uuid` in selectedRow | ✅ | ❌ Check API | 4 |
| 3 | Request payload has `booking_uuid: "a76f..."` | ✅ | ❌ Check console logs | — |
| 3 | Response is 200 with success | ✅ | ❌ Capture error response | Check error details |
| 4 | API response includes `booking_uuid` field | ✅ API correct | ❌ Check bookings route | Fix bookings route |

---

## Evidence to Capture

**Once you've done the tests, provide:**

1. **Screenshot 1:** `/api/version` response (showing commit and timestamp)
2. **Screenshot 2:** Console logs from Step 2.3 (showing selectedRow object)
3. **Screenshot 3:** Address bar URL (showing booking_uuid value)
4. **Screenshot 4:** Network tab → Save request → Request body
5. **Screenshot 5:** Network tab → Save request → Response body

**This will definitively show:**
- What code is running (commit hash)
- What data the API returned (booking_uuid present?)
- What URL was generated (UUID or 54?)
- What value reached the backend (UUID or 54?)
- What the backend returned (success or error?)

---

## Troubleshooting

### "I don't see the logs in console"

**Possible causes:**
1. You're looking at the Network tab logs, not Console
2. Click the Console tab
3. Refresh page to see logs from initial load

### "The Save button doesn't appear"

You need to be logged in as admin. Check you can see the top nav with "Admin" button.

### "I can't find the discharge button"

In `/admin/appointments` table:
- Find any row
- Click the row to open drawer (or look for an action icon in the row)
- The discharge button should be there

### "Network tab is empty"

1. Make sure Network tab is open BEFORE you click the button
2. Some requests may be cached — refresh page first
3. Check "All" filter in Network tab (not just XHR)

---

## Once Root Cause is Identified

After running this protocol:

1. **If deployment is old:** Trigger Vercel redeploy
2. **If booking_uuid is undefined:** Add explicit SELECT in bookings route
3. **If URL is still wrong:** Find alternative navigation path
4. **If save fails with error:** Report the full Supabase error message

**Report back with:**
- Which step failed
- What the actual value/error was
- Screenshots of all relevant outputs
