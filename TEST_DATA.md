# AYURSHALA – TEST DATA & CREDENTIALS

## TEST ACCOUNTS

### Admin Account
- **Email:** ayurshalapanchkarma@gmail.com
- **Password:** [Check 1Password/secure store]
- **Role:** Admin
- **Access:** Dashboard, booking management, refunds, cash collection

### Patient Test Account
- **Email:** [Create fresh Gmail for each profile]
- **Name:** Test Patient [Profile Name]
- **Phone:** +91-98XXXXXXXX (Use any valid Indian number format)
- **Google Account:** Link to dedicated test Gmail

---

## TEST PATIENT PROFILES

### Profile 1: Elderly User (Mobile, Dark Mode)
- **Name:** Rajesh Kumar
- **Email:** rajesh.test.patient1@gmail.com
- **Phone:** +91-9876543210
- **Device:** Mobile (iPhone/Android)
- **Browser:** Chrome Mobile or Safari Mobile
- **Theme:** Dark Mode
- **Notes:** Test accessibility, large touch targets, simple navigation

### Profile 2: Professional (Desktop, Light Mode)
- **Name:** Priya Sharma
- **Email:** priya.test.patient2@gmail.com
- **Phone:** +91-9876543211
- **Device:** Desktop/Laptop
- **Browser:** Chrome Desktop
- **Theme:** Light Mode
- **Notes:** Test productivity features, quick actions, dashboard

### Profile 3: Returning Patient (Dashboard Focus)
- **Name:** Anjali Patel
- **Email:** anjali.test.patient3@gmail.com
- **Phone:** +91-9876543212
- **Device:** Desktop/Mobile (both)
- **Browser:** Chrome, Safari
- **Theme:** Both light and dark
- **Notes:** Create multiple bookings first, then test dashboard

---

## TEST PAYMENT AMOUNTS

### Tier 1: Minimal Amount (Test Mode)
- **Amount:** ₹1
- **Purpose:** Payment flow validation
- **Current Status:** ✅ Enabled (test mode active)
- **Expected Result:** Payment succeeds, amount_paid=1, revenue updates

### Tier 2: Consultation (When Real Mode Enabled)
- **Amount:** ₹500
- **Purpose:** Standard consultation booking
- **Status:** Disabled until Phase 4
- **Expected Result:** Payment succeeds, amount reflects correctly

### Tier 3: Therapy (When Real Mode Enabled)
- **Amount:** ₹1000
- **Purpose:** Full therapy session booking
- **Status:** Disabled until Phase 4
- **Expected Result:** Payment succeeds, amount reflects correctly

---

## BOOKING TEST DATA

### Booking Type 1: Online Payment
- **Treatment:** Consultation
- **Date:** Any future date
- **Time:** Any available slot
- **Payment:** Online (₹1 test)
- **Expected Status:** CONFIRMED → payment success
- **Email Check:** Should receive confirmation immediately

### Booking Type 2: Cash on Arrival
- **Treatment:** Therapy
- **Date:** Any future date
- **Time:** Any available slot
- **Payment:** Cash
- **Expected Status:** PENDING_CONFIRMATION
- **Admin Action:** Confirm and collect cash

### Booking Type 3: Reschedule After Payment
- **Original:** Online booking (completed)
- **Action:** Request reschedule
- **New Date:** Different future date
- **Expected:** Status = RESCHEDULED, awaiting admin approval

---

## REFUND TEST SCENARIOS

### Scenario 1: Full Refund
- **Original Booking:** ₹1 online payment
- **Refund Amount:** ₹1
- **Expected:** amount_paid=1, refund_amount=1, revenue=0
- **Validation:** Email shows ₹1 refund, dashboard shows refunded status

### Scenario 2: Partial Refund
- **Original Booking:** ₹500 online payment
- **Refund Amount:** ₹250
- **Expected:** amount_paid=500, refund_amount=250, revenue=250
- **Validation:** Email shows ₹250, revenue calculated correctly

### Scenario 3: Over-Refund Prevention
- **Original Booking:** ₹1 online payment
- **Attempt Refund:** ₹2
- **Expected:** Error message "Refund amount exceeds paid amount"
- **Validation:** Refund rejected, no processing

### Scenario 4: Zero Payment (Cash Not Collected)
- **Original Booking:** Cash on Arrival
- **Admin Action:** Mark "No Cash Collected"
- **Expected:** amount_paid=0, status=NO_CASH_COLLECTED
- **Validation:** No refund possible, booking marked as not collected

---

## CASH COLLECTION TEST SCENARIOS

### Scenario 1: Full Collection
- **Expected Amount:** ₹500
- **Collected:** ₹500
- **Expected:** amount_paid=500, badge shows "Cash Received ₹500"

### Scenario 2: Partial Collection
- **Expected Amount:** ₹500
- **Collected:** ₹300
- **Expected:** amount_paid=300, badge shows "Cash Received ₹300"

### Scenario 3: No Collection
- **Expected Amount:** ₹500
- **Collected:** ₹0
- **Expected:** amount_paid=0, status=NO_CASH_COLLECTED, badge shows "No Cash Collected"

### Scenario 4: Over-Collection (Should be prevented or noted)
- **Expected Amount:** ₹500
- **Attempted Collection:** ₹600
- **Expected:** Either prevented or collected with note

---

## EMAIL TEST CHECKLIST

### Emails to Verify (One of Each)

1. **Booking Confirmation (Online)**
   - Test Email: Send to Profile 1
   - Check: Logo, amount (₹1), date, time, booking ID
   - Verify: Logo centered, premium appearance, mobile responsive

2. **Booking Confirmation (Cash)**
   - Test Email: Send to Profile 2
   - Check: "Cash on Arrival", no payment amount, date, time
   - Verify: Clear payment expectations

3. **Payment Successful**
   - Test Email: Auto-sent after ₹1 payment
   - Check: Amount shows ₹1, booking confirmed
   - Verify: Email received within 1-2 minutes

4. **Cancellation Notification**
   - Test Email: Admin cancels booking
   - Check: Booking ID, cancellation notice, contact info
   - Verify: Patient clearly informed

5. **Refund Completed**
   - Test Email: Admin records refund
   - Check: Refund amount (₹1 or ₹250), timeline, support contact
   - Verify: Reassuring tone

6. **Reschedule Approved**
   - Test Email: Admin approves reschedule request
   - Check: New date/time, old date shown, confirmation
   - Verify: Clear instructions

7. **Reschedule Rejected**
   - Test Email: Admin rejects reschedule request
   - Check: Explanation, next steps, support contact
   - Verify: Empathetic tone

---

## URLS TO TEST

### Patient URLs
- `https://ayurshala.com/` – Home page
- `https://ayurshala.com/book` – Booking form
- `https://ayurshala.com/book/confirmed?booking_id=XXX` – Confirmation page
- `https://ayurshala.com/book/failed` – Payment failure page
- `https://ayurshala.com/my-bookings` – Patient dashboard

### Admin URLs
- `https://ayurshala.com/admin` – Admin login
- `https://ayurshala.com/admin` (logged in) – Dashboard
- `https://ayurshala.com/admin/refunds` – Refund management

### Status Pages
- `https://ayurshala.com/status/confirm?type=success&booking_id=XXX` – Confirm success
- `https://ayurshala.com/status/cancel?type=success&booking_id=XXX` – Cancel success
- `https://ayurshala.com/status/reschedule?type=approved&booking_id=XXX` – Reschedule approved

---

## KEYBOARD SHORTCUTS (For Testing)

- **Toggle Theme:** May vary by browser (check theme toggle UI)
- **Inspect Element:** F12 or Cmd+Option+I
- **Mobile View:** F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- **Console:** F12 → Console tab (check for JS errors)

---

## BROWSER DEV TOOLS CHECKS

### Console (F12 → Console tab)
- [ ] No JavaScript errors
- [ ] No TypeScript errors
- [ ] No warnings (except third-party libs)
- [ ] All API calls successful (Network tab)

### Network Tab (F12 → Network)
- [ ] All API requests complete
- [ ] No 404 errors
- [ ] No CORS issues
- [ ] Emails sent successfully (check Resend logs externally)

### Local Storage
- [ ] Theme preference saved
- [ ] User session maintained
- [ ] No sensitive data stored in localStorage

---

## REGRESSION TEST CHECKLIST

Run these after each bug fix:

- [ ] Online booking still works (₹1)
- [ ] Cash booking still works
- [ ] Refund still works
- [ ] Reschedule still works
- [ ] Admin dashboard still works
- [ ] No new console errors
- [ ] All emails still send
- [ ] Dark mode still works

---

## FINAL HANDOFF CHECKLIST

Before approving for production:

- [ ] All three patient profiles tested
- [ ] All devices tested (mobile, desktop, tablet)
- [ ] All themes tested (light, dark)
- [ ] All browsers tested (Chrome, Safari, Firefox)
- [ ] All workflows completed successfully
- [ ] All emails verified visually
- [ ] No critical bugs remaining
- [ ] No financial discrepancies
- [ ] No duplicate bookings/payments possible
- [ ] Dark mode fully functional
- [ ] Accessibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Copy reviewed and approved
- [ ] Status pages tested
- [ ] Admin actions tested
- [ ] Revenue calculations verified

**All Tests Passed:** ☐ YES / ☐ NO

**Ready for Production:** ☐ YES / ☐ NO

**Sign-Off By:** _______________  
**Date:** _______________  

