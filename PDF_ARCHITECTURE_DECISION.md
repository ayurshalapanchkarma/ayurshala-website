# PDF Architecture Decision Point

**Current Situation:**

The Download PDF button fails with:
```
text must be of type string, but was actually of type undefined
```

This is a **data mapping issue in the legacy pdf-lib renderer** (`/api/admin/discharge-summary-pdf`).

---

## Two Options

### Option A: Fix the Legacy Renderer (Short-term)
**Effort:** 30 minutes  
**Process:**
1. Add type-checked wrapper: `drawTextChecked(field, value)`
2. Identify exact undefined field
3. Trace why it's undefined (save mapping, database, form)
4. Fix the specific field
5. Test

**Problem:** This fixes a renderer we plan to replace in Phase 2

**Benefit:** Users can download PDFs today

---

### Option B: Complete Phase 2 Now (Long-term)
**Effort:** 2-3 hours  
**Process:**
1. Create `/api/admin/discharge-summary-pdf-v2` endpoint using Puppeteer
2. Use existing `DischargeSummaryTemplate` component (React + Tailwind)
3. Puppeteer renders HTML to PDF (same component as browser preview)
4. Switch download button to use v2 endpoint
5. Test

**Benefit:**
- Single source of truth: HTML template used for preview AND PDF
- Professional layout (browser CSS handles it)
- No manual PDF drawing code
- Better maintainability
- Phase 2 complete

**Cost:** 2-3 hours now vs. tech debt later

---

## Current Architecture

### Phase 1 (Complete)
```
Discharge Summary Form
       ↓
Save to Database
       ↓
Preview (React HTML component)
   /admin/pdf-preview
   → Uses DischargeSummaryTemplate.tsx
```

### Phase 2 (Incomplete)
```
Preview (HTML)
       ↓
Download PDF (needs Puppeteer)
       ↓
Puppeteer renders HTML → PDF
   /api/admin/discharge-summary-pdf-v2
   → Uses DischargeSummaryTemplate.tsx
   → Converts to PDF
```

**Current bottleneck:** Phase 2 not implemented. Download button still calls legacy renderer.

---

## Files Involved

### Legacy Renderer (Current)
- `/app/api/admin/discharge-summary-pdf/route.ts` (pdf-lib, ~300 lines)
- Issues: Manual drawing, data mapping, layout calculations

### HTML-First (Ready)
- `/components/pdf/DischargeSummaryTemplate.tsx` (React, ~300 lines)
- `/components/pdf/Header.tsx`, `PatientInfo.tsx`, `Section.tsx`, etc.
- `/app/admin/pdf-preview/page.tsx` (browser preview)
- Benefit: Already works perfectly in browser

### Missing (Phase 2)
- `/app/api/admin/discharge-summary-pdf-v2/route.ts` (Puppeteer)
- Should: Render DischargeSummaryTemplate to HTML → PDF

---

## Recommendation

**Option B (Complete Phase 2 now)** is better because:

1. **Single Source of Truth**
   - Preview and PDF use the same React component
   - Change template once = preview and PDF both change
   - Reduces maintenance burden

2. **Better Quality**
   - CSS handles all layout (Tailwind, print styles)
   - No custom coordinate calculations
   - No font sizing guesses
   - Looks exactly like browser preview

3. **Faster Development**
   - Template already complete and tested
   - Just wire Puppeteer to render it
   - 2-3 hours vs. 30 mins + ongoing legacy debt

4. **Future-Proof**
   - Easy to extend (add new sections in React)
   - Easy to style (Tailwind classes)
   - No pdf-lib API quirks to learn

---

## Path Forward

### Immediate (30 mins): Debug Legacy Renderer
If users need PDF download today:
1. Find the undefined field
2. Fix the mapping
3. Get it working
4. Note as temporary

### Short-term (2-3 hours): Implement Phase 2
1. Create Puppeteer endpoint
2. Wire to DischargeSummaryTemplate
3. Test against browser preview
4. Switch download button
5. Deprecate legacy renderer

### Decision Needed
**Should we:**
- A) Fix the legacy renderer (quick fix, technical debt)
- B) Implement Phase 2 now (better, takes longer)
- C) Both (fix legacy for today, Phase 2 this sprint)

---

## Quick Assessment

**Current pdf-lib renderer:**
- Complex manual drawing code
- Data mapping bugs (undefined fields)
- Layout calculations fragile
- Not aligned with Phase 1 architecture

**DischargeSummaryTemplate:**
- Clean React code
- Uses browser CSS (reliable)
- Works in preview already
- Maintains alignment with architecture

**Vote:** Option B. The template is ready. Puppeteer integration is straightforward. Worth doing it right now.
