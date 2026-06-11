# AYURSHALA – UAT QUICK START GUIDE

## BEFORE YOU START

1. **Print/Download These Documents:**
   - `UAT_CHECKLIST.md` – Main testing checklist
   - `BUG_REPORT_TEMPLATE.md` – For documenting issues
   - `TEST_DATA.md` – Test accounts and scenarios

2. **Set Up Test Environment:**
   - Gmail account for admin: `ayurshalapanchkarma@gmail.com`
   - Create 3 Gmail accounts for patient profiles (see TEST_DATA.md)
   - Have access to dev/staging URL: `https://ayurshala.com` (adjust as needed)
   - Ensure test mode is active (₹1 payments enabled)

3. **Verify Prerequisites:**
   - Browser DevTools working (F12)
   - Can toggle between light/dark mode
   - Can switch between devices (or have mobile device)
   - Gmail inbox accessible and notifications enabled

---

## TESTING WORKFLOW

### Phase 1: Setup (5 minutes)
1. Open `UAT_CHECKLIST.md`
2. Fill in: Date Started, Tester Name, Device, Browser, Theme
3. Choose ONE patient profile to test completely
4. Write profile name at top of checklist

### Phase 2: Systematic Testing (2-3 hours per profile)
1. Start with HOME PAGE tests
2. Move through each section sequentially
3. Check boxes as you complete each test
4. **If issue found:** Stop, take screenshot, document in bug report
5. Continue after understanding impact

### Phase 3: Issue Documentation (As issues arise)
1. Open `BUG_REPORT_TEMPLATE.md`
2. Create new bug report for each issue
3. Fill in: Severity, Environment, Steps to Reproduce
4. Attach screenshot if possible
5. Save as `BUG_REPORT_[DATE]_[ISSUE].md`

### Phase 4: Completion (15 minutes)
1. Complete final assessment in checklist
2. Tally up: Critical / High / Medium / Low issue counts
3. Provide overall recommendation
4. Sign off with date

### Phase 5: Repeat for Remaining Profiles (Repeat for Profiles 2 & 3)
- Repeat entire workflow for each patient profile
- Each profile may reveal different issues
- Test both light AND dark mode on desktop

---

## RED FLAGS TO WATCH FOR

### CRITICAL (Stop Testing, Document Immediately)
- [ ] Duplicate booking created
- [ ] Payment amount incorrect
- [ ] Refund amount incorrect
- [ ] Revenue calculation wrong
- [ ] Any error crashes the page
- [ ] Broken payment flow

### HIGH (Document, Continue Testing)
- [ ] Email not received within 2 minutes
- [ ] Status page shows error
- [ ] Admin action doesn't work
- [ ] Dashboard doesn't update
- [ ] Dark mode unreadable text

### MEDIUM (Document, Continue Testing)
- [ ] Button alignment off
- [ ] Text overlapping
- [ ] Color inconsistency
- [ ] Confusing wording
- [ ] Mobile layout broken

### LOW (Document, Continue Testing)
- [ ] Animation rough
- [ ] Copy could be better
- [ ] Missing accessibility feature
- [ ] Enhancement idea

---

## QUICK TEST SEQUENCES

### Quick Smoke Test (15 minutes)
*Do this first to ensure system is generally working*

1. [ ] Home page loads
2. [ ] Can navigate to booking form
3. [ ] Can submit booking with ₹1 online payment
4. [ ] Payment completes
5. [ ] Confirmation page shows
6. [ ] Email received
7. [ ] Admin sees booking in dashboard
8. [ ] Can confirm booking
9. [ ] Can collect cash
10. [ ] Can process refund

**If all pass:** Continue with full UAT  
**If any fail:** Report immediately, may need urgent fix

---

## DEVICE-SPECIFIC NOTES

### Desktop Testing
- Open DevTools (F12)
- Check Network tab for errors
- Check Console tab for JS errors
- Test both light and dark mode
- Test with Chrome, Safari, Firefox if possible

### Mobile Testing
- Use actual device if possible (more realistic)
- Or use Chrome DevTools device emulation (F12 → Toggle Device Toolbar)
- Test common breakpoints: 375px (iPhone SE), 768px (iPad)
- Test thumb-friendly tap targets (minimum 44x44px)
- Test with both orientations: portrait, landscape

### Dark Mode Testing
- Enable dark mode in OS/browser settings
- Check for white-on-white text
- Check for dark-on-dark text
- Verify all buttons/badges visible
- Check email rendering if possible

---

## COMMON ISSUES TO TEST FOR

### Financial Bugs
```
Test: Book for ₹1, refund ₹0.50
Expected: Refund rejected (₹0.50 ≤ ₹1 ✓)
Bug: If refund accepts amount > payment
```

```
Test: Book cash, collect ₹300 of ₹500
Expected: amount_paid = ₹300, revenue = ₹300
Bug: If revenue still shows ₹500
```

### Duplicate Prevention
```
Test: Complete payment, then refresh page
Expected: No duplicate booking
Bug: If duplicate booking created on refresh
```

```
Test: Click refund button twice quickly
Expected: Refund processed once
Bug: If two refunds created
```

### Email Issues
```
Test: Create booking
Expected: Email within 1-2 minutes
Bug: If email never arrives or arrives with wrong data
```

### Theme Issues
```
Test: Enable dark mode, visit every page
Expected: All text readable
Bug: If white text on white background
```

---

## DECISION TREE

```
Found an issue?
├─ Can you reproduce it consistently?
│  ├─ YES → Document as bug
│  └─ NO → Note as intermittent, continue testing
│
├─ Does it affect financial data?
│  ├─ YES → CRITICAL priority
│  └─ NO → Continue
│
├─ Does it break a workflow?
│  ├─ YES → HIGH priority
│  └─ NO → MEDIUM or LOW priority
│
└─ Document and continue testing
```

---

## SAVING & SHARING

### Bug Reports
Save each bug as: `BUG_REPORT_[SEVERITY]_[DATE]_[BRIEF_TITLE].md`

Example:
- `BUG_REPORT_CRITICAL_2026-06-11_DUPLICATE_BOOKING.md`
- `BUG_REPORT_HIGH_2026-06-11_EMAIL_NOT_SENT.md`
- `BUG_REPORT_MEDIUM_2026-06-11_DARK_MODE_TEXT.md`

### Checklists
Save completed checklists as: `UAT_RESULT_[PROFILE]_[DATE].md`

Example:
- `UAT_RESULT_PROFILE1_ELDERLY_2026-06-11.md`
- `UAT_RESULT_PROFILE2_PROFESSIONAL_2026-06-11.md`
- `UAT_RESULT_PROFILE3_RETURNING_2026-06-11.md`

### Master Summary
After all profiles tested, create: `UAT_SUMMARY_[DATE].md`

Include:
- Total profiles tested: 3/3
- Total issues found: X
- Critical: X / High: X / Medium: X / Low: X
- Overall: ✅ PASS / ⚠️ NEEDS FIXES / ❌ BLOCKER

---

## WHEN TO STOP TESTING

### Stop Immediately (CRITICAL Blocker)
- System crash/error
- Financial data corrupted
- Duplicate bookings created
- Payment stolen/doubled
- Security vulnerability

### Stop After This Session (HIGH Blocker)
- Email system broken
- Booking workflow blocked
- Refund workflow blocked
- Admin dashboard broken

### Can Continue (MEDIUM/LOW)
- Visual inconsistencies
- Wording issues
- Minor theme problems
- Performance improvements

---

## HELPFUL COMMANDS

### Check Console for Errors
1. Press F12 (or Cmd+Option+I on Mac)
2. Click "Console" tab
3. Look for red error messages
4. Screenshot if found

### Check Network Requests
1. Press F12
2. Click "Network" tab
3. Reload page
4. Look for 404 or 500 errors
5. Screenshot if found

### Test Dark Mode (Chrome)
1. Settings → Appearance
2. Select "Dark"
3. Refresh page
4. Verify readability

### Emulate Mobile (Chrome)
1. Press F12
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device (iPhone 12, Pixel 5, etc.)
4. Test interactions

---

## ESTIMATED TIME PER PROFILE

- **Smoke Test:** 15 minutes (quick validation)
- **Home Page:** 10 minutes
- **Booking Form:** 15 minutes
- **Payment Flow:** 20 minutes
- **Confirmation:** 10 minutes
- **Dashboard:** 15 minutes
- **Emails:** 10 minutes (wait for delivery)
- **Admin Actions:** 15 minutes
- **Dark Mode Audit:** 15 minutes
- **Accessibility:** 10 minutes
- **Bug Documentation:** 30 minutes

**Total per profile: 2-3 hours**

---

## SUCCESS CRITERIA

### ✅ Pass UAT
- [ ] All three profiles tested completely
- [ ] No CRITICAL issues remaining
- [ ] No HIGH issues remaining
- [ ] MEDIUM/LOW issues documented
- [ ] Financial data verified accurate
- [ ] No duplicate bookings possible
- [ ] All workflows functional
- [ ] Dark mode fully working
- [ ] Mobile fully responsive
- [ ] All emails sent/verified

### ❌ Fail UAT
- [ ] Any CRITICAL bug still present
- [ ] Financial inaccuracy
- [ ] Duplicate booking possible
- [ ] Broken workflow
- [ ] Crash on any page

---

## NEXT STEPS AFTER UAT

### If ✅ PASS
1. Report: "UAT Complete - PASS"
2. All bugs documented
3. Proceed to Phase 4: Remove test mode

### If ⚠️ NEEDS FIXES
1. Prioritize by severity
2. Fix CRITICAL/HIGH bugs
3. Re-test affected workflows
4. Re-run UAT when ready

### If ❌ BLOCKER
1. Investigate immediately
2. Fix and re-test
3. Restart UAT from beginning

---

**You've got this! 🚀 Start with the checklist and document everything. The system has been well-built, so issues will be edge cases or UX polish, not core logic problems.**

