# Identifier Flow Audit - CRITICAL BUGS FOUND

**Date:** 2026-07-04  
**Status:** ❌ BROKEN - UUID passing incorrectly in multiple places

---

## The Issue

The application has two identifier types:

1. **`bookings_new.id`** — Numeric row ID (e.g., `54`)
2. **`bookings_new.booking_id`** — UUID from system (e.g., `550e8400-e29b-41d4-a716-446655440000`)

The `discharge_summaries.booking_id` column is type `UUID` and references `bookings_new.id` (UUID), NOT the numeric row ID.

**Current bug:** Multiple places pass numeric `id` (54) instead of UUID `booking_id`.

---

## Flow Trace: Where It Breaks

### 1. Appointments Page (`/app/admin/appointments/page.tsx`)

**Line 339 — ❌ WRONG:**
```typescript
if (selectedRow) router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.id}`)
```

**Should be:**
```typescript
if (selectedRow) router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.booking_id}`)
```

**Data:**
- `selectedRow.id` = `54` (numeric)
- `selectedRow.booking_id` = `550e8400-e29b-41d4-a716-446655440000` (UUID) ← **Use this**

---

### 2. Discharge Summary Editor (`/app/admin/discharge-summary/page.tsx`)

**Line 68 — ✅ Correct (reads from URL):**
```typescript
const bookingUuid = params.get('booking_uuid')
```

**Expected value:** UUID from the wrong appointments.page.tsx  
**Actual value received:** `54` (numeric ID)

**Result:** Later API calls fail with "invalid input syntax for type uuid"

---

### 3. Discharge Summary Page (`/app/admin/discharge-summaries/page.tsx`)

**Line 371 — ✅ Correct:**
```typescript
onClick={() => router.push(`/admin/discharge-summary?booking_uuid=${encodeURIComponent(row.booking_uuid)}`)}
```

Uses `row.booking_uuid` ✓ (correct)

---

### 4. API: `/api/admin/discharge-summary`

**Receives:** `?booking_uuid=54` (wrong)  
**Expected:** `?booking_uuid=550e8400-e29b-41d4-a716-446655440000` (UUID)

**Fails with:** `invalid input syntax for type uuid: "54"`

---

### 5. PDF Preview (`/app/admin/pdf-preview/page.tsx`)

**Line 155-157:**
```typescript
const uuid = params.get('booking_uuid')
if (uuid) {
  loadRealData(uuid)
}
```

**Receives:** `54` (wrong)  
**API fails:** Same UUID type error

---

## Root Cause

**`/app/admin/appointments/page.tsx` line 339**

**Database schema has THREE identifier columns in bookings_new:**

| Column | Value | Type | Use For |
|--------|-------|------|---------|
| `id` | `6` | numeric | Database row ID (internal only) |
| `booking_id` | `AYB-2026-000005` | string | Human-readable reference |
| `booking_uuid` | `a76f621d-4639-4c1c-a705-ec1b4cc51f44` | string (UUID) | Foreign key to discharge_summaries.booking_id |

**The code was passing wrong value:**
```typescript
// WRONG ❌ (passes numeric ID)
router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.id}`)

// STILL WRONG ❌ (passes human-readable, not UUID)
router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.booking_id}`)

// CORRECT ✅ (passes actual UUID)
router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.booking_uuid}`)
```

The issue: `discharge_summaries.booking_id` column is PostgreSQL UUID type and expects the actual UUID value from `bookings_new.booking_uuid`, not the numeric `.id` or human-readable `.booking_id`.

---

## All Affected Locations

| File | Line | Current | Correct | Status |
|------|------|---------|---------|--------|
| appointments/page.tsx | 339 | `selectedRow.id` | `selectedRow.booking_uuid` | ❌ WRONG |
| appointments/page.tsx | Type Booking | Missing | Add `booking_uuid: string` | ❌ MISSING |

---

## The Fix

**Only one location needs fixing:**

`/app/admin/appointments/page.tsx` line 339:

**Change from:**
```typescript
if (selectedRow) router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.id}`)
```

**Change to:**
```typescript
if (selectedRow) router.push(`/admin/discharge-summary?booking_uuid=${selectedRow.booking_id}`)
```

---

## Verification After Fix

Test this flow:

1. Go to `/admin/appointments`
2. Select a booking
3. Click "Discharge Summary" action
4. Should navigate to: `/admin/discharge-summary?booking_uuid=550e8400-...` (UUID)
5. Page should load data correctly
6. Save should work
7. Preview should show fresh data

---

## Why This Happened

The `Booking` type in appointments/page.tsx has both fields:
```typescript
type Booking = {
  id: number              // Numeric row ID ← Wrong for UUID column
  booking_id: string      // UUID ← Correct for UUID column
  ...
}
```

The comment says "pass UUID" but the code passes `.id` instead.

---

## Impact

**Until this is fixed:**
- ❌ Cannot navigate to discharge summary from appointments
- ❌ Cannot preview discharge summary
- ❌ Cannot save (if you manually navigate)
- ❌ Cannot generate PDF
- ❌ Cannot use any feature requiring discharge summary

**All depend on this single identifier being correct.**
