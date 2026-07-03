# Discharge Summary: Dual-Mode Architecture

**Commit:** `87d08d3`

---

## Overview

The discharge summary now supports two distinct workflows:

### Mode 1: From Appointments (Existing)
- **User:** Receptionist
- **Flow:** Appointments page → Click discharge → Discharge summary auto-loads
- **URL:** `/admin/discharge-summary?booking_uuid=<uuid>`
- **Implementation:** `app/admin/discharge-summary/page.tsx` (existing)

### Mode 2: Standalone (New)
- **User:** Doctor (standalone)
- **Flow:** Go to discharge summary → Search appointment → Fill clinical details → Save
- **URL:** `/admin/discharge-summary` (no params)
- **Implementation:** `app/admin/discharge-summary/page-new.tsx` (staged, ready to replace existing)

---

## Core Design: AppointmentContext

Both modes use a unified **AppointmentContext** object:

```typescript
interface AppointmentContext {
  // Internal identifiers (never shown to user)
  bookingUuid: string;        // UUID: a76f621d-...
  patientUuid: string;        // UUID: 49e5be9d-...
  
  // User-facing identifiers
  bookingNumber: string;      // "AYB-2026-000052"
  patientId: string;          // "AYP-2026-000002"
  
  // Patient details (auto-fill)
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  
  // Appointment details
  doctorName: string;
  appointmentDate: string;    // ISO date
  appointmentTime: string;    // HH:MM
  status: string;             // CONFIRMED, CANCELLED, etc.
}
```

**Key principle:** The UUID is purely internal. The UI never shows or asks for UUIDs. Everything is human-readable.

---

## API Endpoints (New)

### 1. Search Appointments
```
GET /api/admin/appointments/search?q=<query>
```

**Search criteria:** Name, patient ID, booking #, phone, appointment date

**Response:**
```json
{
  "results": [
    {
      "bookingUuid": "a76f621d-...",
      "bookingNumber": "AYB-2026-000052",
      "patientUuid": "49e5be9d-...",
      "patientId": "AYP-2026-000002",
      "patientName": "Ali Husain",
      "patientPhone": "+91-9999...",
      "patientEmail": "ali@...",
      "doctorName": "Dr. Farha Naqvi",
      "appointmentDate": "2026-07-03",
      "appointmentTime": "14:30",
      "status": "CONFIRMED"
    }
  ]
}
```

### 2. Get Recent Appointments
```
GET /api/admin/appointments/recent
```

**Response:** Appointments grouped by timeframe
```json
{
  "today": [...],
  "yesterday": [...],
  "last7days": [...]
}
```

### 3. Check Existing Discharge Summary
```
GET /api/admin/discharge-summary/check?booking_uuid=<uuid>
```

**Response:**
```json
{
  "exists": true,
  "id": "550e8400-e29b-..."
}
```

**Purpose:** Prevent duplicate discharge summaries. If one exists, open it instead of creating a new one.

### 4. Resolve Appointment Context
```
GET /api/admin/appointments/context?booking_uuid=<uuid>
```

**Response:**
```json
{
  "context": {
    "bookingUuid": "...",
    "bookingNumber": "...",
    // ... full AppointmentContext
  }
}
```

**Purpose:** Single source of truth for resolving a booking UUID to all needed identifiers.

---

## Component: AppointmentSelector

**File:** `components/AppointmentSelector.tsx`

Provides a searchable dropdown for Mode 2 workflow.

### Features

1. **Real-time search** (debounced, 300ms)
   - Starts after 2 characters
   - Searches name, ID, booking #, phone, date

2. **Recent appointments** (when no search)
   - Today's appointments
   - Yesterday
   - Last 7 days
   - Sorted by time/date

3. **Display format**
   ```
   AYB-2026-000052 • Ali Husain
   AYP-2026-000002 • 03 Jul 2026 • Dr. Farha Naqvi
   ```

4. **Selection**
   - Click any appointment
   - Returns full `AppointmentContext` object
   - Stored value is `bookingUuid` (internal)
   - Doctor never sees the UUID

### Usage

```tsx
import { AppointmentSelector } from '@/components/AppointmentSelector'

<AppointmentSelector
  onSelect={(context) => {
    // Handle selected appointment context
    loadAppointmentDetails(context.bookingUuid)
  }}
  isLoading={loading}
/>
```

---

## Workflow: Mode 1 (From Appointments)

### Existing Flow
```
1. Click "Discharge" in Appointments
   → URL: /admin/discharge-summary?booking_uuid=a76f621d-...
   
2. Page loads booking context from UUID
   → resolveAppointmentContext(bookingUuid)
   
3. Check if discharge summary exists
   → checkExistingDischargeSummary(bookingUuid)
   
4a. If exists:
    → Load and display existing record
    
4b. If not exists:
    → Auto-fill patient details from appointment context
    → Show blank form for clinical details
    
5. Doctor fills diagnosis, treatment, etc.
   
6. Click Save
   → POST /api/admin/discharge-summary/save
   → Inserted/updated in discharge_summaries table
   
7. Click Download PDF
   → PDF generated from saved record
```

---

## Workflow: Mode 2 (Standalone)

### New Flow
```
1. Navigate to /admin/discharge-summary (no URL params)
   
2. Page detects no booking_uuid
   → Show AppointmentSelector component
   
3. Doctor searches for appointment
   → GET /api/admin/appointments/search?q=ali
   
4. Click appointment from dropdown
   → AppointmentContext object selected
   
5. Check if discharge summary exists
   → checkExistingDischargeSummary(bookingUuid)
   
6a. If exists:
    → Load and display existing record
    
6b. If not exists:
    → Auto-fill from context:
      - Patient name, ID, phone
      - Doctor name
      - Appointment date/time as admission date/time
    → Show form for clinical details
    
7. Doctor fills remaining clinical information
   
8. Click Save
   → Same save flow as Mode 1
   
9. Click Download PDF
   → Same PDF flow as Mode 1
```

---

## Key Features

### 1. Automatic Duplicate Prevention
Before showing form, check:
```sql
SELECT id FROM discharge_summaries WHERE booking_id = booking_uuid
```

If exists, open that record (not a new blank form).

**Result:** Guarantee one discharge summary per booking.

### 2. Auto-fill from Appointment Context
When new discharge summary is created:
```
form.patient_name = context.patientName
form.patient_uhid = context.patientId
form.doctor_name = context.doctorName
form.doa_date = context.appointmentDate
form.doa_time = context.appointmentTime
```

Doctor only fills clinical information (diagnosis, treatment, recommendations).

### 3. UUID is Purely Internal
- **Never shown to user**
- **Never typed by user**
- **Only used internally for DB operations**
- **UI shows:** AYB-2026-000052, AYP-2026-000002, patient name, date

### 4. Single Source of Truth
All appointment data resolved through `AppointmentContext`:
```typescript
// One function to get all identifiers
const context = await resolveAppointmentContext(bookingUuid)

// Use context everywhere
save(context.bookingUuid)
checkExists(context.bookingUuid)
loadFromDatabase(context.bookingUuid)
generatePDF(context.patientId, context.doctorName)
```

---

## Migration Path

### Phase 1: Add Without Breaking (CURRENT)
- ✅ New endpoints added
- ✅ AppointmentSelector component created
- ✅ page-new.tsx staged and tested
- ✅ Existing page.tsx still works

### Phase 2: Gradually Test (NEXT)
1. Test Mode 2 with test users
2. Verify appointment search accuracy
3. Confirm auto-fill works correctly
4. Check duplicate prevention

### Phase 3: Deploy Mode 2
1. Monitor API endpoints for errors
2. Ensure Mode 1 still works
3. Announce to doctors that Mode 2 is available

### Phase 4: Deprecate Mode 1 (Optional)
After doctors prefer Mode 2, could remove the Appointments page flow if preferred.

---

## Files Modified/Created

### New Files
```
lib/appointment-context.ts                           # Core types & API helpers
components/AppointmentSelector.tsx                   # Search component
app/admin/discharge-summary/page-new.tsx             # Refactored page (staged)
app/api/admin/appointments/search/route.ts           # Search endpoint
app/api/admin/appointments/recent/route.ts           # Recent appointments endpoint
app/api/admin/appointments/context/route.ts          # Context resolver endpoint
app/api/admin/discharge-summary/check/route.ts       # Duplicate check endpoint
```

### Existing Files (Unchanged)
```
app/admin/discharge-summary/page.tsx                 # Still works for Mode 1
app/api/admin/discharge-summary/save/route.ts        # Used by both modes
app/api/admin/discharge-summary-pdf/route.ts         # Used by both modes
```

---

## Deployment Checklist

- [ ] Endpoints tested with production data
- [ ] AppointmentSelector UI tested with real appointments
- [ ] Duplicate prevention working (no two summaries per booking)
- [ ] Auto-fill from appointment context verified
- [ ] Search works for all criteria (name, ID, phone, date)
- [ ] Recent appointments load correctly
- [ ] Mode 1 (from appointments) still works
- [ ] Mode 2 (standalone) ready for beta
- [ ] Doctors informed about new Mode 2 workflow
- [ ] Monitoring alerts set up for new endpoints

---

## Notes

**Why two modes?**
- **Mode 1 (receptionist):** Fast path from appointments list
- **Mode 2 (doctor):** Doctor-initiated workflow, can search at any time

**Why AppointmentContext?**
- Unifies identifier resolution
- Makes migration from page.tsx to page-new.tsx seamless
- Keeps UUID internal (clinician-friendly)
- Single source of truth for all appointment data

**Why duplicate prevention?**
- Database constraint: `discharge_summaries.booking_id` is unique
- Would prevent concurrent discharge summary creation
- Better UX: Edit existing, not create duplicate

**Next: Replace existing page.tsx**
When page-new.tsx is fully tested and approved, swap:
```bash
mv app/admin/discharge-summary/page.tsx page-old.tsx
mv app/admin/discharge-summary/page-new.tsx page.tsx
```
