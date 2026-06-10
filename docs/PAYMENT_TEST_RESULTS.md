# Payment Workflow Test Results

**Date:** 2026-06-10  
**Environment:** Production  
**Tester:** QA Team

---

## Cash on Arrival Flow

### Scenario 1: COD Booking Creation
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Booking created | ✓ PENDING_CONFIRMATION | - | PENDING | Test in staging |
| Payment method | ✓ CASH_ON_ARRIVAL | - | PENDING | Verify DB |
| Patient email | ✓ Sent | - | PENDING | Check inbox |
| Admin email | ✓ Sent with action buttons | - | PENDING | Verify actionable |

### Scenario 2: Admin Confirms COD
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Status update | ✓ PENDING_CONFIRMATION → CONFIRMED | - | PENDING | Via confirm-reschedule? |
| Patient notification | ✓ Email sent | - | PENDING | Check template |
| Dashboard update | ✓ "Confirmed" badge | - | PENDING | Refresh patient page |

---

## Online Payment Flow

### Scenario 3: Online Payment - Successful
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Payment processed | ✓ SUCCESS | - | PENDING | Cashfree integration |
| Booking status | ✓ CONFIRMED | - | PENDING | Auto-confirm on success |
| Payment record | ✓ Stored in payments table | - | PENDING | Verify amount |
| Patient email | ✓ Confirmation sent | - | PENDING | Check receipt template |
| Amount reflected | ✓ Correct in invoice | - | PENDING | Verify calculation |

### Scenario 4: Online Payment - Failed
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Payment status | ✓ FAILED | - | PENDING | No deduction |
| Booking slot | ✓ Reserved for retry | - | PENDING | Still available |
| Patient page | ✓ Shows error, retry option | - | PENDING | UX verification |
| No duplicate charge | ✓ Single attempt only | - | PENDING | Verify logs |

### Scenario 5: Payment Retry
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Retry available | ✓ Yes, from /my-bookings | - | PENDING | CTA visible |
| New attempt | ✓ Creates new order | - | PENDING | Unique order ID |
| Previous charges | ✓ Not retried | - | PENDING | Clean slate |
| Success on retry | ✓ Confirms booking | - | PENDING | Happy path |

---

## Cancellation & Refund Flow

### Scenario 6: Paid Booking Cancellation
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Status | ✓ CONFIRMED → CANCELLED | - | PENDING | Via cancel endpoint |
| Payment status | ✓ REFUND_PENDING or INITIATED | - | PENDING | Not refunded yet |
| Patient email | ✓ Cancellation notice | - | PENDING | Include next steps |
| Refund queue | ✓ Entry created | - | PENDING | For admin approval |

### Scenario 7: Refund Request
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Request created | ✓ Yes | - | PENDING | Audit logged |
| Admin notification | ✓ Email sent | - | PENDING | Actionable email |
| Status in dashboard | ✓ "Refund Requested" | - | PENDING | Patient visibility |
| Timeline | ✓ Updated in records | - | PENDING | Track timing |

### Scenario 8: Refund Approved by Admin
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Refund processed | ✓ Via Cashfree | - | PENDING | Actual transfer |
| Payment status | ✓ REFUNDED | - | PENDING | DB updated |
| Patient email | ✓ Confirmation sent | - | PENDING | Include refund ID |
| Timeline | ✓ < 5 business days | - | PENDING | Bank transfer |

### Scenario 9: Refund Rejected by Admin
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| Status updated | ✓ REFUND_REJECTED | - | PENDING | With reason |
| Patient email | ✓ Notification sent | - | PENDING | Explain rejection |
| Booking status | ✓ Remains CANCELLED | - | PENDING | No reversal |

---

## Cross-Portal Consistency

### Scenario 10: Patient Visibility
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| /my-bookings | ✓ Shows all statuses | - | PENDING | Accurate labels |
| /patient/bookings | ✓ Shows all statuses | - | PENDING | Consistent UI |
| Payment badge | ✓ Correct for COD/Online | - | PENDING | Color-coded |
| Status labels | ✓ "Pending Confirmation", "Confirmed", "Cancelled", "Refund Requested" | - | PENDING | Clear language |

### Scenario 11: Admin Visibility
| Aspect | Expected | Actual | Status | Notes |
|--------|----------|--------|--------|-------|
| /admin dashboard | ✓ Shows bookings by tab | - | PENDING | Filter accuracy |
| Payment status | ✓ Correct in table | - | PENDING | "Paid", "Pending", "Refunded" |
| COD list | ✓ Shows awaiting confirmation | - | PENDING | Prioritized |
| Actionable email | ✓ Admin can confirm/decline | - | PENDING | Button functionality |

---

## Email Quality Assurance

### Scenario 12: Email Rendering
| Email Type | Platform | Expected | Actual | Status |
|------------|----------|----------|--------|--------|
| Booking Received | Gmail | ✓ Formatted correctly | - | PENDING |
| Booking Received | Outlook | ✓ No rendering issues | - | PENDING |
| Payment Confirmation | Gmail | ✓ Logo + details visible | - | PENDING |
| Refund Approval | Gmail | ✓ Amount + timeline | - | PENDING |

---

## Data Integrity

### Scenario 13: Database Consistency
| Check | Expected | Actual | Status | Notes |
|-------|----------|--------|--------|-------|
| Booking status flow | ✓ Valid transitions only | - | PENDING | No invalid states |
| Payment amount | ✓ Matches booking amount | - | PENDING | No mismatches |
| Audit logs | ✓ Complete trail | - | PENDING | All actions logged |
| No orphaned records | ✓ All payments tied to bookings | - | PENDING | Referential integrity |

---

## Sign-Off

- [ ] Cash on Arrival: PASS
- [ ] Online Payment Success: PASS
- [ ] Online Payment Failure: PASS
- [ ] Refund Flow: PASS
- [ ] Email Quality: PASS
- [ ] Data Integrity: PASS
- [ ] Cross-Portal Consistency: PASS

**All Scenarios Passed:** _____ (Date)  
**Tester:** ___________________  
**Reviewer:** ___________________  

---

**Ready for Production:** NO (Until all scenarios tested and marked PASS)
