# AYURSHALA ERP — FUNCTIONAL MODULES ROADMAP
## Not "10 phases" but integrated clinical modules for a single clinic

**Architecture:** Single-clinic Ayurvedic ERP for Ayurshala  
**Admin:** Dr. Sanjay (single owner)  
**Focus:** Daily clinical operations + business management  

---

## COMPLETED MODULES ✅

### Module 1: Inventory Management
- Products, suppliers, manufacturers, units, categories
- Purchase orders, GRN, batch management
- FIFO stock tracking, adjustments
- Stock dashboards & reports
- Status: **100% Complete**

### Module 2: Pharmacy POS
- Barcode scanning
- FIFO-based bill creation
- Multi-format invoicing (PDF, thermal, QR)
- Returns management
- 10+ pharmacy-specific reports
- Status: **100% Complete**

### Module 3: Clinic Billing
- Multi-type invoicing (consultation, therapy, medicine, etc.)
- Patient ledger with running balance
- Payment recording (6 payment modes)
- Refund management
- Daily closing with reconciliation
- Status: **100% Complete**

---

## IN DEVELOPMENT 🚀

### Module 4: Clinical Core (Largest & Most Important)
**This is where your doctors and therapists work every day.**

The complete patient clinical journey:
```
Appointment → Check-in → Vitals → Assessment → 
Consultation → Diagnosis → Prescription → Pharmacy → 
Treatment Plan → Therapy Sessions → Follow-up
```

---

## MODULE 4 BREAKDOWN (10 Sub-modules)

### 4.1: Electronic Medical Record (EMR)
**Patient's complete medical history**

Database tables:
- `emr_patients` — Core patient EMR
- `emr_allergies` — Allergy tracking
- `emr_documents` — Medical documents

Features:
- ✅ Patient overview card
- ✅ Complete visit history (timeline)
- ✅ Allergies & contraindications display
- ✅ Previous diagnoses
- ✅ Medical documents (PDFs, images)
- ✅ Export EMR as PDF

### 4.2: Consultation Management
**Doctor-patient interaction**

Database tables:
- `emr_visits` — Visit records
- `emr_consultation_notes` — SOAP notes
- `emr_vitals` — Vital signs

Features:
- ✅ Start new consultation
- ✅ Record chief complaint
- ✅ Vitals entry (temp, HR, BP, RR, weight, height)
- ✅ SOAP notes (Subjective, Objective, Assessment, Plan)
- ✅ Clinical findings & examination
- ✅ Follow-up advice
- ✅ Link to appointment

### 4.3: Ayurvedic Assessment
**Ayurshala-specific — not generic**

Database table:
- `emr_ayurvedic_assessment`

Assessment types:
- **Prakriti** — Constitutional type (Vata, Pitta, Kapha, dual, tridosha)
- **Vikriti** — Current imbalance (Dosha scoring)
- **Nadi Pariksha** — Pulse examination (quality, rate, findings)
- **Dashavidha Pariksha** — 10-fold examination:
  - Prakrithi (constitution)
  - Vikrithi (current state)
  - Sara (tissue quality)
  - Samhanana (body coherence)
  - Pramana (body measurements)
  - Satmya (habituation)
  - Satva (mental strength)
  - Ahara (appetite)
  - Vyayama Shakti (exercise capacity)
  - Roga Bala (disease resistance)
- **Ashtavidha Pariksha** — 8-fold examination:
  - Nadi (pulse)
  - Jihva (tongue)
  - Mala (stool)
  - Mutra (urine)
  - Agni (digestion)
  - Nidra (sleep)
  - Manas (mind)
  - Kaya (physical condition)

Features:
- ✅ Scoring interface (sliders/forms)
- ✅ Auto-calculation of Dosha balance
- ✅ Assessment summary generation
- ✅ Digital recording of findings
- ✅ Export assessment report

### 4.4: Diagnosis Management
**Ayurvedic + modern diagnosis**

Database table:
- `emr_diagnosis`

Features:
- ✅ Ayurvedic diagnosis (e.g., "Vata-Pitta imbalance with weak Agni")
- ✅ Modern diagnosis (optional ICD code)
- ✅ Severity level (mild, moderate, severe)
- ✅ Dosha involvement tracking
- ✅ Treatment goals
- ✅ Contraindications
- ✅ Recommended treatment plan

### 4.5: Digital Prescription Engine
**Integrated with Pharmacy (Phase 2)**

Database tables:
- `emr_prescriptions`
- `emr_prescription_items`

Features:
- ✅ Create digital prescription
- ✅ Add medicines (search from inventory)
- ✅ Set dosage, frequency, before/after food
- ✅ Add therapies
- ✅ Add diet recommendations
- ✅ Add lifestyle advice
- ✅ Special instructions
- ✅ Generate PDF prescription
- ✅ Print for patient
- ✅ Email prescription
- ✅ **Send to pharmacy** (auto-creates bill)

Integration with Pharmacy:
```
Doctor writes prescription
    ↓
Check medicine available?
    ↓
Reserve batch
    ↓
Pharmacist receives notification
    ↓
Dispense medicine
    ↓
Create pharmacy bill
    ↓
Deduct inventory (FIFO)
    ↓
Link to patient invoice
```

### 4.6: Panchakarma Module
**Ayurshala's core service — fully digital**

Database tables:
- `emr_treatment_plans`
- `emr_therapy_sessions`
- `therapy_room_assignments`
- `therapist_assignments`

Supported therapies:
- Abhyanga (oil massage)
- Shirodhara (oil on forehead)
- Pizhichil (oil pouring)
- Njavarakizhi (rice massage)
- Vamana (emesis)
- Virechana (purgation)
- Basti (enema)
- Nasya (nasal medication)
- Raktamokshana (bloodletting)
- Udwartana (powder massage)
- Kati Basti (lower back oil pool)
- Janu Basti (knee oil pool)
- Greeva Basti (neck oil pool)
- Netra Tarpana (eye oil pool)
- Karna Purana (ear oil)

Features per therapy:
- ✅ Therapist assigned
- ✅ Treatment room assigned
- ✅ Oil/medicine used
- ✅ Quantity tracked
- ✅ Duration recorded
- ✅ Patient observations
- ✅ Session outcome
- ✅ Next session scheduled
- ✅ Auto-deduct inventory

Treatment plan features:
- ✅ Multi-phase plans (e.g., 7-day, 14-day, 21-day Panchakarma)
- ✅ Daily therapy sequence
- ✅ Progress tracking
- ✅ Completion certificates
- ✅ Outcome assessment

### 4.7: Therapy Calendar
**Daily scheduling & management**

Features:
- ✅ Weekly calendar view
- ✅ Therapist daily assignments
- ✅ Room allocations
- ✅ Session times
- ✅ Patient names
- ✅ Session status (scheduled, completed, missed)
- ✅ Reschedule interface
- ✅ Mark session complete
- ✅ Cancel session
- ✅ Therapist availability view

### 4.8: Follow-up Management
**Track patient progress & ensure continuity**

Database table:
- `emr_followups`

Features:
- ✅ Schedule follow-up visits
- ✅ Follow-up reason (review, progress check, reassessment)
- ✅ Set follow-up date & time
- ✅ Link to appointment system
- ✅ Doctor notes for follow-up
- ✅ Track follow-up completion
- ✅ Mark as completed
- ✅ Reschedule if missed
- ✅ Send reminders (future: WhatsApp/SMS)
- ✅ Recovery tracking
- ✅ Long-term treatment plan notes

### 4.9: Clinical Dashboard
**Real-time clinic metrics**

Displays:
- ✅ Today's OPD queue (waiting patients)
- ✅ Consultations completed today
- ✅ Panchakarma therapies scheduled
- ✅ Panchakarma therapies completed today
- ✅ Pending follow-ups
- ✅ Today's revenue
- ✅ Medicines dispensed (count, value)
- ✅ Therapy sessions progress
- ✅ Active treatment plans

Updates: Real-time (auto-refresh every 30 seconds)

### 4.10: Clinical Reports
**Analytics & insights**

Report types:
- ✅ **Disease Trends** — Common diagnoses, seasonal patterns
- ✅ **Therapy Utilization** — Which therapies most used, effectiveness
- ✅ **Doctor Workload** — Consultations per doctor, revenue per doctor
- ✅ **Panchakarma Statistics** — Total sessions, completion rates, therapist performance
- ✅ **Medicine Usage** — Top medicines prescribed, consumption rate
- ✅ **Patient Retention** — New vs returning patients, follow-up compliance
- ✅ **Follow-up Compliance** — Completion rate, drop-off analysis
- ✅ **Treatment Outcomes** — Before/after assessment comparison

Features:
- ✅ Date range filtering
- ✅ Doctor/therapist filtering
- ✅ Export to CSV, PDF
- ✅ Print reports
- ✅ Graphical charts & trends

---

## MODULE 4 DATABASE SUMMARY

**12 Core Tables:**
1. `emr_patients` — Patient EMR
2. `emr_visits` — Consultations
3. `emr_vitals` — Vital signs
4. `emr_consultation_notes` — SOAP notes
5. `emr_allergies` — Allergy records
6. `emr_ayurvedic_assessment` — Prakriti/Vikriti/Pariksha
7. `emr_diagnosis` — Diagnosis
8. `emr_prescriptions` — Digital prescriptions
9. `emr_prescription_items` — Prescription items
10. `emr_treatment_plans` — Panchakarma plans
11. `emr_therapy_sessions` — Daily therapy tracking
12. `emr_followups` — Follow-up scheduling
+ `emr_documents` — Patient attachments

---

## MODULE 4 IMPLEMENTATION TIMELINE

**Total: 5-6 weeks of focused development**

- **Week 1:** EMR, Consultation, Assessment services (50 hours)
- **Week 2:** Diagnosis, Prescription, Treatment Plan services (40 hours)
- **Week 3:** API endpoints (40 hours)
- **Week 4:** Frontend - Core pages (45 hours)
- **Week 5:** Frontend - Advanced pages (35 hours)
- **Week 6:** Integration, testing, optimization (30 hours)

**Total effort: ~240 hours (~40-50 hours/week)**

---

## AFTER MODULE 4 ✅

Once Module 4 (Clinical Core) is complete, you'll have:

✅ **Complete operational ERP** (Inventory → Pharmacy → Billing → Clinical)  
✅ **Full patient journey** (Appointment → Assessment → Prescription → Panchakarma → Billing)  
✅ **Real-time dashboards** (OPD, Panchakarma, revenue)  
✅ **Clinical analytics** (disease trends, therapy stats, doctor workload)  

---

## REMAINING MODULES (Simplified for Single Clinic)

### Module 5: Clinical Analytics & Automation (Future)
- Advanced analytics dashboards
- Predictive patient outcomes
- Automated reminders (WhatsApp/SMS)
- Treatment recommendations
- Patient communication templates
- Automated report generation

### Module 6: Administration & Operations (Future)
- Clinic settings & configuration
- Staff management
- Printer settings (thermal, A4)
- Backup & restore
- Audit logs
- Notification settings
- Email templates

### Module 7: Polish & Optimization (Future)
- Performance tuning
- Security hardening
- Automated backups
- Import/export tools
- Production monitoring
- UI/UX refinements
- Mobile optimization

---

## WHY THIS STRUCTURE WORKS FOR AYURSHALA

### ✅ Not Enterprise Bloat
- No multi-branch code
- No franchise management
- No organization hierarchy
- No complex approval workflows
- Just: **What Ayurshala actually needs**

### ✅ Single Clinic Optimized
- Every page designed for Dr. Sanjay's workflow
- Every feature serves daily operations
- All data is Ayurshala's data
- Simple RBAC (5 roles)

### ✅ Ayurveda-First
- Prakriti/Vikriti assessment
- Panchakarma tracking (15 therapy types)
- Ayurvedic diagnosis
- Dosha-based treatment planning
- Not generic hospital workflows

### ✅ Complete Integration
- Appointment → EMR → Consultation → Prescription
- Prescription → Pharmacy → Inventory
- Therapy → Billing → Patient Ledger
- All linked by one patient record
- **Zero duplicate data entry**

---

## PATIENT DATA FLOW (Complete Integration)

```
Patient Creates Appointment (Phase 3 - Appointments)
    ↓
Patient Arrives → Check-in (Module 4.1 - EMR)
    ↓
Record Vitals (Module 4.2 - Consultation)
    ↓
Perform Ayurvedic Assessment (Module 4.3)
    ↓
Doctor Consultation & Diagnosis (Modules 4.2, 4.4)
    ↓
Write Prescription (Module 4.5) → Pharmacy (Phase 2)
    ↓
Dispense & Bill (Phase 2) → Inventory Updated (Phase 1)
    ↓
Patient Invoice Created (Phase 3)
    ↓
If Panchakarma:
    ├─ Create Treatment Plan (Module 4.6)
    ├─ Schedule Therapy Sessions (Module 4.7)
    └─ Track Daily Sessions (Module 4.6)
    ↓
Schedule Follow-up (Module 4.8)
    ↓
Clinical Dashboard Shows All Metrics (Module 4.9)
    ↓
Reports Generated (Module 4.10)
```

**All connected. Single patient record. No duplicate entry.**

---

## SUCCESS CRITERIA FOR MODULE 4

When Module 4 is complete:

✅ Doctor creates complete patient EMR  
✅ Vitals recorded automatically at each visit  
✅ Ayurvedic assessment completed digitally  
✅ Diagnosis with treatment plan created  
✅ Digital prescription generated & printed  
✅ Prescription auto-links to pharmacy  
✅ Pharmacist receives prescription digitally  
✅ Medicine auto-bills and inventory auto-updates  
✅ Panchakarma therapies tracked daily  
✅ Treatment progress visible in real-time  
✅ Follow-ups automatically scheduled  
✅ Clinical dashboard shows today's metrics  
✅ Patient timeline shows complete journey  
✅ Reports show clinic analytics  
✅ Build passes (0 errors)  
✅ All pages dark-mode & responsive  

---

## FINAL ROADMAP: MODULES NOT PHASES

| Module | Status | Value | Timeline |
|--------|--------|-------|----------|
| 1. Inventory | ✅ Complete | Operational | Done |
| 2. Pharmacy POS | ✅ Complete | Operational | Done |
| 3. Billing | ✅ Complete | Financial | Done |
| **4. Clinical Core** | 🚀 Ready | **HIGHEST** | **5-6 weeks** |
| 5. Analytics & Automation | ⏳ Planned | High | 3-4 weeks |
| 6. Administration | ⏳ Planned | Medium | 2-3 weeks |
| 7. Polish & Optimization | ⏳ Planned | Medium | 2-3 weeks |

**Total: ~15-18 weeks to complete Ayurshala's full clinical ERP**

**But Module 4 is the critical one** — after that, you have a fully functional clinic system.

---

## RECOMMENDATION

**Start Module 4 (Clinical Core) immediately.**

This is where Ayurshala becomes a complete system. Every clinical workflow, every patient interaction, every therapy session — all managed digitally.

When Module 4 is done, you'll have a **complete Ayurvedic clinical management system** that Dr. Sanjay and his team use every single day.

---

**Ayurshala ERP: Built as functional modules, not enterprise phases.**

**Status: ✅ Ready to implement Module 4**
