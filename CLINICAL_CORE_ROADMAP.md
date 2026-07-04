# CLINICAL CORE — AYURSHALA ERP NEXT MODULE
## Single Clinic. Single Admin. Fully Integrated.

**Architecture:** Ayurvedic ERP for single clinic  
**Admin:** Dr. Sanjay (owner)  
**Focus:** Complete patient journey + clinic operations  

---

## AYURSHALA ERP ROADMAP

| Module | Status | Purpose |
|--------|--------|---------|
| Inventory | ✅ Complete | Stock management |
| Pharmacy POS | ✅ Complete | Point of sale |
| Clinic Billing | ✅ Complete | Invoicing & ledger |
| **Clinical Core** | 🚀 **NEXT** | **Patient EMR + Panchakarma** |
| Analytics & Reports | ⏳ Later | Insights & trends |
| Administration | ⏳ Later | Settings & operations |
| Optimization & Mobile | ⏳ Later | Performance & apps |

---

## CLINICAL CORE: COMPLETE PATIENT JOURNEY

```
Appointment (Phase 3)
    ↓
Check-in ✓
    ↓
Vitals ✓
    ↓
Ayurvedic Assessment ✓
    ↓
Consultation ✓
    ↓
Diagnosis ✓
    ↓
Prescription ✓ → Pharmacy (auto-bill)
    ↓              → Inventory (auto-deduct)
    ↓              → Patient Invoice (auto-create)
    ↓
Panchakarma Plan (if applicable)
    ↓
Therapy Sessions (daily tracking)
    ↓
Follow-up
    ↓
→ Next Appointment
```

**Every step is one patient record. No duplicate entry.**

---

## DATABASE: 12 CORE TABLES

```sql
-- Core clinical workflow
emr_visits
emr_vitals
emr_clinical_notes
emr_assessments
emr_diagnoses
emr_prescriptions
emr_prescription_items

-- Panchakarma management
emr_treatment_plans
emr_therapy_sessions

-- Follow-up & continuity
emr_followups

-- Documentation & flags
emr_documents
emr_patient_flags
```

---

## FRONTEND: 15 PAGES

### Clinical Workspace (Dr. Sanjay's Daily Interface)

1. **Clinical Dashboard** — Today's operations
   - OPD queue (waiting patients)
   - Consultations completed
   - Panchakarma sessions scheduled/completed
   - Pending follow-ups
   - Today's revenue
   - Auto-refresh (30 seconds)

2. **Patient Timeline** — Complete patient history
   - All visits (chronological)
   - All consultations
   - All prescriptions
   - All therapies
   - All follow-ups
   - All attachments

3. **New Consultation** — Start a visit
   - Patient search
   - Chief complaint
   - Vitals entry
   - Save consultation

4. **Consultation History** — Previous visits
   - List of all visits
   - View/edit consultation details
   - View SOAP notes
   - View previous diagnosis

5. **Vitals** — Vital signs tracking
   - Temperature
   - Heart rate
   - Blood pressure
   - Respiratory rate
   - Weight
   - Height
   - BMI (auto-calculated)
   - Trend visualization

6. **Ayurvedic Assessment** — Core Ayurvedic evaluation
   - Prakriti (constitution) scoring
   - Vikriti (imbalance) scoring
   - Nadi Pariksha (pulse findings)
   - Dashavidha Pariksha (10-fold examination)
   - Ashtavidha Pariksha (8-fold examination)
   - Auto-calculation of Dosha dominance
   - Assessment summary

7. **Diagnosis** — Clinical diagnosis
   - Ayurvedic diagnosis
   - Modern diagnosis (optional)
   - Severity level
   - Treatment goals
   - Contraindications
   - Recommended plan

8. **Prescription** — Digital prescription writing
   - Search & add medicines
   - Set dosage, frequency
   - Add therapies
   - Add diet recommendations
   - Add lifestyle advice
   - View preview
   - Print / Email / Send to pharmacy

9. **Panchakarma Planner** — Create treatment plan
   - Select therapy type
   - Set therapy sequence
   - Set plan duration
   - Assign therapist(s)
   - Allocate room(s)
   - Schedule sessions
   - Track progress

10. **Therapy Calendar** — Weekly therapy schedule
    - View all therapies (week view)
    - Therapist assignments
    - Room allocations
    - Session times
    - Patient names
    - Session status
    - Reschedule interface
    - Mark complete

11. **Therapy Session** — Record session details
    - Session date & time
    - Therapist performing
    - Therapy type
    - Oils/medicines used
    - Duration
    - Patient observations
    - Therapist notes
    - Mark complete

12. **Follow-ups** — Manage continuity
    - Upcoming follow-ups
    - Overdue follow-ups
    - Reason for follow-up
    - Doctor notes
    - Mark completed
    - Reschedule
    - Link to appointment

13. **Clinical Reports** — Analytics & insights
    - Disease trends
    - Panchakarma statistics
    - Medicine consumption
    - Therapist performance
    - Doctor productivity
    - Revenue dashboards
    - Patient retention

14. **EMR Documents** — Patient attachments
    - Upload PDFs, images
    - Organize by type
    - View/download
    - Search
    - Filter

15. **Doctor Dashboard** — Personal metrics
    - My consultations (today, this week, this month)
    - My patient load
    - My revenue
    - My pending follow-ups
    - My completed treatments

---

## AYURVEDIC FEATURES: DIFFERENTIATORS

### Assessment Framework

**Prakriti Assessment**
- Constitutional body type (Vata, Pitta, Kapha, Vata-Pitta, Pitta-Kapha, Vata-Kapha, Tridosha)
- Scored 0-100 per Dosha
- Determines basic nature
- Helps predict disease predispositions

**Vikriti Assessment**
- Current Dosha imbalance
- Scored 0-100 per Dosha
- Shows what's out of balance NOW
- Guides treatment

**Nadi Pariksha (Pulse Assessment)**
- Vata pulse (frog jumping)
- Pitta pulse (swan flying)
- Kapha pulse (peacock walking)
- Intensity, rate, quality
- Digital recording

**Dashavidha Pariksha (10-fold examination)**
1. Prakrithi — Constitution type
2. Vikrithi — Current imbalance
3. Sara — Tissue quality
4. Samhanana — Body coherence
5. Pramana — Body measurements
6. Satmya — Habituation to foods
7. Satva — Mental strength
8. Ahara Shakti — Appetite
9. Vyayama Shakti — Exercise capacity
10. Roga Bala — Disease resistance

**Ashtavidha Pariksha (8-fold examination)**
1. **Nadi** — Pulse
2. **Jihva** — Tongue (color, coating)
3. **Mala** — Stool (consistency, color)
4. **Mutra** — Urine (color, smell)
5. **Agni** — Digestion (strength, appetite)
6. **Nidra** — Sleep (quality, duration)
7. **Manas** — Mind (mental state, emotions)
8. **Kaya** — Physical condition

**Additional Assessments**
- Agni (digestive fire) — Strong, medium, weak, variable
- Kostha (body constitution) — Krura, Madhya, Mrudu
- Ojas (vital essence) — Present, depleted
- Satva (mental constitution) — Sattvic, Rajasic, Tamasic

---

## PANCHAKARMA TRACKING: 15 THERAPIES

### Supported Therapies

1. **Abhyanga** — Oil massage (full body)
2. **Shirodhara** — Oil on forehead
3. **Pizhichil** — Oil pouring over body
4. **Njavarakizhi** — Rice massage
5. **Vamana** — Therapeutic emesis
6. **Virechana** — Therapeutic purgation
7. **Basti** — Enema therapy
8. **Nasya** — Nasal medication
9. **Raktamokshana** — Blood letting/cupping
10. **Udwartana** — Powder massage
11. **Kati Basti** — Lower back oil pool
12. **Janu Basti** — Knee oil pool
13. **Greeva Basti** — Neck oil pool
14. **Netra Tarpana** — Eye oil pool
15. **Karna Purana** — Ear oil therapy

### Per Session: Record

- **Therapist** — Who performed
- **Date & Time** — When scheduled
- **Room** — Which room assigned
- **Oils/Medicines Used** — Link to inventory
- **Quantity** — How much used
- **Duration** — Minutes
- **Observations** — Clinical findings
- **Patient Response** — How patient felt
- **Completion Status** — Done, cancelled, rescheduled
- **Notes** — Therapist comments

### Treatment Plan Features

- Multi-phase plans (e.g., 7-day, 14-day, 21-day Panchakarma)
- Daily therapy sequence
- Therapist assignment
- Room allocation
- Progress tracking
- Completion certificates
- Outcome assessment

---

## INTEGRATION: ZERO DUPLICATE ENTRY

### Prescription → Pharmacy → Inventory

```
Doctor writes prescription
    ↓
Check medicine available?
    ↓
Reserve from inventory
    ↓
Pharmacist notified
    ↓
Dispense medicine
    ↓
Auto-create pharmacy bill
    ↓
Auto-deduct inventory (FIFO)
    ↓
Auto-add to patient ledger
```

**Result:** Medicine prescribed, dispensed, and billed in one workflow.

### Consultation → Billing

```
Visit completed
    ↓
Consultation charge auto-added to invoice
    ↓
Patient ledger updated
    ↓
Invoice finalized
```

### Therapy → Billing

```
Therapy session completed
    ↓
Therapy charge auto-added to invoice
    ↓
Oils/medicines auto-deducted from inventory
    ↓
Patient ledger updated
```

### Follow-up → Appointment

```
Follow-up scheduled
    ↓
Auto-creates appointment in Phase 3
    ↓
Patient receives appointment confirmation
    ↓
Doctor sees appointment in OPD queue
```

---

## IMPLEMENTATION: 6 WEEKS

### Week 1: Core Backend Services (50 hours)

**Day 1-2: EMR & Vital Signs**
- `VisitService` — Create, get, update, list visits
- `VitalsService` — Record, get trends, calculate BMI

**Day 3-4: Assessment Services**
- `AyurvedicAssessmentService` — Prakriti/Vikriti scoring, auto-calculation
- `NadiService` — Nadi Pariksha recording
- `ParikshService` — Dashavidha/Ashtavidha tracking

**Day 5-6: Clinical Notes**
- `ConsultationService` — SOAP notes, clinical findings
- `DiagnosisService` — Diagnosis creation, recommendation

**Day 7-8: Prescription Engine**
- `PrescriptionService` — Create, add items, PDF generation
- `PrescriptionIntegrationService` — Link to pharmacy

**Day 9-10: Panchakarma Services**
- `TreatmentPlanService` — Create, update, track plans
- `TherapySessionService` — Schedule, record, complete sessions

**Day 11-12: Follow-ups & Dashboard**
- `FollowUpService` — Schedule, track, complete
- `ClinicalDashboardService` — Real-time metrics

### Week 2: API Endpoints (40 hours)

**All CRUD endpoints + integration endpoints**

- `GET/POST /api/clinic/visits`
- `GET/POST /api/clinic/vitals`
- `GET/POST /api/clinic/assessments`
- `GET/POST /api/clinic/diagnoses`
- `GET/POST /api/clinic/prescriptions`
- `POST /api/clinic/prescriptions/[id]/send-pharmacy`
- `GET/POST /api/clinic/treatment-plans`
- `GET/POST /api/clinic/therapy-sessions`
- `GET/POST /api/clinic/follow-ups`
- `GET /api/clinic/dashboard`
- Plus: Patient timeline, reports, documents

### Week 3: Frontend - Core Pages (45 hours)

- Clinical Dashboard
- Patient Timeline
- New Consultation
- Vitals Recording
- Ayurvedic Assessment

### Week 4: Frontend - Advanced Pages (35 hours)

- Diagnosis Form
- Prescription Writing
- Panchakarma Planner
- Therapy Calendar
- Therapy Session Recording

### Week 5: Frontend - Management Pages (30 hours)

- Follow-up Management
- Consultation History
- Clinical Reports
- EMR Documents
- Doctor Dashboard

### Week 6: Integration & Testing (30 hours)

- End-to-end patient journey
- Pharmacy integration verification
- Billing integration verification
- Appointment integration verification
- Full RBAC testing
- Dark mode on all pages
- Responsive design verification
- Build verification

**Total: ~240 hours (6 weeks, ~40 hours/week)**

---

## SUCCESS CRITERIA: CLINICAL CORE COMPLETE

When done, you'll have:

✅ **Complete EMR** — Patient history, previous visits, allergies  
✅ **Digital Consultations** — SOAP notes, clinical findings  
✅ **Ayurvedic Assessment** — Prakriti, Vikriti, Nadi, Pariksha  
✅ **Diagnosis Management** — Ayurvedic + modern diagnosis  
✅ **Digital Prescriptions** — Auto-linked to pharmacy  
✅ **Panchakarma Tracking** — 15 therapies, daily sessions  
✅ **Integrated Billing** — Consultation → Pharmacy → Bill  
✅ **Follow-up Management** — Auto-linked to appointments  
✅ **Real-time Dashboards** — Today's operations visible  
✅ **Clinical Reports** — Analytics & insights  
✅ **Complete Integration** — Zero duplicate data entry  

---

## AFTER CLINICAL CORE: REMAINING MODULES

### Analytics & Reports (~3 weeks)
- Disease trends & patterns
- Panchakarma statistics
- Medicine consumption trends
- Revenue dashboards
- Doctor productivity metrics
- Patient retention analysis

### Administration (~2 weeks)
- Clinic settings & configuration
- Backup & restore
- Audit logs
- Printer configuration
- Notification templates
- Staff management

### Optimization & Mobile (~2 weeks)
- Performance improvements
- Offline support (optional)
- Mobile-friendly enhancements
- Automated backups
- Import/export tools

---

## WHY THIS WORKS FOR AYURSHALA

✅ **Single clinic focused** — No enterprise complexity  
✅ **Ayurveda-first** — Prakriti, Vikriti, Panchakarma core  
✅ **Fully integrated** — One patient record, no duplicate entry  
✅ **Dr. Sanjay's workflow** — Built for actual daily use  
✅ **Incremental delivery** — Start using after Week 3  
✅ **Real-time visibility** — Dashboards show what's happening now  

---

## NEXT STEP

**Start Clinical Core immediately.**

This is the high-value module. Everything else follows.

**Status: ✅ Ready to implement**
