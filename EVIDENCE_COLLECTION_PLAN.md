# Evidence Collection Plan - Stop Guessing, Start Proving

**Commit**: 0ae8fca  
**Status**: Ready to collect evidence  
**Goal**: Prove root cause with logs, not assumptions

---

## The Problem

- ✅ Dev PDF looks correct (no overlaps)
- ❌ Prod PDF has overlaps
- ❓ Root cause unknown
- ❌ Solution proposed without evidence

## What We Know

**True:**
- Backend persistence works
- Save/load works
- Dev renders correctly
- Production renders incorrectly

**Unknown:**
- Is production running old code? (deployment issue)
- Does production data differ from dev? (data format issue)
- Is there a renderer bug? (specific renderer bug)

---

## The Solution: Collect Evidence

### Step 1: Create Test Booking

Create or identify a booking with:
- Complete data
- All problematic sections (Advice, Cautions, Pathya, Apathya)
- Multiple medicines
- Full discharge summary content

Record: `booking_id = <uuid>`

### Step 2: Generate Dev PDF

```bash
# Run locally
cd ~/Documents/ayurshala-website
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/admin/discharge-summary-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "booking_uuid": "<booking_id>",
    "patient_uhid": "...",
    "patient_name": "...",
    ...all fields...
  }' > /tmp/dev.pdf 2>&1
```

**Capture the console output** (contains trace logs)

Save to: `dev-trace.txt`

### Step 3: Generate Production PDF

```bash
# Same request, different URL
curl -X POST https://www.ayurshalapanchakarma.com/api/admin/discharge-summary-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "booking_uuid": "<booking_id>",
    "patient_uhid": "...",
    "patient_name": "...",
    ...IDENTICAL fields...
  }' > /tmp/prod.pdf 2>&1
```

**Capture the server logs** (Vercel dashboard or CLI)

Save to: `prod-trace.txt`

### Step 4: Compare Traces

```bash
diff dev-trace.txt prod-trace.txt
```

Look for:

**First difference section** - where do logs diverge?

Example output:
```
< [TRACE_BLOCK] Advice
<   type: string
<   isArray: false
<   renderer: Paragraph
<   measure: 126
<   actual: 126
<   before: 418
<   after: 286
---
> [TRACE_BLOCK] Advice
>   type: array
>   isArray: true
>   renderer: NumberedList
>   measure: 84
>   actual: 112
>   before: 418
>   after: 244
```

### Step 5: Report Findings

Format:

```
ROOT CAUSE: [Option A/B/C]

EVIDENCE:

Dev trace shows:
  - <section>: <type>, <renderer>, measure=XXX, actual=XXX
  - <section>: <type>, <renderer>, measure=XXX, actual=XXX

Prod trace shows:
  - <section>: <type>, <renderer>, measure=XXX, actual=XXX
  - <section>: <type>, <renderer>, measure=XXX, actual=XXX

DIFFERENCE:
  - <specific mismatch>

CONCLUSION:
  <what this proves>

PROPOSED FIX:
  <targeted fix based on evidence>
```

---

## Expected Outcomes

### Outcome A: Identical Traces

**Interpretation**: Same code and data produce identical logs

**Conclusion**: Issue is not rendering

**Possible causes**:
- PDF viewer rendering issue
- Font metrics issue
- Stale browser cache
- Wrong PDF being inspected

**Action**: Verify you're looking at latest production PDF

---

### Outcome B: Different Data Types

Dev:
```
Advice: type=string, renderer=Paragraph, measure=126, actual=126
```

Prod:
```
Advice: type=array, renderer=NumberedList, measure=84, actual=112
```

**Interpretation**: Production receives different data format

**Conclusion**: Backend is saving data differently

**Action**: Debug why backend converts strings to arrays

**Fix**: Either:
1. Keep as strings (use Paragraph renderer)
2. Fix NumberedList height calculation if using arrays

---

### Outcome C: Different Heights

Dev and Prod same data, but:

Dev:
```
Advice: measure=126, actual=126
```

Prod:
```
Advice: measure=126, actual=98
```

**Interpretation**: Same code but renders different heights

**Conclusion**: Renderer has environment-dependent bug

**Possible causes**:
- Font rendering differences
- Character width calculation differences
- Line wrapping edge cases

**Action**: Debug specific renderer with that exact data

---

### Outcome D: Gap Mismatch

Dev:
```
Advice: before=418, actual=126, after=286, gap=8 ✓
```

Prod:
```
Advice: before=418, actual=126, after=284, gap=10 ✗
```

**Interpretation**: Height correct but cursor calculation wrong

**Conclusion**: Parent render loop bug or SECTION_SPACING changed

**Action**: Check FlowDocument cursor update logic

---

## What NOT to Do

❌ Don't propose fixes without seeing these traces  
❌ Don't change code based on assumptions  
❌ Don't deploy without evidence  
❌ Don't compare different booking IDs (invalidates test)  
❌ Don't use dev test data for prod validation (data variable)

---

## Success Criteria

✅ Trace logs from both environments  
✅ Logs from SAME booking ID  
✅ IDENTICAL request data for both  
✅ Can identify exact section that differs  
✅ Can reproduce the exact values from logs  
✅ Proposed fix is targeted, not speculative  

---

## Timeline

1. **Now**: Trace logging deployed ✅
2. **Next**: Generate dev trace
3. **Next**: Generate prod trace
4. **Next**: Compare and report
5. **Finally**: Fix based on evidence

---

## This is the Only Path Forward

We've:
- ✅ Refactored architecture (correct)
- ✅ Fixed version numbers (necessary)
- ✅ Fixed doctor name (done)
- ✅ Added pagination (works)
- ✅ Added diagnostics (ready)

Now we need to **PROVE what's wrong** before proposing another fix.

The traces will show exactly what's happening. No more guessing.

---

## Ready to Proceed

Trace logging is in place.  
Both dev and prod will output structured logs.  
Same request to both environments.  
Compare the traces.  
Report exact findings.  

**Do not change any more code until we have this evidence.**
