# Admin Dashboard Status & Payment Matrix - QA Reference

This document outlines the expected rendering for all booking states across light and dark themes.

## State Matrix

### 1. PAYMENT_PENDING
**Booking Status:** PAYMENT_PENDING

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Payment Pending" (amber-100/80, text-amber-900) | "Payment Pending" (amber-950/50, text-amber-200) |
| Payment Badge | "Pending" (gray-100/80, text-gray-900) | "Pending" (gray-950/50, text-gray-200) |
| Actions | None | None |

**Conditions:**
- Triggers when `status = 'PAYMENT_PENDING'`
- No action buttons shown


### 2. PENDING_CONFIRMATION (Online + Paid)
**Booking Status:** PENDING_CONFIRMATION  
**Payment Method:** ONLINE  
**Payment Status:** PAID

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Awaiting Confirmation" (yellow-100/80, text-yellow-900) | "Awaiting Confirmation" (yellow-950/50, text-yellow-200) |
| Payment Badge | "Paid" (green-100/80, text-green-900) | "Paid" (green-950/50, text-green-200) |
| Actions | Confirm, Cancel | Confirm, Cancel |

**Conditions:**
- `status = 'PENDING_CONFIRMATION'` AND `payment_method = 'ONLINE'` AND `payment_status = 'PAID'`
- Confirm button: green
- Cancel button: red


### 3. PENDING_CONFIRMATION (Cash + Pending)
**Booking Status:** PENDING_CONFIRMATION  
**Payment Method:** CASH_ON_ARRIVAL  
**Payment Status:** PENDING

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Awaiting Confirmation" (yellow-100/80, text-yellow-900) | "Awaiting Confirmation" (yellow-950/50, text-yellow-200) |
| Payment Badge | "Cash Pending" (orange-100/80, text-orange-900) | "Cash Pending" (orange-950/50, text-orange-200) |
| Actions | Confirm, Cancel | Confirm, Cancel |

**Conditions:**
- `status = 'PENDING_CONFIRMATION'` AND `payment_method = 'CASH_ON_ARRIVAL'` AND `payment_status = 'PENDING'`


### 4. CONFIRMED (Not Rescheduled)
**Booking Status:** CONFIRMED  
**Rescheduled_at:** NULL

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Confirmed" (green-100/80, text-green-900) | "Confirmed" (green-950/50, text-green-200) |
| Payment Badge | Depends on payment_method + payment_status | Depends on payment_method + payment_status |
| Actions | Cancel | Cancel |

**Payment Badge Conditions:**
- If `payment_status = 'PAID'` → "Paid" (green)
- If `payment_method = 'CASH_ON_ARRIVAL'` AND `payment_status = 'PENDING'` → "Cash Pending" (orange)
- If `payment_method = 'CASH_ON_ARRIVAL'` AND `payment_status = 'PAID'` → "Paid" (green)


### 5. CONFIRMED + RESCHEDULED
**Booking Status:** CONFIRMED  
**Rescheduled_at:** NOT NULL

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Rescheduled Confirmed" (emerald-100/80, text-emerald-900) | "Rescheduled Confirmed" (emerald-950/50, text-emerald-200) |
| Payment Badge | Preserved from existing state | Preserved from existing state |
| Actions | Cancel | Cancel |

**Conditions:**
- `status = 'CONFIRMED'` AND `rescheduled_at IS NOT NULL`
- Reschedule button is NOT shown
- Cancel button only


### 6. RESCHEDULED
**Booking Status:** RESCHEDULED

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Reschedule Requested" (orange-100/80, text-orange-900) | "Reschedule Requested" (orange-950/50, text-orange-200) |
| Payment Badge | Preserved from existing state | Preserved from existing state |
| Actions | Approve Reschedule, Reject Reschedule | Approve Reschedule, Reject Reschedule |

**Conditions:**
- `status = 'RESCHEDULED'`
- Approve button: blue
- Reject button: orange


### 7. CANCELLED
**Booking Status:** CANCELLED

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Cancelled" (red-100/80, text-red-900) | "Cancelled" (red-950/50, text-red-200) |
| Payment Badge | Preserved from existing state | Preserved from existing state |
| Actions | None | None |

**Conditions:**
- `status = 'CANCELLED'`
- No action buttons shown


### 8. COMPLETED
**Booking Status:** COMPLETED

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "Completed" (blue-100/80, text-blue-900) | "Completed" (blue-950/50, text-blue-200) |
| Payment Badge | Preserved from existing state | Preserved from existing state |
| Actions | None | None |

**Conditions:**
- `status = 'COMPLETED'`
- No action buttons shown


### 9. NO_SHOW
**Booking Status:** NO_SHOW

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "No Show" (slate-100/80, text-slate-900) | "No Show" (slate-950/50, text-slate-200) |
| Payment Badge | Preserved from existing state | Preserved from existing state |
| Actions | None | None |

**Conditions:**
- `status = 'NO_SHOW'`
- No action buttons shown


### 10. IN_PROGRESS
**Booking Status:** IN_PROGRESS

| Component | Light Theme | Dark Theme |
|-----------|------------|-----------|
| Status Badge | "In Progress" (indigo-100/80, text-indigo-900) | "In Progress" (indigo-950/50, text-indigo-200) |
| Payment Badge | Preserved from existing state | Preserved from existing state |
| Actions | Mark Completed, Mark No Show | Mark Completed, Mark No Show |

**Conditions:**
- `status = 'IN_PROGRESS'`
- Mark Completed button: blue
- Mark No Show button: slate


## Color Reference

### Status Badge Colors
- **Amber/Yellow:** PAYMENT_PENDING, PENDING_CONFIRMATION
- **Green:** CONFIRMED (when not rescheduled)
- **Emerald:** CONFIRMED + rescheduled_at NOT NULL
- **Orange:** RESCHEDULED
- **Red:** CANCELLED
- **Blue:** COMPLETED
- **Slate:** NO_SHOW
- **Indigo:** IN_PROGRESS

### Payment Badge Colors
- **Gray:** PENDING (when status = PAYMENT_PENDING)
- **Green:** PAID, SUCCESS
- **Orange:** CASH_ON_ARRIVAL + PENDING, COD_PENDING
- **Blue:** REFUNDED
- **Red:** FAILED

### Action Button Colors
- **Green:** Confirm
- **Red:** Cancel
- **Blue:** Approve Reschedule, Mark Completed
- **Orange:** Reject Reschedule
- **Slate:** Mark No Show

## Theme Consistency

### Light Theme CSS Classes
- Badge format: `bg-[COLOR]-100/80 text-[COLOR]-900`
- Ensures good contrast: dark text on light background
- Example: `bg-green-100/80 text-green-900`

### Dark Theme CSS Classes
- Badge format: `dark:bg-[COLOR]-950/50 dark:text-[COLOR]-200`
- Ensures good contrast: light text on dark background
- Example: `dark:bg-green-950/50 dark:text-green-200`

## Implementation Notes

- All badges use `font-medium` for improved readability
- All CSS classes use Tailwind's `dark:` prefix for theme switching
- No hardcoded colors in JSX
- Theme awareness is automatic via `next-themes` hook
- Payment badges are INDEPENDENT from status badges (never show contradictory info)
- Actions are derived from `getAvailableActions(booking)` helper
- No white text on white backgrounds (light theme)
- No dark text on dark backgrounds (dark theme)

## Acceptance Criteria ✓

- [x] Every database status has a corresponding UI badge
- [x] Payment state is displayed independently from booking state
- [x] Action buttons match allowed transitions only
- [x] Dark mode and light mode pass visual inspection
- [x] No booking row displays contradictory information
- [x] Helper functions: `getStatusBadge()`, `getPaymentBadge()`, `getAvailableActions()`
- [x] All colors are theme-aware
- [x] Badge text is readable in both themes
