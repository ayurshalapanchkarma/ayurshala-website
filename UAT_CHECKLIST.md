# AYURSHALA – COMPLETE UAT TESTING CHECKLIST

**Date Started:** _______________  
**Date Completed:** _______________  
**Tester Name:** _______________  
**Device:** Desktop / Mobile / Tablet  
**Browser:** Chrome / Safari / Firefox  
**Theme:** Light Mode / Dark Mode  

---

## PATIENT PROFILE BEING TESTED

Choose ONE and test completely:

- [ ] Profile 1: Elderly, mobile, dark mode
- [ ] Profile 2: Professional, desktop, light theme
- [ ] Profile 3: Returning patient, dashboard focused

---

## HOME PAGE TESTS

### Visual & Theme
- [ ] Logo visible and centered (dark mode)
- [ ] Logo visible and centered (light mode)
- [ ] Navbar glassmorphism consistent
- [ ] Mobile hamburger menu works smoothly
- [ ] Theme toggle switches smoothly
- [ ] Theme persists after page refresh
- [ ] No text clipping observed
- [ ] No icon misalignment
- [ ] Glass cards readable in both themes
- [ ] All links underlined or clearly clickable

### Layout & Responsiveness
- [ ] Footer spacing correct
- [ ] Footer responsive on mobile
- [ ] All footer links working
- [ ] Smooth scrolling to sections
- [ ] Mobile layout stacks properly
- [ ] No horizontal scrollbars

### CTA & Navigation
- [ ] "Book Appointment" CTA visible
- [ ] "Book Appointment" CTA obvious and prominent
- [ ] Navigation clear and intuitive
- [ ] Doctor profiles section readable
- [ ] Treatment information clear

**Issues Found:** _______________________________________________________________

---

## BOOKING FORM TESTS

### Field Validation
- [ ] Required field validation works
- [ ] Invalid email rejected with message
- [ ] Invalid phone rejected with message
- [ ] Empty form submission prevented
- [ ] Excessively long names handled
- [ ] Special characters accepted/rejected appropriately
- [ ] Mobile keyboard types correct (email, tel, date)

### Date & Time Selection
- [ ] Calendar opens smoothly
- [ ] Can select future dates
- [ ] Cannot select past dates
- [ ] Time slots display clearly
- [ ] Time slots available for selection

### Payment Method Selection
- [ ] Both payment options clear
- [ ] "Online Payment" option explained
- [ ] "Cash on Arrival" option explained
- [ ] Fees visible for each option
- [ ] Pricing clear and accurate

### Form Submission
- [ ] Booking summary shows before submission
- [ ] Summary includes all entered data
- [ ] Amount shown matches selected payment method
- [ ] Submit button clearly visible
- [ ] Form submits successfully

### Theme Consistency
- [ ] Form fields visible in dark mode
- [ ] Form labels readable in dark mode
- [ ] Dropdown text visible in dark mode
- [ ] Glassmorphism consistent with home page
- [ ] All form elements properly styled

**Issues Found:** _______________________________________________________________

---

## ONLINE PAYMENT FLOW TESTS

### Success Scenario
- [ ] ₹1 payment initiates
- [ ] Payment page loads completely
- [ ] Can complete payment without errors
- [ ] Redirected to confirmation page
- [ ] Confirmation page shows correct booking details
- [ ] Confirmation page shows ₹1 amount
- [ ] Can refresh confirmation page without issues
- [ ] Patient receives confirmation email immediately

### Edge Cases
- [ ] Payment cancelled midway → booking not created
- [ ] Back button after payment → doesn't duplicate booking
- [ ] Double-click payment button → payment processes once
- [ ] Payment fails → can retry
- [ ] Payment fails → customer can rebook

### Financial Accuracy
- [ ] amount_paid = ₹1 in database
- [ ] Revenue reflects ₹1
- [ ] Payment status = SUCCESS
- [ ] No duplicate payment records

**Issues Found:** _______________________________________________________________

---

## OFFLINE (CASH) PAYMENT FLOW TESTS

### Cash Pending State
- [ ] Booking created successfully
- [ ] Patient receives "Cash on Arrival" confirmation email
- [ ] Dashboard shows "Cash Pending" status
- [ ] Amount shows "₹XXX – Cash on Arrival"

### Admin Cash Collection
- [ ] Admin can access booking
- [ ] Can collect full cash (₹XXX)
- [ ] Can collect partial cash (₹YYY where YYY < XXX)
- [ ] Can mark "No Cash Collected"
- [ ] Revenue updates immediately after collection
- [ ] Badge changes to "Cash Received ₹XXX"

### Financial Accuracy
- [ ] amount_paid updates correctly for collected amount
- [ ] Revenue reflects actual collected amount (not booking price)
- [ ] Partial collection tracked accurately

**Issues Found:** _______________________________________________________________

---

## BOOKING CONFIRMATION PAGE TESTS

### Visual Design
- [ ] Blob gradients visible
- [ ] No white background artifacts blocking gradients
- [ ] Dark mode appearance clean
- [ ] Glassmorphism card renders correctly
- [ ] Logo visible and sized appropriately

### Information Display
- [ ] Booking ID shows correctly
- [ ] Patient name shows correctly
- [ ] Appointment date shows correctly
- [ ] Appointment time shows correctly
- [ ] Treatment information shows correctly
- [ ] Payment amount shows correctly
- [ ] Payment method shows correctly (Online/Cash)

### Mobile Responsiveness
- [ ] Page responsive on mobile
- [ ] Text readable on small screens
- [ ] Buttons clickable on mobile
- [ ] No horizontal scrolling needed
- [ ] CTA buttons stack on mobile

### CTAs & Actions
- [ ] "Go to Dashboard" button present
- [ ] "Go to Website" button present
- [ ] All buttons are clickable
- [ ] Buttons navigate to correct pages

**Issues Found:** _______________________________________________________________

---

## PATIENT DASHBOARD TESTS

### Patient Information
- [ ] Patient ID displays correctly
- [ ] Patient name displays correctly
- [ ] Patient email displays correctly

### Booking History
- [ ] Shows all patient bookings
- [ ] Bookings ordered by date (newest first)
- [ ] Each booking shows booking ID
- [ ] Each booking shows appointment date/time
- [ ] Each booking shows treatment type
- [ ] Each booking shows payment status
- [ ] Status badges display correctly

### Status Badges
- [ ] "Pending Confirmation" shown correctly
- [ ] "Confirmed" shown correctly
- [ ] "Cash Received ₹XXX" shown correctly
- [ ] "Cancelled" shown correctly
- [ ] "Refunded ₹XXX" shown correctly
- [ ] Badge colors consistent

### Responsive Design
- [ ] Dashboard responsive on mobile
- [ ] Table scrolls horizontally if needed
- [ ] All information readable on mobile
- [ ] No layout broken on any device

### Dark Mode
- [ ] All text readable in dark mode
- [ ] Table borders visible
- [ ] Status badges visible
- [ ] No white-on-white or dark-on-dark issues

**Issues Found:** _______________________________________________________________

---

## RESCHEDULE FLOW TESTS

### Patient Initiates Reschedule
- [ ] Can submit reschedule request
- [ ] Can select new date/time
- [ ] Request email sent to patient
- [ ] Request email sent to admin
- [ ] Status changes to "Reschedule Requested"

### Edge Cases
- [ ] Cannot request reschedule on cancelled booking
- [ ] Cannot request reschedule twice on same booking
- [ ] Can request reschedule on different booking

### Admin Approves Reschedule
- [ ] Admin receives reschedule request email
- [ ] Admin can click "Approve" link
- [ ] Approval page loads (branded status page)
- [ ] Booking status changes to confirmed with new date
- [ ] Patient receives approval email
- [ ] Old date crossed out / new date shown

### Admin Rejects Reschedule
- [ ] Admin can click "Reject" link
- [ ] Rejection page loads (branded status page)
- [ ] Original booking remains unchanged
- [ ] Patient receives rejection email

### Patient Experience
- [ ] Email subject line clear
- [ ] Email instructions clear
- [ ] Status page messaging reassuring
- [ ] Dashboard reflects new date after approval

**Issues Found:** _______________________________________________________________

---

## EMAIL QUALITY TESTS

### Visual Quality (All Emails)
- [ ] Logo centered and sized appropriately
- [ ] Premium appearance (not plain text)
- [ ] Glassmorphism/card effect present
- [ ] Ayurshala branding consistent
- [ ] Email renders in Gmail (desktop)
- [ ] Email renders in Gmail (mobile)
- [ ] Email renders in Apple Mail
- [ ] Email renders in Outlook

### Dark Mode Email Reading
- [ ] Text readable in dark mode
- [ ] Background sufficient contrast
- [ ] No white-on-white issues
- [ ] Buttons visible and clickable

### Content Accuracy
- [ ] Booking ID correct in email
- [ ] Patient name correct in email
- [ ] Patient ID shown (if applicable)
- [ ] Date/time correct
- [ ] Amount correct (uses amount_paid, not treatment price)
- [ ] Treatment information correct
- [ ] Status/action clear

### Button Functionality
- [ ] All CTA buttons clickable
- [ ] Buttons navigate to correct URLs
- [ ] Links don't break on mobile
- [ ] Links work in email clients

### Specific Email Types

#### Booking Confirmation (Online)
- [ ] Shows payment received
- [ ] Shows booking details
- [ ] Amount accurate
- [ ] "View Dashboard" button works

#### Booking Confirmation (Cash)
- [ ] Shows cash on arrival
- [ ] Shows booking details
- [ ] Explains payment collection at clinic
- [ ] Reassuring tone

#### Payment Success
- [ ] Shows amount paid (₹1 or actual amount)
- [ ] Shows booking confirmation
- [ ] Amount matches database

#### Payment Failed
- [ ] Explains payment could not be processed
- [ ] Offers retry option
- [ ] Provides support contact

#### Cancellation (Patient)
- [ ] Clear cancellation confirmation
- [ ] Shows refund status (if applicable)
- [ ] Shows original booking ID
- [ ] Provides support contact

#### Refund (Patient)
- [ ] Shows refund amount (uses refund_amount)
- [ ] Shows timeline for refund
- [ ] Shows booking ID
- [ ] Reassuring tone

#### Reschedule Request Received
- [ ] Acknowledges request
- [ ] Shows old and requested new dates
- [ ] Sets expectation for response time

#### Reschedule Approved
- [ ] Shows approval confirmation
- [ ] Shows new date/time clearly
- [ ] Shows old date crossed out
- [ ] Thanks patient

#### Reschedule Rejected
- [ ] Shows rejection
- [ ] Explains next steps
- [ ] Suggests contacting clinic
- [ ] Empathetic tone

**Issues Found:** _______________________________________________________________

---

## STATUS PAGE TESTS

### Success States
- [ ] Booking confirmed page loads
- [ ] Booking cancelled page loads
- [ ] Reschedule approved page loads
- [ ] All success pages show checkmark/positive icon
- [ ] Green color scheme applied

### Error States
- [ ] Already confirmed page shows info icon
- [ ] Already cancelled page shows warning
- [ ] Reschedule rejected page shows X icon
- [ ] Already processed page shows warning
- [ ] Appropriate color schemes applied

### Design Quality
- [ ] Branding consistent with app
- [ ] Glassmorphism effect present
- [ ] Mobile responsive
- [ ] Blurred background visible
- [ ] All text readable in dark mode

### Messaging
- [ ] Title clear and appropriate
- [ ] Description explains situation
- [ ] Booking ID shown (if applicable)
- [ ] Buttons clearly labeled

### Button Functionality
- [ ] Primary CTA button works
- [ ] Secondary CTA button works (if shown)
- [ ] Buttons navigate correctly
- [ ] No errors on click

**Issues Found:** _______________________________________________________________

---

## ADMIN DASHBOARD TESTS

### Booking Management
- [ ] All bookings visible
- [ ] Sorting by date works
- [ ] Sorting by patient works
- [ ] Sorting by status works
- [ ] Sorting by payment works

### Admin Actions
- [ ] "Confirm" button appears for pending
- [ ] "Cancel" button appears for all
- [ ] "Collect Cash" button appears for cash pending
- [ ] "Record Refund" button appears for refunds needed
- [ ] Buttons disabled after click (prevent double-click)
- [ ] Loading indicator shown during action
- [ ] Badge updates immediately after action (AJAX)
- [ ] No page refresh needed

### Financial Accuracy
- [ ] Revenue total shows correct amount
- [ ] Refunds total shows correct amount
- [ ] Net revenue calculated correctly
- [ ] Individual booking amounts match

### Cash Collection
- [ ] Can collect full amount
- [ ] Can collect partial amount
- [ ] Can mark no cash collected
- [ ] Revenue updates correctly
- [ ] Badge updates immediately

### Refund Processing
- [ ] Can record full refund
- [ ] Can record partial refund
- [ ] Cannot over-refund (amount_paid validation)
- [ ] Refund amount field accepts ₹
- [ ] Revenue adjusts after refund

**Issues Found:** _______________________________________________________________

---

## DARK MODE COMPREHENSIVE AUDIT

Test EVERY page in dark mode:

### Home Page
- [ ] Text readable
- [ ] Buttons visible
- [ ] Borders visible
- [ ] Images visible
- [ ] No white text on white

### Booking Form
- [ ] Input fields readable
- [ ] Labels visible
- [ ] Dropdowns show options clearly
- [ ] Error messages readable
- [ ] Buttons visible

### Dashboard
- [ ] Table readable
- [ ] Row alternation visible
- [ ] Status badges visible
- [ ] Patient info visible
- [ ] No contrast issues

### Admin Panel
- [ ] Bookings table readable
- [ ] Revenue numbers visible
- [ ] Buttons visible
- [ ] Modals readable
- [ ] Form fields readable

### Status Pages
- [ ] Icon visible
- [ ] Text readable
- [ ] Buttons visible
- [ ] Booking details readable

### Emails (if possible)
- [ ] Background and text sufficient contrast
- [ ] Images visible
- [ ] Buttons clickable

**Issues Found:** _______________________________________________________________

---

## ACCESSIBILITY TESTS

- [ ] Can navigate using keyboard only
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Buttons have descriptive labels
- [ ] Links have descriptive text (not "click here")
- [ ] Form labels associated with inputs
- [ ] Error messages clear
- [ ] Color not only means of conveying info
- [ ] Text contrast sufficient (WCAG AA)

**Issues Found:** _______________________________________________________________

---

## COPYWRITING REVIEW

Flag any wording that seems:
- [ ] Too technical
- [ ] Too robotic
- [ ] Developer-focused
- [ ] Confusing or unclear
- [ ] Not patient-friendly

**Specific terminology to review:**

- "Refund Pending" → Patient friendly?
- "No Cash Collected" → Clear to patient?
- "Reschedule Rejected" → Empathetic?
- "PAYMENT_PENDING" → Should ever show to patient?
- "Cash on Arrival" → Clear enough?
- "Therapy Later" → Explained well?
- "Booking Confirmed" → Reassuring?

**Copy Improvements Suggested:** ___________________________________________________

---

## FINANCIAL ACCURACY TESTS

### Test Case 1: ₹1 Online Payment
- [ ] Booking created with ₹1 amount
- [ ] Payment completes
- [ ] amount_paid = 1 in database
- [ ] Email shows ₹1
- [ ] Dashboard shows ₹1
- [ ] Revenue includes ₹1

### Test Case 2: Partial Cash Collection
- [ ] Booking amount = ₹500
- [ ] Admin collects ₹300
- [ ] amount_paid updated to ₹300
- [ ] Revenue shows ₹300
- [ ] Dashboard shows "Cash Received ₹300"

### Test Case 3: Partial Refund
- [ ] Original payment = ₹500
- [ ] Refund = ₹200
- [ ] refund_amount set to ₹200
- [ ] Email shows ₹200
- [ ] Revenue adjusted (₹500 - ₹200 = ₹300 net)
- [ ] Dashboard shows refund amount

### Test Case 4: Over-Refund Prevention
- [ ] Try to refund ₹600 for ₹500 booking
- [ ] System rejects with message
- [ ] No refund processed
- [ ] Revenue unchanged

**Financial Issues Found:** ______________________________________________________

---

## FINAL BUG HUNT - INTENTIONAL BREAKING

### Duplicate Prevention Tests
- [ ] Double-click payment button → one payment only
- [ ] Refresh confirmation page → no new booking
- [ ] Back button after payment → no duplicate
- [ ] Submit form twice → one booking only
- [ ] Open booking link in multiple tabs → no duplicates

### Edge Case Tests
- [ ] Very slow internet → timeouts handled gracefully
- [ ] Browser close mid-payment → booking not corrupted
- [ ] Reuse old email link → link expired message
- [ ] Click confirmation link twice → already processed
- [ ] Multiple reschedule requests → handled correctly

### Data Integrity Tests
- [ ] Cancel booking, then refund → works correctly
- [ ] Collect partial cash, then refund → math correct
- [ ] Reschedule after partial collection → amounts preserved
- [ ] Multiple patients, multiple bookings → no cross-contamination

**Critical Bugs Found:** _________________________________________________________

---

## PRODUCTION READINESS ASSESSMENT

### Blockers (CRITICAL - Must Fix Before Launch)
- [ ] No critical bugs discovered
- [ ] No financial inaccuracies
- [ ] No duplicate bookings possible
- [ ] No unhandled errors visible to users
- [ ] All payments tracked accurately

### High Priority (Must Fix Before Launch)
- [ ] No broken email flows
- [ ] No broken workflows
- [ ] No status page errors
- [ ] All CTAs functional
- [ ] Dark mode fully tested

### Medium Priority (Should Fix Before Public Launch)
- [ ] No visual glitches
- [ ] No confusing copy
- [ ] No accessibility issues
- [ ] Mobile layout works perfectly
- [ ] Theme consistency throughout

### Low Priority (Can Fix Post-Launch)
- [ ] Animation polish
- [ ] Minor copy improvements
- [ ] Enhancement suggestions
- [ ] Future feature ideas

---

## SUMMARY

**Overall Status:** ☐ PASS / ☐ REQUIRES FIXES / ☐ CRITICAL ISSUES

**Critical Issues Count:** _____  
**High Priority Issues Count:** _____  
**Medium Priority Issues Count:** _____  
**Low Priority Issues Count:** _____  

**Recommendation:**

☐ APPROVED FOR PRODUCTION  
☐ APPROVED WITH FIXES (list in separate bug report)  
☐ NOT APPROVED - CRITICAL ISSUES FOUND  

**Sign-Off:** ___________________________ Date: _______________

**Notes/Comments:**

_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

## BUGS DISCOVERED

(Attach detailed bug report using template on next page)

