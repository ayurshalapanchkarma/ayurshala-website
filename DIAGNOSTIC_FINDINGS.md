# Diagnostic Findings - List Rendering Issue

**Commit**: 9e8806a  
**Date**: 2026-07-03T13:56Z  
**Status**: Data mismatch suspected - requires production logs to verify

---

## What I Found

### Test Data (Dev Environment)

Generated PDF with test data including Advice, Cautions, Pathya, Apathya:

**Data Types:**
- `advice_discharge`: String, 348 characters
- `cautions`: String, 294 characters  
- `pathya`: String, 236 characters
- `apathya`: String, 243 characters

**Rendering:**
- Rendered as **Paragraph blocks**
- All wrapping correct
- All cursor math correct
- **No overlaps**

**Debug Output:**
```
[PAGE3] Heading: before=676, height=20, after=648     ✓
⚠️[PAGE3] Paragraph: before=648, height=42, after=598  ✓
[PAGE3] Heading: before=578, height=20, after=550      ✓
⚠️[PAGE3] Paragraph: before=550, height=56, after=486  ✓
```

All gaps positive. All math correct.

### Production Data (Per Your Report)

You're seeing overlaps that suggest list-style rendering:

**Visible Items:**
- "Avoid prolonged sitting"
- "Avoid lifting heavy weights"  
- "Perform lumbar strengthening exercises"
- "Maintain proper posture"
- "Review after 15 days"

This LOOKS like:
- Either an array that should be rendered as NumberedList
- Or newline-separated text that should be split into items

---

## The Hypothesis

### Possibility 1: Production Data is Different

The form might be saving these fields as:
- Arrays instead of strings
- Newline-separated text instead of continuous

Example:
```javascript
// Test data (working):
advice_discharge: "Avoid cold water... Avoid staying awake..."

// Production data (overlapping?):
advice_discharge: [
  "Avoid prolonged sitting",
  "Avoid lifting heavy weights",
  ...
]

// Or:
advice_discharge: "Avoid prolonged sitting\nAvoid lifting heavy weights\n..."
```

### Possibility 2: NumberedList Height Calculation Bug

If Production IS using NumberedList for these sections, there might be a height calculation issue where:
- `measure()` estimates incorrect height
- `render()` draws more lines than measured
- Cursor moves too early
- Next section overlaps

---

## Diagnostic Logging Added

Added logging to determine which case we're in:

```typescript
if (Array.isArray(data.advice_discharge)) {
  console.log(`[ADVICE] Items: ${data.advice_discharge.length}`)
  // Use NumberedList
} else {
  console.log(`[ADVICE] Content length: ${data.advice_discharge.length}`)
  // Use Paragraph
}
```

Similar for: Cautions, Pathya, Apathya

Also added ultra-detailed Paragraph rendering logs to show each line:

```
[PARAGRAPH_RENDER_START] y=648, lines=3
  Line 1/3: y=648, text="..."
  Line 2/3: y=634, text="..."
  Line 3/3: y=620, text="..."
[PARAGRAPH_RENDER_END] height=42, startY=648, endY=606
```

---

## How to Identify the Issue

### Step 1: Capture Production Logs

Generate the production PDF that shows overlaps and capture the server logs.

Look for:
```
[ADVICE] Type: ...
[ADVICE] IsArray: true/false
[ADVICE] Items: ... OR Content length: ...

[CAUTIONS] Type: ...
[CAUTIONS] IsArray: true/false

[PATHYA] Type: ...
[PATHYA] IsArray: true/false

[APATHYA] Type: ...
[APATHYA] IsArray: true/false
```

### Step 2: Compare with Dev Logs

Dev shows:
```
[ADVICE] Type: string, IsArray: false, Content length: 348
[CAUTIONS] Type: string, IsArray: false, Content length: 294
[PATHYA] Type: string, IsArray: false, Content length: 236
[APATHYA] Type: string, IsArray: false, Content length: 243
```

If production shows `IsArray: true`, then the form is sending arrays.

### Step 3: Identify the Renderer

If arrays are being used, check the NumberedList logs:

```
[NUMBEREDLIST_MEASURE] items=5, totalLines=5, itemsHeight=70, spacing=8, total=78
[NUMBEREDLIST_RENDER] items=5, linesPerItem=1,1,1,1,1, linesDrawn=5, totalHeight=78
```

Compare `measure()` vs `render()` values.

---

## What Would Indicate a Bug

### In NumberedList:

If `[NUMBEREDLIST_RENDER]` shows:
- `linesDrawn` ≠ expected lines
- `totalHeight` < sum of line heights
- `endY` ≠ `y - totalHeight`

Then the renderer has a bug.

### In Paragraph:

If `[PARAGRAPH_RENDER_END]` shows:
- `endY` ≠ `startY - height`
- Lines drawn at same Y position
- HEIGHT != lines.length * LINE_HEIGHT

Then the paragraph renderer has a bug.

---

## Most Likely Cause

Based on the symptoms (items "colliding"), I suspect:

**NumberedList height calculation is correct in measure() but rendering is drawing items at wrong positions.**

Specific theory:
```javascript
// This line might not be working:
currentY -= LINE_HEIGHT

// All items might be rendering at the same Y, creating overlap
```

Or:

**measure() uses CONTENT_WIDTH - 80, but render() uses different width calculation**

Causing:
- measure() estimates 5 lines
- render() wraps into 7 lines  
- Cursor moves by 5 lines worth of space
- Next 2 lines overlap

---

## Solution Path

1. **Generate production PDF** with overlapping content
2. **Capture server logs** showing data types
3. **Compare with dev logs** - identify the difference
4. **If arrays are used**: Debug NumberedList `measure()` vs `render()`
5. **If strings are used**: Debug Paragraph rendering

---

## Current Code Changes

### In PDF Endpoint:

```typescript
if (Array.isArray(data.advice_discharge)) {
  // Use NumberedList
  doc.addBlock(new NumberedList(...))
} else {
  // Use Paragraph
  doc.addBlock(new Paragraph(...))
}
```

Covers both cases automatically.

### In Renderers:

**NumberedList** logs:
- Items count
- Lines per item
- Total lines drawn
- Height calculation

**Paragraph** logs:
- Each line being drawn
- Y position for each line
- Final height calculation

---

## Deployment Status

✅ Diagnostic logging deployed  
✅ Data type detection added  
✅ Both Paragraph and NumberedList handling included  
⏳ Requires production logs to confirm hypothesis  

---

## Next Steps

1. Generate production PDF with failing data
2. Capture server logs
3. Share logs with details about which sections overlap
4. Will identify exact renderer and fix it

**The architecture is sound. The issue is now isolated to either:**
- Data format mismatch (arrays vs strings), OR
- A single renderer's height calculation

Once we see the actual production logs, the fix will be straightforward.
