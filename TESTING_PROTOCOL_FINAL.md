# Final Testing Protocol - Evidence-Based Root Cause Analysis

**Commit**: 65f7b9d  
**Status**: All infrastructure ready. Awaiting test execution.

---

## The Mission

**Prove ONE of four possibilities with irrefutable evidence:**

1. Production running stale code (deployment issue)
2. Different data shape (arrays vs strings)
3. Specific renderer returning wrong height (calculation bug)
4. Different font metrics (environment issue)

**No other possibilities exist. No guessing. Only measurement.**

---

## Prerequisites

### Required
- [ ] One booking_id with complete discharge summary data
- [ ] Includes all problematic sections: Advice, Cautions, Pathya, Apathya
- [ ] At least one medicine entry
- [ ] Multi-paragraph sections

### Example
```
booking_id = "550e8400-e29b-41d4-a716-446655440000"
```

---

## Step 1: Generate Dev Trace

### Execute

```bash
# Terminal 1: Start dev server
cd ~/Documents/ayurshala-website
npm run dev

# Terminal 2: Generate PDF (wait for server ready)
curl -X POST http://localhost:3000/api/admin/discharge-summary-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "booking_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "patient_uhid": "UH001",
    "patient_name": "Test Patient",
    "age": "45",
    "sex": "M",
    "nationality": "Indian",
    "doctor_name": "Dr. Sanjay Yadav",
    ...ALL OTHER FIELDS FROM BOOKING...
  }' > /tmp/dev.pdf 2>&1
```

### Capture

Save console output containing:
- `ENVIRONMENT INFO` section
- `COMPLETE TRACE REPORT` section
- `TRACE COMPARISON FORMAT` section

Save to: **`dev-trace.txt`**

---

## Step 2: Generate Production Trace

### Execute

```bash
# Same request, production URL
curl -X POST https://www.ayurshalapanchakarma.com/api/admin/discharge-summary-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "booking_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "patient_uhid": "UH001",
    "patient_name": "Test Patient",
    "age": "45",
    "sex": "M",
    "nationality": "Indian",
    "doctor_name": "Dr. Sanjay Yadav",
    ...EXACT SAME FIELDS AS DEV...
  }' > /tmp/prod.pdf 2>&1
```

### Capture

Capture server logs from Vercel dashboard or CLI containing same trace sections.

Save to: **`prod-trace.txt`**

### Critical: IDENTICAL Data

Both requests must use:
- ✅ Same booking_id
- ✅ Same field values
- ✅ Same data types
- ✅ Same order

---

## Step 3: Visual Evidence

Save both PDFs:
- **`dev.pdf`** - Expected: clean, no overlaps
- **`prod.pdf`** - Reported: has overlaps on page 3

Take screenshots showing overlap locations.

---

## Step 4: Extract Traces

From both trace files, extract the `TRACE COMPARISON FORMAT` section.

### Dev format should look like:

```
================================================
TRACE COMPARISON FORMAT
================================================

------------------------------------------------
Patient Information
renderer=Heading
type=string
isArray=false
chars=N/A
wrappedLines=N/A
estimate=20
actual=20
page=1
before=562
after=542
------------------------------------------------
Patient UHID
renderer=LabelValue
type=string
...
```

### Extract both into separate files:
- **`dev-comparison.txt`**
- **`prod-comparison.txt`**

---

## Step 5: Side-by-Side Comparison

Create unified diff:

```bash
diff -u dev-comparison.txt prod-comparison.txt > comparison.diff
```

Or manually compare sections where you see differences.

---

## Step 6: Identify Differences

Look for FIRST difference in:

1. **Section name** - same?
2. **Renderer type** - same?
3. **Data type** - string vs array?
4. **Character count** - same?
5. **Estimate vs actual** - mismatch?
6. **Cursor positions** - different calculation?
7. **Page number** - breaks at different spots?

---

## Step 7: Root Cause Mapping

### If identical traces:
```
Root Cause: NOT A RENDERING ISSUE

Evidence:
- Dev trace == Prod trace
- Same code, same data, same output

Conclusion: Issue is before rendering
- PDF viewer issue?
- Browser cache?
- Wrong PDF being inspected?

Action: Verify you're looking at latest production PDF
```

### If data types differ:
```
Root Cause: DIFFERENT DATA SHAPE

Dev trace shows:
- advice: type=string, isArray=false, chars=512
- cautions: type=string, isArray=false, chars=294

Prod trace shows:
- advice: type=array, isArray=true, items=9
- cautions: type=array, isArray=true, items=7

Conclusion: Backend saves data differently for prod

Possible causes:
- Form sends arrays, dev sends strings
- Frontend processes data differently
- Database stores differently

Action: Fix data shape in form or save handler
```

### If heights mismatch:
```
Root Cause: RENDERER CALCULATION BUG

Dev trace shows:
- Advice: estimate=252, actual=252 ✓

Prod trace shows:
- Advice: estimate=252, actual=186 ✗

Conclusion: Renderer returns wrong height for identical data

Possible causes:
- Different font metrics
- Text wrapping calculation error
- Line spacing bug
- Environment-specific rounding

Action: Debug specific renderer with that exact data
```

### If gaps mismatch:
```
Root Cause: CURSOR UPDATE BUG

Dev trace shows:
- before=418, actual=126, after=286, gap=8 ✓

Prod trace shows:
- before=418, actual=126, after=284, gap=10 ✗

Conclusion: Parent not updating cursor correctly

Possible causes:
- SECTION_SPACING value different
- Cursor math off
- Floating point rounding

Action: Check FlowDocument render loop math
```

### If version differs:
```
Root Cause: STALE DEPLOYMENT

Dev trace shows:
- Version: 65f7b9d

Prod trace shows:
- Version: 55ad57c

Conclusion: Production running old code

Action: Force Vercel redeploy with new version
```

---

## Step 8: Report Findings

Format:

```
EVIDENCE COLLECTION COMPLETE

Test Booking: 550e8400-e29b-41d4-a716-446655440000

FILES:
- dev.pdf (expected: clean)
- prod.pdf (reported: overlaps)
- dev-trace.txt (full environment + trace)
- prod-trace.txt (full environment + trace)
- comparison.diff (side-by-side differences)

ROOT CAUSE: [IDENTIFIED ABOVE]

EVIDENCE:
[Show specific log differences]

REPRODUCTION:
Same booking_id, identical request data
Results differ between dev and prod

CONCLUSION:
[What the difference proves]

NEXT STEP:
[Specific fix to apply]
```

---

## Step 9: Targeted Fix

Only after root cause is proven:

1. Apply ONE specific fix addressing root cause
2. Do NOT change unrelated code
3. Rebuild and test locally

---

## Step 10: Verification

Generate PDF again from same booking:

```bash
# Dev with fix
curl ... > /tmp/dev-fixed.pdf

# Prod after deployment
curl ... > /tmp/prod-fixed.pdf
```

Capture new traces.

### Show three things:

1. **Old PDF** (broken)
2. **New PDF** (fixed)
3. **Trace comparison** (before → after)

Should show:
- Overlaps gone
- Heights corrected
- Gaps correct (8px)
- Traces identical dev/prod

---

## Success Criteria

✅ Two complete trace files (dev + prod)  
✅ From identical request data  
✅ From same booking_id  
✅ Showing exact difference  
✅ Mapping to one root cause  
✅ Specific fix proposed  
✅ Verification showing fix works  

---

## Do Not Proceed To Fix Until

- [ ] Dev trace collected
- [ ] Prod trace collected
- [ ] Traces compared
- [ ] Root cause identified with evidence
- [ ] Difference is measurable in logs
- [ ] Same booking, identical data, provable difference

---

## Timeline

1. ✅ Tracing infrastructure deployed (commit 65f7b9d)
2. ⏳ Dev trace generated
3. ⏳ Prod trace generated
4. ⏳ Traces compared
5. ⏳ Root cause proven
6. ⏳ Fix applied
7. ⏳ Verification complete
8. ✅ Deploy with evidence-based confidence

---

**This is the only way forward. No exceptions. No guessing.**

Evidence first. Fix second. Deploy third.
