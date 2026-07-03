# Phase 1 Visual QA Protocol

**Status:** Ready for visual acceptance test  
**Created:** 2026-07-04 00:07  
**Commits:** `5cc1e9e` (cleanup) + `f200a57` (real data preview)

---

## Test Data Available

### Development Mode (Always Available)
```
http://localhost:3000/admin/pdf-preview
```
- Mock data: Rajesh Kumar Singh (knee pain case)
- Use for: Layout verification, predictable testing

### Production Mode (Comprehensive Test)
```
http://localhost:3000/admin/pdf-preview?booking_uuid=550e8400-e29b-41d4-a716-446655440000
```
- Real data: Priya Sharma (chronic migraine with cervical spondylosis)
- Patient ID: AYP-2026-QA-VISUAL
- Doctor: Dr. Farha Naqvi
- Features:
  - 2-paragraph diagnosis (realistic complexity)
  - 500+ word clinical history
  - 10 medicines with full dosage/instructions
  - 6 therapies/procedures
  - Extended advice section (500+ words)
  - Detailed pathya (recommended diet)
  - Detailed apathya (contraindicated foods)
  - Multiple systems examined

**This is the PRIMARY acceptance test.**

---

## Visual QA Checklist

### 1. Header Section
- [ ] Logo centered and crisp
- [ ] "AYURSHALA PANCHAKARMA" text properly sized
- [ ] Subtitle text positioned correctly
- [ ] Orange border (top) visible and sharp
- [ ] All header elements within 1-inch margin

### 2. Patient Details Block
- [ ] Labels ("UHID", "Name", "Age", etc.) left-aligned
- [ ] Values right-aligned and properly spaced
- [ ] Date/time fields formatted correctly
- [ ] Address wraps without awkward breaks
- [ ] Consistent line height between rows

### 3. Clinical Sections
Check these sections render without issues:
- [ ] Diagnosis heading and content
- [ ] Complaints list (check numbering)
- [ ] History section (long text, 500+ words)
- [ ] Past History (medical/surgical columns aligned)
- [ ] Medication Administered section
- [ ] Day of Therapy section
- [ ] Pradhan Vedna (main complaints) list

### 4. Vitals & Examination
- [ ] Vitals grid (BP, HR, Nadi) properly formatted
- [ ] O/E section (Mala, Mutra, Jihwa, Shuda) columns aligned
- [ ] Nidra subsection positioned correctly

### 5. Therapies & Investigations
- [ ] Therapies list formatted consistently
- [ ] Investigations text doesn't overflow
- [ ] Findings section (long text) wraps naturally
- [ ] Condition at Discharge readable
- [ ] Advice section (extended text) formatted correctly

### 6. Medicine Table (Critical)
- [ ] Header row has orange background
- [ ] All 10 medicines visible
- [ ] Column headers: Name, Dosage, Instructions, Schedule, Duration
- [ ] Long medicine names wrap within columns
- [ ] Dosage column readable
- [ ] Instructions column readable (check word wrapping)
- [ ] No overlapping text
- [ ] Table borders visible
- [ ] Row heights consistent
- [ ] Last rows don't get cut off

### 7. Pathya & Apathya Sections
- [ ] Pathya heading and long text renders
- [ ] Apathya heading and long text renders
- [ ] Long text wraps naturally without truncation
- [ ] Spacing before QR/signature sections

### 8. QR Code & Signature
- [ ] QR code on its own section
- [ ] QR code clear and readable
- [ ] Signature block below QR
- [ ] Doctor name present
- [ ] Date/time line present
- [ ] Orange footer border visible

### 9. Footer
- [ ] Footer line present
- [ ] Clinic name/info if applicable
- [ ] Professional appearance maintained

### 10. Page Breaks & Flow
- [ ] No unexpected blank pages
- [ ] Page 1: Header through ~Therapies
- [ ] Page 2: Medicine table and remaining sections
- [ ] Page 3 (if needed): Signature/QR code only
- [ ] Orange border visible on every page
- [ ] No orphaned headings (heading without content)
- [ ] No large empty spaces between sections
- [ ] Signature block never splits across pages
- [ ] 80-90% page utilization (not sparse, not cramped)

---

## Browser vs Print Comparison

### Step 1: Browser View
1. Open the production data URL above
2. Verify the layout looks professional
3. Check all text is readable
4. Note any visual issues

### Step 2: Print Preview (Critical)
1. Press **Ctrl+P** (Windows/Linux) or **Cmd+P** (Mac)
2. Select "Save as PDF" (or your PDF printer)
3. In Print Preview, verify:
   - [ ] Layout matches browser view
   - [ ] Margins are consistent (0.5-0.75 inches)
   - [ ] All text visible (no cutoffs)
   - [ ] Tables format correctly
   - [ ] Long content doesn't disappear
   - [ ] Page breaks are logical
   - [ ] Orange borders/dividers present
   - [ ] Font rendering clean (no pixelation)

### Step 3: Identify Differences
If Print Preview differs from browser rendering, document:
- **Issue:** (e.g., "Medicine table row height differs")
- **Browser appearance:** (describe what you see)
- **Print appearance:** (describe what changes)
- **Expected:** (what should happen)

**Do NOT proceed to Phase 2 if differences exist.** Fix HTML/CSS first.

---

## Document Quality Criteria

### Typography
- [ ] Professional serif font throughout
- [ ] Consistent font sizes
- [ ] Headings bold and clear
- [ ] Body text 10-12pt equivalent
- [ ] No tiny or oversized text

### Spacing
- [ ] Headers have 12-24pt margin below
- [ ] Sections separated by 8-12pt gap
- [ ] Table padding consistent (4-6pt)
- [ ] No text touching borders
- [ ] List items have 6-8pt vertical spacing

### Colors
- [ ] Orange borders (#E8621A or similar) crisp
- [ ] Table headers with background color visible
- [ ] Text contrast sufficient for readability
- [ ] No color bleeding at borders

### Table Formatting
- [ ] Medicine table header distinct from data rows
- [ ] Column alignment: left, center, or right as appropriate
- [ ] Borders: 0.5-1pt weight, visible but not heavy
- [ ] Row alternation (if applicable) clear but not distracting

---

## Issues to Report

If you find problems, document in this format:

**Issue #1: [Section] — [Problem]**
- Expected: [What should happen]
- Actual: [What's happening]
- Browser or Print? [Which view shows the issue]
- Severity: [Critical/High/Medium/Low]

**Critical Issues** (block Phase 2):
- Orange border missing on any page
- Text overlapping or cut off
- Medicine table corrupted or unreadable
- Signature/QR on wrong page
- Large blank pages
- Long text disappears
- Browser ≠ Print rendering

**High Issues** (fix before Phase 2):
- Minor spacing inconsistencies
- Font size variations
- Alignment slightly off
- Small margin errors

**Medium Issues** (fix before production):
- Styling refinements
- Color tone adjustments
- Minor typography tweaks

---

## Success Criteria

Phase 1 is **ACCEPTED** when:

✅ Development mode preview looks professional  
✅ Production mode renders real data correctly  
✅ Browser Print Preview matches browser view  
✅ No text overlapping or cutoffs  
✅ Medicine table renders all 10 items correctly  
✅ Long content (history, advice, pathya, apathya) displays properly  
✅ Signature block intact on last page  
✅ QR code on final page only  
✅ Orange border visible on every page  
✅ Page utilization 80-90% (not sparse, not cramped)  
✅ No console errors  

**Only after all criteria pass → Proceed to Phase 2 (Puppeteer)**

---

## Phase 2 Gate

**When Phase 1 visual QA is approved:**
1. Implement `/api/admin/discharge-summary-pdf` route with Puppeteer
2. Use Puppeteer to render DischargeSummaryTemplate.tsx
3. Generate PDF matching the approved browser preview
4. Wire into UI (download button on discharge summary page)
5. Test: Generated PDF should match Print Preview from Phase 1

---

## Testing Environment

```
Node: v18+ (check with node --version)
Browser: Chrome, Firefox, Edge (test in your primary browser)
OS: macOS (as per system context)

Development Server:
npm run dev
# Runs on http://localhost:3000
```

---

## Deliverables to Collect

Before signoff, provide:

1. **Screenshot:** Browser view of production data preview
2. **Screenshot:** Print Preview (Ctrl+P save-as-PDF dialog)
3. **Screenshot:** Final rendered PDF (from Print Preview)
4. **List:** Any visual issues found and status (fixed/pending)
5. **Booking UUID:** Exact UUID used for testing
6. **Confirmation:** "Ready for Phase 2" or "Needs fixes"

---

## Timeline

- **Phase 1A (Cleanup):** ✅ Complete
- **Phase 1B (Real Data Preview):** ✅ Complete
- **Phase 1C (Visual QA):** ⏳ You are here
- **Phase 2 (Puppeteer):** ⏸️ Waiting for approval

**Only proceed after visual evidence, not implementation claims.**
