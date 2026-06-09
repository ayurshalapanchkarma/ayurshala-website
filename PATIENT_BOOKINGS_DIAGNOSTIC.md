# PATIENT BOOKINGS - COMPREHENSIVE DIAGNOSTIC

## VERIFIED DATABASE FACTS

```
Logged-in User: official.alihusain@gmail.com

Auth User ID:
  8b8cabc9-a6b7-475a-b085-527c5eb1e3f8

Patient Record:
  id: 10b6d8c6-80dc-4ef2-b0f0-73e94530577b
  google_user_id: 8b8cabc9-a6b7-475a-b085-527c5eb1e3f8

Bookings in bookings_new:
  COUNT: 10 records
  patient_uuid: 10b6d8c6-80dc-4ef2-b0f0-73e94530577b
```

---

## COMPLETE PATIENT BOOKINGS PAGE

### File: `app/patient/bookings/page.tsx`

```typescript
'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default function PatientBookings() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return

    async function fetchBookings() {
      console.log('=== BOOKING FETCH START ===')
      console.log('Auth user:', user)
      console.log('Auth user id:', user?.id)

      // Get patient record using google_user_id
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('google_user_id', user.id)
        .single()

      console.log('Patient lookup result:', patient)
      console.log('Patient lookup error:', patientError)
      console.log('Patient UUID used:', patient?.id)

      if (!patient) {
        console.log('Patient not found - stopping')
        setBookingsLoading(false)
        return
      }

      // Query bookings using patients.id
      const { data, error: bookingsError } = await supabase
        .from('bookings_new')
        .select('*')
        .eq('patient_uuid', patient.id)
        .order('created_at', { ascending: false })

      console.log('Bookings query error:', bookingsError)
      console.log('Bookings returned:', data)
      console.log('Bookings count:', data?.length)
      console.log('First booking sample:', data?.[0])
      console.log('=== BOOKING FETCH END ===')

      setBookings(data || [])
      setBookingsLoading(false)
    }

    fetchBookings()
  }, [user])

  if (loading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  console.log('RENDER STATE - bookings array:', bookings)
  console.log('RENDER STATE - bookings.length:', bookings.length)
  console.log('RENDER STATE - bookingsLoading:', bookingsLoading)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/patient/dashboard" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <h1 className="text-3xl font-serif text-orange-600 mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-stone-600 mb-6">No bookings yet</p>
            <Link
              href="/book-appointment"
              className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow p-6 border border-stone-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Booking ID</p>
                    <p className="font-mono text-sm font-semibold text-orange-600">{booking.booking_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Date & Time</p>
                    <p className="text-sm font-medium text-stone-900">{booking.preferred_date} at {booking.preferred_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Status</p>
                    <p className={`text-sm font-medium ${
                      booking.status === 'CONFIRMED' ? 'text-green-600' :
                      booking.status === 'PENDING_CONFIRMATION' ? 'text-amber-600' :
                      booking.status === 'CANCELLED' ? 'text-red-600' :
                      'text-stone-600'
                    }`}>
                      {booking.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Payment</p>
                    <p className={`text-sm font-medium ${
                      booking.payment_status === 'PAID' ? 'text-green-600' :
                      booking.payment_status === 'PENDING' ? 'text-amber-600' :
                      'text-stone-600'
                    }`}>
                      {booking.payment_method} - {booking.payment_status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## EXACT QUERY USED

### Step 1: Patient Lookup
```typescript
const { data: patient, error: patientError } = await supabase
  .from('patients')
  .select('id')
  .eq('google_user_id', user.id)
  .single()
```

**Expected Result:**
```
{
  id: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b"
}
```

### Step 2: Bookings Query
```typescript
const { data, error: bookingsError } = await supabase
  .from('bookings_new')
  .select('*')
  .eq('patient_uuid', patient.id)
  .order('created_at', { ascending: false })
```

**Expected Result:**
```
[
  { id: ..., patient_uuid: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b", booking_id: "...", status: "CONFIRMED", ... },
  { id: ..., patient_uuid: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b", booking_id: "...", status: "PENDING_CONFIRMATION", ... },
  ... (10 total)
]
```

---

## TABLE VERIFICATION

| Table | Query | Status |
|-------|-------|--------|
| bookings_new | ✅ Used | Correct |
| bookings | ✅ Not used | Legacy |
| bookings_v2 | ✅ Not used | Legacy |

**Confirmation:** Only `.from('bookings_new')` used in query

---

## RENDER LOGIC VERIFICATION

### No Filtering Applied
The render logic does NOT filter bookings by:
- ✅ `status` - Displays all statuses (CONFIRMED, PENDING_CONFIRMATION, CANCELLED)
- ✅ `payment_status` - Displays all payment statuses
- ✅ `is_deleted` - Query doesn't filter, shows all
- ✅ `preferred_date` - No date filtering in render

### Render Condition
```typescript
{bookings.length === 0 ? (
  <div>No bookings yet</div>
) : (
  <div>
    {bookings.map((booking) => (
      // Render each booking without filtering
    ))}
  </div>
)}
```

**Status:** No filtering logic that would hide bookings ✅

---

## STATE UPDATE VERIFICATION

### State Management
```typescript
const [bookings, setBookings] = useState<any[]>([])

// Set after query
setBookings(data || [])
setBookingsLoading(false)
```

**Verification:** 
- ✅ Initial state: empty array `[]`
- ✅ After query: `setBookings(data || [])` - will be 10 items
- ✅ State persists until next query

---

## EXPECTED CONSOLE OUTPUT

### Session 1: User Logs In

```javascript
// Fetch start
=== BOOKING FETCH START ===
Auth user: { id: "8b8cabc9-a6b7-475a-b085-527c5eb1e3f8", email: "official.alihusain@gmail.com", ... }
Auth user id: "8b8cabc9-a6b7-475a-b085-527c5eb1e3f8"

// Patient lookup
Patient lookup result: { id: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b" }
Patient lookup error: null
Patient UUID used: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b"

// Bookings query
Bookings query error: null
Bookings returned: [
  { id: 1, booking_id: "BK001", patient_uuid: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b", status: "CONFIRMED", ... },
  { id: 2, booking_id: "BK002", patient_uuid: "10b6d8c6-80dc-4ef2-b0f0-73e94530577b", status: "PENDING_CONFIRMATION", ... },
  ... (8 more)
]
Bookings count: 10
First booking sample: { id: 1, booking_id: "BK001", ... }
=== BOOKING FETCH END ===

// Render state
RENDER STATE - bookings array: [10 items]
RENDER STATE - bookings.length: 10
RENDER STATE - bookingsLoading: false
```

---

## DIAGNOSTIC CHECKLIST

After deploying and logging in, verify:

- [ ] `Auth user id` shows correct OAuth UUID
- [ ] `Patient UUID used` shows `10b6d8c6-80dc-4ef2-b0f0-73e94530577b`
- [ ] `Bookings query error` is `null` (no error)
- [ ] `Bookings count` is `10`
- [ ] `RENDER STATE - bookings.length` is `10`
- [ ] Page displays 10 booking cards (not "No bookings yet")

### If Bookings Count is 0
1. Check `Patient lookup error` - if error, patient record not found
2. Check `Patient UUID used` - verify it matches database
3. Check bookings_new table - verify records exist with that patient_uuid

### If Bookings Count is null/undefined
1. Check `Bookings query error` - will show Supabase error
2. Check network tab - may be RLS policy issue
3. Check patient permissions - may need RLS policy update

---

## BUILD STATUS

✅ **Build succeeds without errors**

```
✓ Compiled successfully in 3.0s
✓ Running TypeScript: PASSED
✓ Generating static pages: 33/33

Routes Generated:
├ ○ /patient/bookings          ← Updated with diagnostics
├ ○ /patient/dashboard
├ ○ /admin/login
└ ... (30 more)
```

---

## DEPLOYMENT INSTRUCTIONS

1. Deploy latest code to production
2. Patient logs in at https://ayurshalapanchakarma.com/patient/bookings
3. Open browser console (F12 → Console tab)
4. Look for log lines starting with `=== BOOKING FETCH START ===`
5. Check values against expected output above
6. Report which step fails (if any)

---

## TECHNICAL SUMMARY

**Query Structure:** ✅ Correct
**Table Selection:** ✅ bookings_new only
**State Management:** ✅ Proper updates
**Render Logic:** ✅ No filtering

**Next Action:** Deploy and check console logs to identify exactly where data is lost

