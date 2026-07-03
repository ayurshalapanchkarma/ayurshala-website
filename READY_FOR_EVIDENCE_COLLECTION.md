# Ready for Evidence Collection

**Commit:** `d9c01c6`

**Status:** Code is ready. No more speculation. Now collect evidence.

---

## What's Been Done

### Code Changes

1. **appointments/page.tsx** — Enhanced `onDischarge` handler with comprehensive logging
   - Logs full `selectedRow` object (including all identifier fields)
   - Logs the exact URL being navigated to
   - Includes error handling if `booking_uuid` is missing

2. **app/api/version/route.ts** — New deployment verification endpoint
   - Returns commit hash, environment, build time
   - Use to verify if code is actually deployed

3. **Existing logging (unchanged but comprehensive)**
   - discharge-summary/page.tsx: URL parameter extraction
   - save/route.ts: Full request/response logging

### Test Protocol

**DIAGNOSTIC_TEST_PROTOCOL.md** includes:
- 4-step testing procedure (15 min total)
- Clear pass/fail criteria at each step
- Evidence checklist (what to capture)
- Troubleshooting guide

---

## What You Need to Do

### Step 1: Run the test protocol

Follow **DIAGNOSTIC_TEST_PROTOCOL.md** exactly.

**Time required:** ~15 minutes

**Outcome:** Evidence showing where `booking_uuid=54` is introduced

### Step 2: Report findings

Provide screenshots:
1. `/api/version` response (deployment verification)
2. Console logs from Step 2 (selectedRow object)
3. URL in address bar (what was actually navigated to)
4. Network tab → Save request → Request body
5. Network tab → Save request → Response

### Step 3: Root cause identification

Based on evidence, one of these will be true:

**Case A: Deployment issue**
- Commit in `/api/version` is older than `d9c01c6`
- **Fix:** Trigger Vercel redeploy

**Case B: API not returning booking_uuid**
- Console log shows `booking_uuid: undefined`
- **Fix:** Verify `select('*')` in `/app/api/admin/bookings/route.ts`

**Case C: Different code path being used**
- URL still shows `booking_uuid=54` despite fix
- **Fix:** Search for other places generating discharge-summary URLs

**Case D: Save endpoint receiving wrong value**
- Network tab → Save request shows `"booking_uuid": "54"`
- **Fix:** Depends on what the console logs revealed in Step 2

---

## Files Ready for Reference

### Diagnostic Code
- `app/api/version/route.ts` — Deployment verification endpoint
- `app/admin/appointments/page.tsx` (lines 340-360) — Logging in discharge handler
- `app/api/admin/discharge-summary/save/route.ts` — Existing comprehensive logging

### Test Guides
- `DIAGNOSTIC_TEST_PROTOCOL.md` — Full step-by-step procedure
- `DEPLOYMENT_STATUS_CHECK.md` — Context on why this matters

### Previous Context
- `IDENTIFIER_FLOW_AUDIT.md` — Database schema details
- `PHASE1_FINAL_ARCHITECTURE.md` — Architecture (HTML-first approach)

---

## Current State Recap

**What works:**
- Architecture is correct (HTML component, single source of truth)
- Database has correct `booking_uuid` column
- Code changes are committed and pushed
- All logging is in place

**What's broken:**
- When user clicks discharge button, URL shows `booking_uuid=54` (numeric ID)
- Save endpoint receives `booking_uuid=54` and fails with UUID type error

**Unknown:**
- Is the commit deployed?
- Is the API returning `booking_uuid`?
- Is there another code path being used?
- **This is what the test protocol will determine**

---

## No More Guessing

The test protocol **produces definitive evidence** by checking:

1. ✅ **Deployment verification** — Is the code actually running?
2. ✅ **Data verification** — Is the API returning the field?
3. ✅ **URL verification** — What's actually being generated?
4. ✅ **Backend verification** — What's the save endpoint receiving?

Each check has clear pass/fail criteria. No interpretation needed.

---

## Next Steps

1. **Follow DIAGNOSTIC_TEST_PROTOCOL.md** (15 min)
2. **Capture screenshots** as directed
3. **Report which step failed**
4. **Provide evidence**
5. **I'll identify and fix the root cause**

The code is ready. The tools are in place. The protocol is documented.

Time to collect evidence.
