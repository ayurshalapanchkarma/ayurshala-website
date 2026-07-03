# PDF Trace Logger - Evidence Collection Protocol

**Purpose**: Capture identical logs from dev and production for the same booking

**Status**: Ready to implement

---

## What We Need to Capture

For EVERY block rendered, log:

```
[TRACE] Block: <name>
        Type: <Paragraph|NumberedList|Heading|etc>
        DataType: <string|array|number|object>
        IsArray: <true|false>
        ItemCount: <N or N/A>
        CharCount: <N or N/A>
        Renderer: <selected>
        Measure: <estimated height>
        Actual: <rendered height>
        CursorBefore: <Y>
        CursorAfter: <Y>
```

If renderer is NumberedList, also log each item:

```
  Item 1: lines=N, height=NNpx
  Item 2: lines=N, height=NNpx
  ...
```

---

## Test Protocol

### Step 1: Identify Test Booking

Choose a real booking_id that has complete data including:
- Advice/Cautions/Pathya/Apathya (the problematic sections)
- Multiple medicines
- Multi-line paragraphs

Example: `booking_uuid=<uuid>`

### Step 2: Generate Dev PDF

```bash
# DEV
curl -X POST http://localhost:3000/api/admin/discharge-summary-pdf \
  -H "Content-Type: application/json" \
  -d '{"booking_uuid": "<booking_id>", ...}'
```

Capture console logs.
Save as: `dev-trace.log`

### Step 3: Generate Production PDF

```bash
# PROD
curl -X POST https://www.ayurshalapanchakarma.com/api/admin/discharge-summary-pdf \
  -H "Content-Type: application/json" \
  -d '{"booking_uuid": "<booking_id>", ...}'
```

Capture console logs.
Save as: `prod-trace.log`

### Step 4: Compare

```diff
dev-trace.log vs prod-trace.log
```

Show:
- Which sections differ
- Where the first mismatch occurs
- Actual values from both

---

## Expected Outcomes

### Scenario A: Identical Logs

Dev and Prod produce identical logs for same booking.

**Conclusion**: Issue is deployment/code version.
**Fix**: Verify Vercel actually deployed commit 9e8806a.

### Scenario B: Different Data Types

Dev log:
```
[TRACE] Block: Advice
        DataType: string
        IsArray: false
        CharCount: 348
        Renderer: Paragraph
```

Prod log:
```
[TRACE] Block: Advice
        DataType: array
        IsArray: true
        ItemCount: 5
        Renderer: NumberedList
```

**Conclusion**: Production sends arrays, dev uses strings.
**Fix**: Debug NumberedList renderer with production data format.

### Scenario C: Different Heights

Dev log:
```
[TRACE] Block: Advice
        Measure: 126
        Actual: 126
        CursorBefore: 418
        CursorAfter: 286
```

Prod log:
```
[TRACE] Block: Advice
        Measure: 126
        Actual: 168
        CursorBefore: 418
        CursorAfter: 226
```

**Conclusion**: Renderer returns different height for same data.
**Fix**: Debug height calculation for that specific renderer.

---

## Implementation Strategy

Modify PDF endpoint to output structured trace:

```typescript
const traceLog: string[] = []

for (const block of blocks) {
  const blockTrace = {
    name: block.name,
    type: typeof data[field],
    isArray: Array.isArray(data[field]),
    ...
    measure: block.measure(),
    actual: result.height,
    cursorBefore: this.currentY,
    cursorAfter: ...
  }
  
  traceLog.push(JSON.stringify(blockTrace))
}

console.log('[TRACE] ' + traceLog.join('\n[TRACE] '))
```

---

## Success Criteria

✅ Identical logs from same booking in dev vs prod  
✅ Can reproduce the difference with logs  
✅ Can identify exact section that breaks  
✅ Can correlate PDF visual overlap with log mismatch  

---

## Do Not Proceed Until

- [ ] Dev logs captured for test booking
- [ ] Prod logs captured for SAME booking
- [ ] Logs compared side-by-side
- [ ] Root cause identified in logs
- [ ] Proposed fix matches actual evidence

---

## Next Action

Implement structured tracing in PDF endpoint.
Generate test booking with complete data.
Capture dev and prod logs for same booking.
Compare and report findings.

**No code changes** until logs prove what's wrong.
