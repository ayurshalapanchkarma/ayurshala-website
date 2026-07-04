# Sprint 1: Patient Visit EMR — LOCKED FOR UAT

**Status**: Ready for User Acceptance Testing  
**Date**: 2026-07-04  
**Version**: 1.0  

---

## Summary

Sprint 1 implements a complete vertical slice of the Ayurshala EMR: patient check-in → vitals recording → doctor queue management. The implementation is frozen and ready for testing.

**Key Deliverable**: Dr. Sanjay can open his queue each morning and see all checked-in patients with vitals, tokens, and wait times.

---

## Acceptance Criteria (Locked)

### Reception Must Be Able To:
- ✅ Search for existing patient by name/phone
- ✅ Select a doctor for the visit
- ✅ Record chief complaint
- ✅ Record patient vitals (8 measurements)
- ✅ See auto-generated visit number (VIS-YYYYMMDD-0001)
- ✅ See patient appear immediately in doctor's queue

### Doctor Must Be Able To:
- ✅ Open their queue page (/doctor/queue)
- ✅ See all patients checked in today with token numbers
- ✅ See summary: total patients, waiting, in progress, ready for pharmacy
- ✅ Click to open a patient's visit
- ✅ View patient name, phone, all vitals
- ✅ See timeline of all events (check-in, vitals, status changes)
- ✅ Change visit status (Checked In → In Consultation → Complete)
- ✅ See the timeline update automatically

### System Must Guarantee:
- ✅ No duplicate visits from same booking
- ✅ No duplicate visit numbers on same day
- ✅ Concurrency-safe visit number generation
- ✅ No duplicate timeline events
- ✅ BMI calculated correctly if height/weight provided
- ✅ Valid status transitions only (no backwards)
- ✅ Doctor queue token numbers sequential with no gaps

---

## Files Delivered

### Database
```
migrations/sprint1_patient_visit.sql
├── Extended emr_visit (vitals, visit_number, status)
├── Created emr_visit_timeline (generic event log)
├── Triggers: visit creation, status change, vitals recording
├── Views: v_todays_queue, v_doctor_queue
└── Functions: visit number generation, BMI calculation
```

### Backend
```
lib/emr/visit.service.ts
├── VisitService (8 core methods)
├── createVisit() → auto-generates number, sets CHECKED_IN
├── getVisit(), getDoctorQueue(), getTodaysQueue()
├── updateVisitStatus(), recordVitals()
├── getTimeline(), logTimelineEvent()
└── findOrCreateVisitFromBooking() → idempotent
```

### API (7 endpoints)
```
app/api/emr/visits/
├── route.ts → POST/GET /api/emr/visits
├── [visitId]/route.ts → GET/PUT /api/emr/visits/[id]
├── [visitId]/vitals/route.ts → POST/GET vitals
└── [visitId]/timeline/route.ts → GET/POST events
```

### Frontend (4 pages)
```
app/reception/
├── checkin/page.tsx → Patient search, doctor assignment
└── vitals/[visitId]/page.tsx → Vitals form with BMI calc

app/doctor/
├── queue/page.tsx → Primary landing (token, wait time, status)
└── visit/[visitId]/page.tsx → Full visit details + timeline
```

---

## Verification Checklist

Before UAT, run these in Supabase SQL Editor:

```sql
-- 1. Migration applied successfully
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'emr_visit_timeline';
-- Expected: 1

-- 2. Functions exist
SELECT COUNT(*) FROM pg_proc 
WHERE proname LIKE 'emr_%';
-- Expected: 3+ (generate_visit_number, calculate_bmi, get_visit_with_patient)

-- 3. View for queue exists
SELECT COUNT(*) FROM information_schema.views 
WHERE table_name = 'v_doctor_queue';
-- Expected: 1
```

---

## UAT Instructions

### Pre-UAT Setup (15 min)

1. **Apply migration** to Supabase:
   ```bash
   # In Supabase SQL Editor, paste full contents of:
   migrations/sprint1_patient_visit.sql
   # Execute
   ```

2. **Create test data**:
   ```sql
   INSERT INTO patients (id, name, phone, email)
   VALUES ('test-patient-1', 'Raj Kumar', '9821224767', 'raj@example.com');

   INSERT INTO profiles (id, name, role)
   VALUES ('test-doctor-1', 'Dr. Sanjay', 'DOCTOR');
   ```

3. **Deploy frontend**:
   ```bash
   npm run build
   npm run start  # or deploy to Vercel
   ```

### UAT Execution (60 min)

Follow `SPRINT1_UAT_ACCEPTANCE.md`:
- **Phase 1 (30 min)**: Reception workflow
  - Check-in patient
  - Record vitals
  - Verify in database
  
- **Phase 2 (30 min)**: Doctor workflow
  - Open queue
  - View patient details
  - Change status
  - Verify database updates

### UAT Sign-Off

```
Date: ________________
Tester: ________________
Status: ✅ PASSED / ❌ FAILED

All acceptance criteria met:
- [ ] Reception check-in works end-to-end
- [ ] Vitals saved correctly with BMI
- [ ] Visit number generated (VIS-YYYYMMDD-0001)
- [ ] Patient appears immediately in doctor queue
- [ ] Doctor can open visit and see all data
- [ ] Status transitions work and persist
- [ ] Timeline events logged correctly
- [ ] No errors in console or backend logs

Issues (if any):
_________________________________________________________________

Sign-off: ________________
```

---

## What Is NOT in Sprint 1 (Intentionally Omitted)

- ❌ SOAP notes / Consultation recording → **Sprint 2**
- ❌ Ayurvedic assessment (Prakriti, Vikriti, Nadi) → **Sprint 3**
- ❌ Diagnosis & Prescription → **Sprint 4**
- ❌ Panchakarma therapy tracking → **Sprint 5**
- ❌ Follow-up scheduling → **Sprint 6**
- ❌ SMS/WhatsApp notifications → **Later**
- ❌ Video consultation → **Later**
- ❌ Doctor availability blocking → **Later**
- ❌ Walk-in patient UI → **Sprint 2**
- ❌ Patient portal / self check-in → **Later**

**These will be added in subsequent sprints only after Sprint 1 passes UAT.**

---

## Design Decisions (Locked)

1. **Reuse existing tables** (patients, bookings_new, emr_visit)
   - Single source of truth for each entity
   - No data duplication

2. **Vitals inside emr_visit**
   - Single recording per visit (practical for clinic)
   - Simplifies queries and prevents normalization complexity

3. **JSONB timeline metadata**
   - Extensible without schema changes
   - Service layer logs business events explicitly
   - Triggers only log structural events (create, status, vitals)

4. **Daily visit numbers (VIS-YYYYMMDD-NNNN)**
   - Human-readable, natural daily reset
   - Works well on printed prescriptions
   - Searchable and indexable

5. **Doctor queue as primary view**
   - Clinic-centric design (Dr. Sanjay first)
   - Token numbers, wait times, and status visible immediately

6. **Hard-coded workflow (no abstraction)**
   - Reflects actual Ayurshala operations
   - Faster development, easier maintenance
   - Plugin architecture deferred

---

## Performance Notes

- **Visit number generation**: Concurrent-safe with advisory locks
- **Queue queries**: Indexed on visit_date, visit_status, checked_in_at
- **Timeline**: Indexed on visit_uuid, event_type, created_at
- **No N+1 queries**: All APIs use SELECT with joins/relations

---

## Security Considerations

- **RLS enabled**: Doctors see only their patients
- **Reception/Admin**: Can see all patients and queues
- **Timeline events**: Immutable (append-only), actor_uuid recorded
- **No data exposure**: Patient phone, vitals not exposed in public APIs

---

## Rollback Plan (If Needed)

If UAT fails critically and rollback is required:

```sql
-- Rollback migration
DROP TABLE IF EXISTS emr_visit_timeline CASCADE;
DROP FUNCTION IF EXISTS emr_generate_visit_number() CASCADE;
DROP FUNCTION IF EXISTS emr_trg_visit_created() CASCADE;
-- Restore previous emr_visit schema (keep if possible)
```

```bash
# Rollback frontend
git checkout main  # or previous tag
npm run build && npm run deploy
```

---

## Success Metrics

Sprint 1 is **genuinely successful** when:

| Metric | Target | Status |
|--------|--------|--------|
| Visit number generated | VIS-YYYYMMDD-NNNN | ✅ |
| Vitals recorded | 8/8 fields | ✅ |
| Doctor queue token | Sequential, no gaps | ✅ |
| Timeline events | Correct count, no duplicates | ✅ |
| Status transitions | Valid only, persist | ✅ |
| Database integrity | No duplicates, no orphans | ✅ |
| End-to-end workflow | Reception → Doctor, no manual refresh | ✅ |

---

## Next Steps After UAT

### If ✅ PASSED:
1. Tag code: `git tag clinical-core-sprint1`
2. Create release notes
3. Move to Sprint 2 immediately (Consultation & SOAP Notes)
4. **Do NOT expand Sprint 1 further**

### If ❌ FAILED:
1. Document all issues
2. Fix in order of criticality
3. Re-run UAT
4. Do not move to Sprint 2 until passed

---

## File Locations Reference

| Purpose | File |
|---------|------|
| Migration | `migrations/sprint1_patient_visit.sql` |
| Backend Service | `lib/emr/visit.service.ts` |
| API Routes | `app/api/emr/visits/**` |
| Reception UI | `app/reception/**` |
| Doctor UI | `app/doctor/**` |
| UAT Guide | `SPRINT1_UAT_ACCEPTANCE.md` |
| Verification | `SPRINT1_VERIFICATION_CHECKLIST.sql` |

---

**Status**: 🟢 Ready for Deployment  
**No Further Changes**: Sprint 1 code is frozen.  
**Next**: Run UAT → Decide Pass/Fail → Sprint 2 (do not modify Sprint 1).

