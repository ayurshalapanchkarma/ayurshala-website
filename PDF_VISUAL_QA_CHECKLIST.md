# PDF Discharge Summary - Visual QA Checklist

## Before Deployment

Generate a test PDF and verify ALL items below:

### Page 1 Header

- [ ] Logo is perfectly centered horizontally
- [ ] Logo dimensions are 70x70px
- [ ] "AYURSHALA PANCHAKARMA CENTER" is centered and at correct size
- [ ] Address "SP-28, Wajidpur, Sector-130, Noida – 201301" is centered
- [ ] Phone/Email "+91-9821224767 | ayurshalapanchkarma@gmail.com" is centered
- [ ] "DISCHARGE SUMMARY" title is centered, bold, orange color
- [ ] Orange divider line extends across page
- [ ] No overlapping elements in header
- [ ] Proper vertical spacing between header elements
- [ ] Content starts immediately after divider (no large blank space)

### Content Layout

- [ ] Patient Information block displays correctly (UHID, Name, Age, Sex, Nationality)
- [ ] Diagnosis section displays with proper text wrapping
- [ ] Complaints numbered list (1. 2. 3. etc) displays correctly
- [ ] History section displays with proper text wrapping
- [ ] Past History section displays correctly
- [ ] Medication Administered displays with proper wrapping
- [ ] Day of Therapy section displays correctly
- [ ] Pradhan Vedna numbered list displays correctly
- [ ] Vitals section displays correctly
- [ ] O/E (Examination) section displays correctly
- [ ] Therapies numbered list displays correctly
- [ ] Investigations section displays with proper wrapping
- [ ] Findings on Discharge displays with proper wrapping
- [ ] Condition at Discharge displays with proper wrapping
- [ ] Advice on Discharge displays with proper wrapping

### Tables & Special Sections

- [ ] Medicine table header displays correctly (Medication, Dosage, Instructions, Schedule, Duration)
- [ ] All medicine rows display correctly
- [ ] Table does NOT start before previous section ends
- [ ] Table borders are visible
- [ ] Table content is readable
- [ ] Cautions section displays correctly
- [ ] Pathya section displays with proper text wrapping
- [ ] Apathya section displays with proper text wrapping

### Signature Block

- [ ] Doctor name displays correctly (no duplicate "Dr. Dr.")
- [ ] "Dr. " prefix is present once
- [ ] Mobile number displays correctly
- [ ] Email displays correctly
- [ ] Signature block does NOT overlap with previous content
- [ ] Signature block never splits across pages

### Pagination

- [ ] Page 1 has document header
- [ ] Page 2 (if exists) has NO document header
- [ ] Page 2 (if exists) starts directly with content
- [ ] Page 2 has orange border
- [ ] Page 2 has "Page 2 of X" footer
- [ ] Page 3+ (if exists) similar to Page 2
- [ ] All pages have "Page X of Y" footer
- [ ] Page numbers are centered at bottom
- [ ] QR/Barcode visible on last page (future requirement)

### Formatting & Spacing

- [ ] No text overlaps anywhere
- [ ] No text is clipped at borders
- [ ] Orange border is on all 4 sides, all pages
- [ ] All sections have 12px spacing after them
- [ ] Headings are orange color
- [ ] Content text is black
- [ ] Labels are properly formatted
- [ ] Content stays within margins (40px from edges)

### Content Quality

- [ ] All patient data displays correctly
- [ ] All clinic data displays correctly
- [ ] All medical data displays correctly
- [ ] All section headings are present
- [ ] No duplicate sections
- [ ] No missing sections (if data provided)
- [ ] Proper hospital-quality layout

## Multi-Page Test Requirements

Test PDF must be generated with:
- 800+ word history
- 10 complaints
- 8 therapies
- 8 medicines
- 500+ word advice
- Long pathya/apathya lists

Expected output: 3+ pages with no overlaps

## Sign-Off

- [ ] All checkboxes above passed
- [ ] PDF looks professional
- [ ] Ready for production

DO NOT DEPLOY if any checkbox is unchecked.
