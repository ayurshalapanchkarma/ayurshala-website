# Badge Rendering Reference - Visual Guide

## Helper Function Flow

```
Booking Object (status, payment_method, payment_status, rescheduled_at)
    ↓
getStatusBadge(booking)     → { label: string, cls: string }
getPaymentBadge(booking)    → { label: string, cls: string }
getAvailableActions(booking) → string[]
    ↓
Rendered in UI:
- Status: <span className={cls}>{label}</span>
- Payment: <span className={cls}>{label}</span>
- Actions: <button>...</button> × N
```

## Status Badge Decision Tree

```
booking.status
├─ PAYMENT_PENDING
│  └─ "Payment Pending" (amber)
├─ PENDING_CONFIRMATION
│  └─ "Awaiting Confirmation" (yellow)
├─ CONFIRMED
│  ├─ booking.rescheduled_at exists?
│  │  ├─ YES → "Rescheduled Confirmed" (emerald)
│  │  └─ NO → "Confirmed" (green)
├─ RESCHEDULED
│  └─ "Reschedule Requested" (orange)
├─ CANCELLED
│  └─ "Cancelled" (red)
├─ COMPLETED
│  └─ "Completed" (blue)
├─ NO_SHOW
│  └─ "No Show" (slate)
├─ IN_PROGRESS
│  └─ "In Progress" (indigo)
└─ (unknown)
   └─ {status} (gray fallback)
```

## Payment Badge Decision Tree

```
booking.status
├─ PAYMENT_PENDING
│  └─ "Pending" (gray)
├─ PENDING_CONFIRMATION
│  ├─ booking.payment_method === 'ONLINE' && booking.payment_status === 'PAID'?
│  │  ├─ YES → "Paid" (green)
│  │  └─ NO → Check CASH_ON_ARRIVAL case
│  └─ booking.payment_method === 'CASH_ON_ARRIVAL' && booking.payment_status === 'PENDING'?
│     ├─ YES → "Cash Pending" (orange)
│     └─ NO → Preserve payment state (below)
├─ CONFIRMED
│  ├─ booking.payment_method === 'ONLINE' && booking.payment_status === 'PAID'?
│  │  ├─ YES → "Paid" (green)
│  │  └─ NO → Check CASH cases
│  ├─ booking.payment_method === 'CASH_ON_ARRIVAL' && booking.payment_status === 'PENDING'?
│  │  ├─ YES → "Cash Pending" (orange)
│  │  └─ NO → Check CASH_PAID case
│  └─ booking.payment_method === 'CASH_ON_ARRIVAL' && booking.payment_status === 'PAID'?
│     ├─ YES → "Paid" (green)
│     └─ NO → Preserve payment state (below)
└─ (Other: RESCHEDULED, CANCELLED, COMPLETED, NO_SHOW, IN_PROGRESS)
   └─ Preserve existing payment_status:
      ├─ 'PAID' or 'SUCCESS' → "Paid" (green)
      ├─ 'PENDING' or 'COD_PENDING' → "Cash Pending" (orange)
      ├─ 'REFUNDED' → "Refunded" (blue)
      ├─ 'FAILED' → "Failed" (red)
      └─ (unknown) → {payment_status} (gray fallback)
```

## Actions Decision Tree

```
booking.status
├─ PAYMENT_PENDING
│  └─ [] (no actions)
├─ PENDING_CONFIRMATION
│  └─ ['confirm', 'cancel']
├─ CONFIRMED
│  ├─ booking.rescheduled_at exists?
│  │  ├─ YES → ['cancel'] (no Reschedule button)
│  │  └─ NO → ['cancel']
├─ RESCHEDULED
│  └─ ['approve_reschedule', 'reject_reschedule']
├─ CANCELLED, COMPLETED, NO_SHOW
│  └─ [] (no actions)
├─ IN_PROGRESS
│  └─ ['mark_completed', 'mark_no_show']
└─ (unknown)
   └─ [] (no actions)
```

## Light Theme Color Mapping

```
Color         │ Status Badge                    │ Payment Badge
─────────────────────────────────────────────────────────────────
Amber (100)   │ bg-amber-100/80 text-amber-900 │ —
Yellow (100)  │ bg-yellow-100/80 text-yellow-900│ —
Emerald (100) │ bg-emerald-100/80 text-emerald-900│ —
Green (100)   │ bg-green-100/80 text-green-900 │ bg-green-100/80 text-green-900
Orange (100)  │ bg-orange-100/80 text-orange-900│ bg-orange-100/80 text-orange-900
Red (100)     │ bg-red-100/80 text-red-900     │ bg-red-100/80 text-red-900
Blue (100)    │ bg-blue-100/80 text-blue-900   │ bg-blue-100/80 text-blue-900
Slate (100)   │ bg-slate-100/80 text-slate-900 │ —
Indigo (100)  │ bg-indigo-100/80 text-indigo-900│ —
Gray (100)    │ bg-gray-100/80 text-gray-900   │ bg-gray-100/80 text-gray-900
```

## Dark Theme Color Mapping

```
Color         │ Status Badge                          │ Payment Badge
──────────────────────────────────────────────────────────────────────
Amber (950)   │ dark:bg-amber-950/50 dark:text-amber-200   │ —
Yellow (950)  │ dark:bg-yellow-950/50 dark:text-yellow-200 │ —
Emerald (950) │ dark:bg-emerald-950/50 dark:text-emerald-200│ —
Green (950)   │ dark:bg-green-950/50 dark:text-green-200 │ dark:bg-green-950/50 dark:text-green-200
Orange (950)  │ dark:bg-orange-950/50 dark:text-orange-200│ dark:bg-orange-950/50 dark:text-orange-200
Red (950)     │ dark:bg-red-950/50 dark:text-red-200   │ dark:bg-red-950/50 dark:text-red-200
Blue (950)    │ dark:bg-blue-950/50 dark:text-blue-200   │ dark:bg-blue-950/50 dark:text-blue-200
Slate (950)   │ dark:bg-slate-950/50 dark:text-slate-200│ —
Indigo (950)  │ dark:bg-indigo-950/50 dark:text-indigo-200│ —
Gray (950)    │ dark:bg-gray-950/50 dark:text-gray-200  │ dark:bg-gray-950/50 dark:text-gray-200
```

## State Transition Matrix

```
From State               │ Available Actions      │ To State
─────────────────────────┼──────────────────────┼────────────────
PAYMENT_PENDING         │ —                    │ —
PENDING_CONFIRMATION    │ Confirm              │ CONFIRMED
PENDING_CONFIRMATION    │ Cancel               │ CANCELLED
CONFIRMED              │ Cancel               │ CANCELLED
CONFIRMED+Rescheduled  │ Cancel               │ CANCELLED
RESCHEDULED            │ Approve Reschedule   │ CONFIRMED+Rescheduled
RESCHEDULED            │ Reject Reschedule    │ CANCELLED
CANCELLED              │ —                    │ —
COMPLETED              │ —                    │ —
NO_SHOW                │ —                    │ —
IN_PROGRESS            │ Mark Completed       │ COMPLETED
IN_PROGRESS            │ Mark No Show         │ NO_SHOW
```

## CSS Class Pattern

All badge CSS follows this pattern:

**Light Mode:**
```
bg-[COLOR]-100/80 text-[COLOR]-900
```
- `bg-[COLOR]-100`: Light background
- `/80`: 80% opacity for subtle effect
- `text-[COLOR]-900`: Dark text for contrast

**Dark Mode:**
```
dark:bg-[COLOR]-950/50 dark:text-[COLOR]-200
```
- `dark:bg-[COLOR]-950`: Very dark background
- `/50`: 50% opacity for subtle effect
- `dark:text-[COLOR]-200`: Light text for contrast

## Example Badge Rendering

### Light Theme - PENDING_CONFIRMATION + ONLINE + PAID
```html
<span class="px-2 py-1 rounded-lg text-xs font-medium 
  bg-yellow-100/80 text-yellow-900 
  dark:bg-yellow-950/50 dark:text-yellow-200">
  Awaiting Confirmation
</span>
<span class="px-2 py-1 rounded-lg text-xs font-medium 
  bg-green-100/80 text-green-900 
  dark:bg-green-950/50 dark:text-green-200">
  Paid
</span>
```

### Dark Theme - Same Booking
(CSS automatically applies `dark:` classes via `next-themes`)

## Button Action Rendering

```jsx
const actions = getAvailableActions(booking)

actions.includes('confirm') && (
  <button className="px-2 py-1 rounded bg-green-500 text-white text-xs">
    Confirm
  </button>
)

actions.includes('cancel') && (
  <button className="px-2 py-1 rounded bg-red-500 text-white text-xs">
    Cancel
  </button>
)

actions.includes('approve_reschedule') && (
  <button className="px-2 py-1 rounded bg-blue-500 text-white text-xs">
    Approve
  </button>
)

actions.includes('reject_reschedule') && (
  <button className="px-2 py-1 rounded bg-orange-500 text-white text-xs">
    Reject
  </button>
)

actions.includes('mark_completed') && (
  <button className="px-2 py-1 rounded bg-blue-500 text-white text-xs">
    Completed
  </button>
)

actions.includes('mark_no_show') && (
  <button className="px-2 py-1 rounded bg-slate-500 text-white text-xs">
    No Show
  </button>
)
```

## Testing Validation Points

- [ ] Status badge matches expected label for state
- [ ] Status badge color is correct in light theme
- [ ] Status badge color is correct in dark theme
- [ ] Payment badge matches expected label for payment combination
- [ ] Payment badge color is correct in light theme
- [ ] Payment badge color is correct in dark theme
- [ ] No contradictory badges shown (e.g., "Pending Confirmation" + "Paid" always valid)
- [ ] Available actions list is correct
- [ ] Action buttons only appear when in valid state
- [ ] Text contrast passes WCAG AA standards (4.5:1 ratio)
- [ ] Theme switching updates all badge colors
