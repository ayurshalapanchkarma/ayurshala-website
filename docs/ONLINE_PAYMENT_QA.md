# Online Payment QA - End-to-End Testing

**Date:** 2026-06-10  
**Environment:** Staging  
**Tester:** QA Team

---

## Test Scenarios

### Scenario 1: Online Payment Success
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Click "Pay Online" | Redirected to Cashfree | ⬜ | Test in staging |
| 2. Enter test card details | Payment gateway opens | ⬜ | Use test credentials |
| 3. Complete payment | Transaction succeeds | ⬜ | Verify amount |
| 4. Webhook received | Booking status → CONFIRMED | ⬜ | Check logs |
| 5. Email sent to patient | Confirmation received | ⬜ | Check inbox |
| 6. Admin dashboard | Payment shows "Paid" | ⬜ | Verify status |
| 7. /my-bookings page | Shows "Confirmed" badge | ⬜ | Verify badge |

### Scenario 2: Payment Webhook Integration
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Payment succeeds in Cashfree | Webhook POST to /api/payment/webhook | ⬜ | Monitor logs |
| 2. Webhook processed | No errors in response | ⬜ | Status 200 OK |
| 3. Database updated | booking.payment_status = SUCCESS | ⬜ | Query DB |
| 4. Amount stored | Matches order amount | ⬜ | Verify ₹ amount |
| 5. Email triggered | Patient email sent immediately | ⬜ | Check timing |

### Scenario 3: Payment Failure
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Invalid card attempted | Payment declined | ⬜ | Use test failure card |
| 2. User redirected | /book/payment-failed page shown | ⬜ | UX verification |
| 3. Booking slot | Still available for retry | ⬜ | Verify status |
| 4. No charge | ₹0 deducted | ⬜ | Confirm no balance impact |
| 5. Retry available | "Try Again" button visible | ⬜ | CTA check |

### Scenario 4: Cancel Online-Paid Booking
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Click Cancel | Confirmation modal shown | ⬜ | UX check |
| 2. Confirm cancellation | Status → CANCELLED | ⬜ | DB verification |
| 3. Refund flow initiated | Payment status → REFUND_INITIATED | ⬜ | Status check |
| 4. Patient email | Cancellation + refund info sent | ⬜ | Email received |
| 5. Admin dashboard | Shows "Refund Initiated" | ⬜ | Dashboard status |

### Scenario 5: Refund Request
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Request refund | API call to /api/refund | ⬜ | Check logs |
| 2. Request stored | In refunds table | ⬜ | DB query |
| 3. Admin notified | Email received | ⬜ | Inbox check |
| 4. Patient dashboard | Shows "Refund Requested" | ⬜ | UI status |
| 5. Audit logged | Refund request recorded | ⬜ | Audit trail |

### Scenario 6: Refund Approval
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Admin approves refund | Via dashboard CTA | ⬜ | Confirm button works |
| 2. Cashfree API called | Refund processed | ⬜ | Check logs |
| 3. Payment status | Updated to REFUNDED | ⬜ | DB verification |
| 4. Patient email | Refund confirmation sent | ⬜ | Include refund ID |
| 5. Refund tracking | Visible on dashboard | ⬜ | Status check |

### Scenario 7: COD Booking Still Works
| Step | Expected | Status | Notes |
|------|----------|--------|-------|
| 1. Select "Cash on Arrival" | Option available | ⬜ | UI check |
| 2. Create COD booking | Booking created | ⬜ | Booking ID generated |
| 3. Status | PENDING_CONFIRMATION | ⬜ | Correct status |
| 4. Admin email | Actionable email sent | ⬜ | Inbox check |
| 5. Admin confirms | Via email link | ⬜ | Confirm button works |
| 6. Status updated | CONFIRMED | ⬜ | Final status |

---

## Cross-Portal Verification

### Patient Portal (/my-bookings)
| Check | Expected | Status |
|-------|----------|--------|
| Online paid booking | Shows "Paid Online" badge | ⬜ |
| COD booking | Shows "Cash on Arrival" badge | ⬜ |
| Cancelled booking | Shows "Cancelled" with refund status | ⬜ |
| Can cancel paid booking | Cancel button visible | ⬜ |
| Can reschedule paid booking | Reschedule button visible (if >24h) | ⬜ |

### Admin Portal (/admin)
| Check | Expected | Status |
|-------|----------|--------|
| Online filter | Shows paid bookings only | ⬜ |
| COD filter | Shows COD bookings only | ⬜ |
| Payment status | Accurate for all bookings | ⬜ |
| Revenue metric | Calculates from SUCCESS payments only | ⬜ |
| Refund management | Can approve/reject refunds | ⬜ |

---

## Email Quality

### Booking Confirmation Email
| Check | Expected | Status |
|-------|----------|--------|
| Logo | Centered, crisp | ⬜ |
| Patient name | Displayed | ⬜ |
| Booking ID | Bold, orange | ⬜ |
| Treatment list | Correct | ⬜ |
| Date & time | Clear format | ⬜ |
| Payment status | "Paid Online" or "Pending" | ⬜ |
| Rendering (Gmail) | No broken images | ⬜ |
| Rendering (Outlook) | No rendering issues | ⬜ |

---

## Security & Data Integrity

### Payment Data
| Check | Expected | Status |
|-------|----------|--------|
| Amount validation | Never user-controlled | ⬜ |
| No duplicates | Single charge per attempt | ⬜ |
| Webhook signature | Verified from Cashfree | ⬜ |
| Order ID unique | No collisions | ⬜ |

### Refund Data
| Check | Expected | Status |
|-------|----------|--------|
| Only approved refunds process | Manual only | ⬜ |
| Amount matches original | No partial refunds without approval | ⬜ |
| Audit trail complete | All actions logged | ⬜ |
| Patient can't trigger refund | Admin approval required | ⬜ |

---

## Performance

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Payment page load | < 2s | - | ⬜ |
| Webhook response | < 1s | - | ⬜ |
| Email delivery | < 1min | - | ⬜ |
| Dashboard update | < 5s after webhook | - | ⬜ |

---

## Sign-Off

- [ ] All scenarios tested and passing
- [ ] Emails render correctly
- [ ] No console errors
- [ ] No database issues
- [ ] Admin dashboard accurate
- [ ] Patient portal consistent
- [ ] Security verified

**Ready for Production:** NO (Until all boxes checked)

**Tested By:** ___________________  
**Date:** ___________________  
**Sign-Off:** ___________________
