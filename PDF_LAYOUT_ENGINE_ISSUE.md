# PDF LAYOUT ENGINE - ARCHITECTURAL ISSUE

**File**: `lib/flow-document.ts`  
**Issue**: Cursor management is incorrect  
**Root Cause**: Sections rendering before previous section finished (overlapping)  
**Status**: REQUIRES ARCHITECTURAL REWRITE (not cosmetic fix)

---

## THE BUG

### Current Code (WRONG)
```javascript
// In FlowDocument.render()
for (const block of this.blocks) {
  const blockHeight = block.measure()  // Measure upfront
  
  if (this.currentY - blockHeight < BOTTOM_MARGIN) {
    page = this.createPage()  // Create new page if needed
  }

  block.render(this, this.currentY, page)  // Render it

  // THIS IS THE BUG:
  this.currentY -= blockHeight  // Use measured height, ignoring actual rendered height
}
```

### Problems

1. **Measure vs Actual**: `block.measure()` returns *estimated* height, but actual rendered height might be different (due to wrapping, spacing adjustments, page breaks)

2. **Rendered Height Ignored**: `block.render()` returns `{ height, page }` but we ignore the returned height and use the measured height instead

3. **Page Break Bugs**: If a block spans multiple pages or handles its own wrapping, the render function might return different height than measure, but we ignore it

4. **Cascading Overlap**: When one block's cursor is wrong, all subsequent blocks are offset, causing them to overlap

---

## VISUAL EVIDENCE OF THE BUG

From your screenshots:
```
Medication Administered    } Overlaps
↓                         }
Day of Therapy            } Overlaps
↓                         }
Pradhan Vedna             } 
↓
Vitals on Admission
```

This happens because:
1. `Medication` rendered at Y=400, took 30px (measured), moved cursor to 370
2. `DayOfTherapy` rendered at Y=370, but took 25px (measured), moved to 345  
3. BUT `Medication` actually needed 40px, so `DayOfTherapy` started too early

---

## THE FIX

### Contract Every Block Must Follow

```javascript
interface Block {
  // 1. MEASURE: Estimate the height needed (for page break detection)
  measure(): number
  
  // 2. ENSURE SPACE: Check if it fits, create new page if needed
  //    (parent responsibility)
  
  // 3. RENDER: Draw the block and return ACTUAL rendered height
  //    This might differ from measured height!
  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult
  
  // RenderResult tells parent the ACTUAL height used
  // Parent MUST use this returned value, never the measured value
}
```

### Parent Render Loop (CORRECT)

```javascript
async render() {
  let page = this.createPage()

  for (const block of this.blocks) {
    const measuredHeight = block.measure()

    // 1. CHECK: Does this block fit on current page?
    if (this.currentY - measuredHeight < BOTTOM_MARGIN + 20) {
      // No - create new page
      page = this.createPage()
    }

    // 2. RENDER: Draw the block
    const renderResult = block.render(this, this.currentY, page)

    // 3. UPDATE CURSOR: Use ACTUAL rendered height, not measured
    this.currentY -= renderResult.height

    // If render created new pages internally, page might have changed
    if (renderResult.page > 0) {
      page = this.pages[this.pages.length - 1]
    }
  }
}
```

### Key Principles

1. **Never Trust Measure**: It's an estimate
2. **Always Use Returned Height**: That's the actual height used
3. **Only Parent Controls Cursor**: Children return heights, parent updates Y
4. **No Global State Modifications**: Blocks can't modify `this.currentY` directly

---

## SPECIFIC ISSUES TO FIX

### 1. Paragraph Block
Currently `measure()` calculates wrapped lines, but `render()` might wrap differently due to font rendering.

**Fix**:
```javascript
render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
  const lines = this.wrapText(this.text)
  let currentY = y
  let totalHeight = 0

  lines.forEach(line => {
    page.drawText(line, { x: MARGIN + 20, y: currentY, size: this.fontSize, color: this.isTitle ? ORANGE : BLACK })
    currentY -= LINE_HEIGHT
    totalHeight += LINE_HEIGHT
  })

  // Return ACTUAL height rendered
  return { height: totalHeight, page: 0 }
}
```

### 2. NumberedList Block
Same issue - measure estimates, render might be different.

**Fix**: Return actual height based on lines rendered, not estimated

### 3. Table Block
Tables are complex - wrapping columns, row heights, etc.

**Fix**: Calculate actual table height during render, not during measure

### 4. SignatureBlock
Multiple lines with varying heights.

**Fix**: Measure each line, render each line, return total

---

## IMPLEMENTATION ORDER

1. **Fix Paragraph**: Simplest block, good template
2. **Fix NumberedList**: Slightly complex, involves item wrapping
3. **Fix LabelValue**: Simple, mostly single-line
4. **Fix Table**: Most complex, involves column wrapping
5. **Fix SignatureBlock**: Final verification block
6. **Update Parent Loop**: Use returned heights properly

---

## TESTING STRATEGY

After each block fix:
1. Generate PDF with that block type
2. Verify no overlaps with next block
3. Move to next block type

Example test data:
```
Long Paragraph (tests wrapping)
↓
Numbered List with long items
↓
Table with many rows
↓
Another paragraph
↓
Signature block
```

The gaps between sections should be consistent and clean. No overlaps.

---

## WHAT NOT TO DO

❌ Don't adjust spacing constants (hardcoded numbers)  
❌ Don't move sections manually  
❌ Don't add blank lines to "make room"  
❌ Don't increase margins globally  
❌ Don't estimate better - measure during render instead  

---

## EXPECTED OUTCOME

Once the layout engine is fixed:

✅ No overlapping text  
✅ Sections cleanly separated  
✅ Proper page breaks  
✅ Professional spacing  
✅ Multi-page documents work correctly  
✅ Adding/removing content doesn't cause cascading layout failures  

---

## ARCHITECTURAL BENEFITS

After this rewrite:

1. **Robust**: Layout adjusts to content automatically
2. **Maintainable**: Clear contract for blocks
3. **Extensible**: New block types just follow the contract
4. **Debuggable**: Each block independently testable
5. **Correct**: Actual rendered heights always used

---

## CURRENT STATUS

- ❌ Layout engine broken (overlaps everywhere)
- ❌ Not a cosmetic issue (spacing constants won't fix this)
- ⏳ Requires architectural rewrite
- 🔄 After workflow fix (booking_id issue), THIS should be priority #1

---

## DO NOT CONTINUE

Do not make any more CSS/spacing tweaks to the PDF. The rendering loop is wrong. Fix the loop first, then the individual blocks will render correctly.

Once parent loop is fixed, blocks will automatically render with proper spacing. No manual adjustments needed.
