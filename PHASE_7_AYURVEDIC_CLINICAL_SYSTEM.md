# PHASE 7: AYURVEDIC CLINICAL MANAGEMENT SYSTEM
## Not a generic hospital EMR. Built specifically for Ayurshala.

**Start Date:** Saturday, 2026-07-04T22:25:22.196+05:30  
**Scope:** Complete Ayurvedic clinical workflow for Ayurshala  
**Model:** Single clinic, Dr. Sanjay admin, Panchakarma-focused  
**Duration:** 4 weeks  

---

## VISION

**Transform Ayurshala from transactional system to integrated clinical platform.**

Every patient journey digitally managed:
```
Appointment → Check-in → Vitals → Assessment → Consultation → 
Diagnosis → Prescription → Pharmacy → Treatment Plan → 
Therapy Sessions → Follow-up → Clinical Reports
```

**All connected. No duplicate entry. No manual data transfer.**

---

## PATIENT JOURNEY (Mapped to Modules)

### 1. Patient Arrives
**Module: EMR + Check-in**
- System finds patient by phone/ID
- Displays medical history
- Updates vitals (weight, BP, HR, temp)
- Checks allergies & contraindications
- Shows previous diagnoses

### 2. Doctor Consultation
**Module: Consultation Management**
- Chief complaint entry
- History of present illness
- Past medical history review
- Family history
- Personal history
- Physical examination
- SOAP notes

### 3. Ayurvedic Assessment
**Module: Ayurvedic Assessment**
- Prakriti assessment (Vata/Pitta/Kapha)
- Vikriti assessment (current imbalance)
- Nadi Pariksha (pulse)
- Jihva Pariksha (tongue)
- Mala Pariksha (stool)
- Mutra Pariksha (urine)
- Agni assessment (digestion)
- Nidra assessment (sleep)
- Manas assessment (mind)
- Ashtavidha & Dashavidha

### 4. Diagnosis
**Module: Diagnosis**
- Ayurvedic diagnosis (e.g., "Vata-Pitta Imbalance with Weak Agni")
- Modern diagnosis (optional ICD code)
- Severity level
- Treatment goals
- Contraindications

### 5. Prescription
**Module: Prescription Engine**
- Select medicines from pharmacy inventory
- Set dosage, frequency, before/after food
- Add duration & special instructions
- Generate digital prescription (PDF)
- Print for patient
- Auto-link to pharmacy

### 6. Pharmacy Billing
**Module: Pharmacy Integration**
- Pharmacist receives prescription
- Dispenses medicines
- Creates pharmacy bill
- Inventory auto-deducts (FIFO)
- Patient pays at counter
- Links to patient ledger

### 7. Treatment Planning
**Module: Treatment Plans**
- If Panchakarma: Create treatment plan
- Define therapy sequence (Abhyanga → Shirodhara → Basti)
- Set duration (7/14/21 days)
- Identify therapist
- Assign treatment room

### 8. Daily Therapy Sessions
**Module: Therapy Sessions**
- Therapist checks daily schedule
- Logs oil/medicine used
- Records session duration
- Marks completion
- Notes patient progress

### 9. Billing
**Module: Clinic Billing Integration**
- Consultation charge → Invoice
- Therapy sessions → Charges
- Medicines → Already billed in pharmacy
- Patient balance tracked
- Payment collected

### 10. Follow-up
**Module: Follow-up Management**
- Doctor schedules next visit
- System tracks follow-up date
- SMS/WhatsApp reminders (Phase 9)
- Patient completes follow-up
- Cycle repeats

---

## DATABASE SCHEMA (11 Core Tables)

### 1. emr_patients
Core patient information (extends patients table)
```sql
uuid, patient_id, blood_type, rhesus_factor, occupation, 
diet_type, exercise_frequency, sleep_pattern, stress_level,
allergies (TEXT[]), chronic_conditions (TEXT[]),
emergency_contact, created_at, updated_at
```

### 2. emr_visits
Every consultation/visit
```sql
uuid, patient_id, doctor_id, appointment_id,
visit_date, visit_time, visit_type (OPD/Follow-up),
chief_complaint, duration_minutes,
visit_status (SCHEDULED/IN_PROGRESS/COMPLETED),
created_at, updated_at
```

### 3. emr_vitals
Vital signs recorded at each visit
```sql
uuid, visit_id, temperature, heart_rate, 
blood_pressure (systolic/diastolic), respiratory_rate,
weight_kg, height_cm, bmi, recorded_at
```

### 4. emr_consultation_notes
SOAP notes for each consultation
```sql
uuid, visit_id, patient_id, doctor_id,
chief_complaint, history_of_present_illness, past_history,
family_history, personal_history, examination_findings,
subjective, objective, assessment, plan,
clinical_notes, created_at
```

### 5. emr_ayurvedic_assessment
Prakriti/Vikriti & other Pariksha
```sql
uuid, visit_id, patient_id, doctor_id,
-- Prakriti scores
prakriti_vata, prakriti_pitta, prakriti_kapha, prakriti_dominant,
-- Vikriti scores
vikriti_vata, vikriti_pitta, vikriti_kapha, vikriti_dominant, vikriti_severity,
-- Pariksha findings
nadi_pariksha, jihva_pariksha, mala_pariksha, mutra_pariksha,
agni_level, nidra_quality, manas_state,
ashtavidha_findings, dashavidha_findings,
assessment_summary, created_at
```

### 6. emr_diagnosis
Diagnosis for each visit
```sql
uuid, visit_id, patient_id, doctor_id,
ayurvedic_diagnosis, modern_diagnosis, icd_code,
dosha_involvement (TEXT[]), dhatu_involvement (TEXT[]),
severity, treatment_goals, contraindications,
is_primary, diagnosis_date
```

### 7. emr_prescriptions
Digital prescriptions
```sql
uuid, patient_id, visit_id, doctor_id,
prescription_number, prescription_date,
validity_days, status (ACTIVE/COMPLETED/CANCELLED),
special_instructions, follow_up_date,
pdf_url, created_at
```

### 8. emr_prescription_items
Individual medicine/therapy items in prescription
```sql
uuid, prescription_id,
item_type (MEDICINE/THERAPY/DIET/LIFESTYLE),
medicine_name, dosage, frequency, before_after_food, duration_days,
product_id (link to inventory), 
is_dispensed, dispensed_date, dispensed_by,
created_at
```

### 9. emr_treatment_plans
Panchakarma or multi-phase treatment plans
```sql
uuid, patient_id, diagnosis_id,
plan_number, plan_type (PANCHAKARMA/OPD/WELLNESS),
plan_start_date, plan_end_date,
therapy_sequence (e.g., "Abhyanga→Shirodhara→Basti"),
assigned_therapist_ids (TEXT[]),
treatment_room_id, total_sessions,
completed_sessions, status (ACTIVE/COMPLETED),
created_by, created_at
```

### 10. emr_therapy_sessions
Individual therapy session records
```sql
uuid, patient_id, treatment_plan_id,
session_date, session_time, session_number,
therapy_name (Abhyanga/Shirodhara/Basti),
assigned_therapist_id,
oil_used, oil_quantity, medicine_used,
duration_minutes, room_id,
patient_comfort, session_notes,
status (SCHEDULED/COMPLETED/MISSED),
completed_at, created_by
```

### 11. emr_followups
Follow-up scheduling
```sql
uuid, patient_id, visit_id,
follow_up_date, follow_up_type (REVIEW/PROGRESS/REASSESSMENT),
follow_up_reason, doctor_notes,
status (SCHEDULED/COMPLETED/MISSED),
completed_date, next_visit_id,
created_by, created_at
```

### 12. emr_documents
Patient document attachments
```sql
uuid, patient_id, visit_id (optional),
document_type (REPORT/PRESCRIPTION/LAB/IMAGING),
document_name, file_url, file_type,
uploaded_by, uploaded_at
```

---

## BACKEND SERVICES (10 Services)

### 1. EMRService
Patient medical record management
- createPatientEMR()
- getPatientEMR()
- updatePatientEMR()
- getPatientHistory()
- addAllergy()
- addChronicCondition()

### 2. VisitService
Consultation workflow
- createVisit()
- getVisit()
- completeVisit()
- getTodayVisits()
- getVisitHistory()

### 3. ConsultationService
SOAP notes & clinical documentation
- createConsultationNote()
- getConsultationNote()
- updateAssessmentAndPlan()

### 4. AyurvedicAssessmentService
Prakriti/Vikriti/Pariksha assessment
- createAssessment()
- calculatePrakritVikriti()
- calculateAshtavid()
- calculateDashavidha()
- getAssessmentReport()

### 5. DiagnosisService
Diagnosis management
- createDiagnosis()
- getDiagnosis()
- suggestTreatment()
- getPatientActiveDiagnoses()

### 6. PrescriptionService
Digital prescription engine
- createPrescription()
- addPrescriptionItem()
- generatePrescriptionPDF()
- printPrescription()
- sendToPharmacy()
- markDispenséd()

### 7. TreatmentPlanService
Panchakarma & multi-phase plans
- createTreatmentPlan()
- getTreatmentPlan()
- updatePlanStatus()
- completeTreatmentPlan()
- getActivePlans()

### 8. TherapySessionService
Daily therapy tracking
- scheduleSessions()
- getSessions()
- recordSession()
- markSessionCompleted()
- getTherapistSchedule()
- getSessionNotes()

### 9. FollowUpService
Follow-up management
- scheduleFollowUp()
- getUpcomingFollowUps()
- markFollowUpCompleted()
- getFollowUpHistory()

### 10. ClinicalDashboardService
Real-time clinic metrics
- getTodayMetrics()
- getOPDQueue()
- getPanchakarmaSchedule()
- getWaitingPatients()
- getTodayRevenue()

---

## API ENDPOINTS (40+ Routes)

### EMR Endpoints
```
POST   /api/clinic/emr                           Create patient EMR
GET    /api/clinic/emr/[patientId]               Get EMR
PUT    /api/clinic/emr/[patientId]               Update EMR
GET    /api/clinic/emr/[patientId]/history       Get complete history
```

### Visit Endpoints
```
POST   /api/clinic/visits                        Create visit
GET    /api/clinic/visits                        List visits
GET    /api/clinic/visits/[visitId]              Get visit
POST   /api/clinic/visits/[visitId]/complete    Complete visit
GET    /api/clinic/visits/today                  Today's visits
GET    /api/clinic/visits/[patientId]/history   Patient visit history
```

### Vitals Endpoints
```
POST   /api/clinic/visits/[visitId]/vitals      Record vitals
GET    /api/clinic/vitals/[patientId]           Get vital history
```

### Consultation Endpoints
```
POST   /api/clinic/consultations                 Create consultation
GET    /api/clinic/consultations/[consultationId] Get consultation
PUT    /api/clinic/consultations/[consultationId] Update notes
```

### Assessment Endpoints
```
POST   /api/clinic/assessments                   Create assessment
GET    /api/clinic/assessments/[assessmentId]    Get assessment
POST   /api/clinic/assessments/calculate         Calculate scores
```

### Diagnosis Endpoints
```
POST   /api/clinic/diagnoses                     Create diagnosis
GET    /api/clinic/diagnoses/[diagnosisId]       Get diagnosis
GET    /api/clinic/diagnoses/[patientId]        Get patient diagnoses
```

### Prescription Endpoints
```
POST   /api/clinic/prescriptions                 Create prescription
GET    /api/clinic/prescriptions/[prescriptionId] Get prescription
POST   /api/clinic/prescriptions/[prescriptionId]/items Add item
GET    /api/clinic/prescriptions/[prescriptionId]/pdf Generate PDF
POST   /api/clinic/prescriptions/[prescriptionId]/pharmacy Send to pharmacy
POST   /api/clinic/prescriptions/[prescriptionId]/dispense Mark dispensed
```

### Treatment Plan Endpoints
```
POST   /api/clinic/treatment-plans               Create plan
GET    /api/clinic/treatment-plans/[planId]      Get plan
GET    /api/clinic/treatment-plans/[patientId]  Get patient plans
PUT    /api/clinic/treatment-plans/[planId]      Update plan
```

### Therapy Session Endpoints
```
POST   /api/clinic/therapy-sessions              Schedule session
GET    /api/clinic/therapy-sessions/today        Today's sessions
GET    /api/clinic/therapy-sessions/[sessionId]  Get session
POST   /api/clinic/therapy-sessions/[sessionId]/complete Mark complete
GET    /api/clinic/therapist-schedule/[therapistId] Therapist schedule
```

### Follow-up Endpoints
```
POST   /api/clinic/follow-ups                    Schedule follow-up
GET    /api/clinic/follow-ups/upcoming           Upcoming follow-ups
GET    /api/clinic/follow-ups/[patientId]       Patient follow-ups
PUT    /api/clinic/follow-ups/[followUpId]       Mark completed
```

### Integration Endpoints
```
POST   /api/clinic/visits/[visitId]/create-invoice Create billing invoice
POST   /api/clinic/prescriptions/[prescriptionId]/pharmacy Auto-create pharmacy bill
```

### Clinical Dashboard Endpoints
```
GET    /api/clinic/dashboard/today               Today's metrics
GET    /api/clinic/dashboard/opd-queue           OPD queue
GET    /api/clinic/dashboard/panchakarma         Panchakarma schedule
GET    /api/clinic/dashboard/revenue             Today's revenue
```

---

## FRONTEND PAGES (15 Pages)

### 1. **Clinical Dashboard** `/admin/clinic/dashboard`
- Today's OPD queue
- Today's Panchakarma sessions
- Waiting patients
- Completed consultations
- Today's revenue
- Medicine dispensed
- Therapies completed
- Upcoming follow-ups

### 2. **Patient EMR Dashboard** `/admin/clinic/patient/[patientId]`
- Patient overview card
- Medical history timeline
- Allergies & conditions
- Recent diagnoses
- Active treatment plans
- Next follow-up date
- Quick actions (new visit, add notes)

### 3. **Patient Timeline** `/admin/clinic/patient/[patientId]/timeline`
- Complete visit history
- Consultation notes
- Prescriptions written
- Medicines dispensed
- Therapy sessions
- Follow-up records

### 4. **New Consultation** `/admin/clinic/consultation/new`
- Patient search/select
- Vitals entry form
- Chief complaint
- History entry (HPI, PHx, FHx, PSHx)
- SOAP note template
- Save consultation

### 5. **Vitals Recording** `/admin/clinic/consultation/[visitId]/vitals`
- Temperature, HR, BP, RR, weight, height
- Auto-calculate BMI
- Graphical history
- Trends

### 6. **Ayurvedic Assessment** `/admin/clinic/consultation/[visitId]/assessment`
- Prakriti scoring (slider interface)
- Vikriti scoring
- Nadi Pariksha findings
- Jihva/Mala/Mutra/Agni/Nidra/Manas observations
- Ashtavidha & Dashavidha checklist
- Auto-generate assessment summary

### 7. **Diagnosis** `/admin/clinic/consultation/[visitId]/diagnosis`
- Ayurvedic diagnosis dropdown/entry
- Modern diagnosis (optional)
- ICD code (optional)
- Severity selection
- Dosha/Dhatu involvement checkboxes
- Treatment goals
- Contraindications
- Save diagnosis

### 8. **Prescription Writing** `/admin/clinic/prescription/new`
- Prescription header (date, validity)
- Medicine search & add interface
- Dosage, frequency, before/after food
- Duration & special instructions
- Therapy recommendations
- Diet & lifestyle advice
- Preview prescription
- Print/Email/Send to pharmacy

### 9. **Treatment Plans** `/admin/clinic/treatment-plan/[planId]`
- Plan overview (type, dates, progress)
- Therapy sequence
- Assigned therapist
- Total vs completed sessions
- Session details expandable
- Completion percentage
- Update notes

### 10. **Therapy Calendar** `/admin/clinic/therapy-calendar`
- Weekly view
- Daily therapist assignments
- Treatment room allocation
- Session times
- Patient names
- Reschedule interface
- Mark completion

### 11. **Therapy Sessions** `/admin/clinic/therapy-session/[sessionId]`
- Session details (date, time, therapist)
- Oil/medicine used
- Duration, room, comfort level
- Session notes
- Completion status
- Mark complete

### 12. **Follow-up Management** `/admin/clinic/follow-ups`
- Upcoming follow-ups (sorted by date)
- Overdue follow-ups
- Completed follow-ups
- Follow-up details (reason, doctor notes)
- Mark completed
- Reschedule
- Send reminder

### 13. **Prescription History** `/admin/clinic/patient/[patientId]/prescriptions`
- All prescriptions for patient
- View, print, reorder
- Link to pharmacy bills
- Dispensing status

### 14. **Clinical Reports** `/admin/clinic/reports`
- Doctor-wise patients
- Disease trends
- Medicine usage
- Therapy reports
- Follow-up compliance
- Revenue by treatment
- Patient improvement tracking

### 15. **Medical Documents** `/admin/clinic/patient/[patientId]/documents`
- Uploaded reports, tests, imaging
- PDF viewer
- Search & filter
- Upload new document

---

## INTEGRATION FLOW

```
Appointment (Phase 3)
      ↓
EMR Check-in (New visit)
      ↓
Vitals Recording (EMR)
      ↓
Consultation (SOAP notes)
      ↓
Ayurvedic Assessment
      ↓
Doctor Diagnosis
      ↓
Prescription ──────→ Pharmacy POS (Phase 5)
      ↓              ↓
      │         Inventory Deduction
      │         (FIFO from Phase 4)
      ↓              ↓
Clinic Invoice ←───┤
(Phase 6)          │
      ↓            ↓
Patient Ledger  Pharmacy Bill
      ↓
Treatment Plan (if Panchakarma)
      ↓
Daily Therapy Sessions
      ↓
Session Billing (Phase 6)
      ↓
Follow-up Scheduled
      ↓
→ Next Appointment
```

---

## WHAT MAKES THIS AYURVEDIC (Not Generic Hospital EMR)

✅ **Prakriti/Vikriti Assessment** — Not just "patient history"  
✅ **Nadi Pariksha** — Pulse assessment  
✅ **Ashtavidha & Dashavidha** — Eight and ten-fold examinations  
✅ **Dosha-Based Diagnosis** — Not ICD-only  
✅ **Panchakarma Sessions** — Abhyanga, Shirodhara, Basti, etc.  
✅ **Therapy Room Assignment** — Real clinic operations  
✅ **Therapist Scheduling** — Daily treatment calendar  
✅ **Oil & Medicine Tracking** — Consumption per session  
✅ **Treatment Progress** — Multi-phase Panchakarma management  
✅ **Follow-up Protocol** — Ayurvedic follow-up system  

**Every screen reflects Ayurshala's actual workflow, not a generic template.**

---

## IMPLEMENTATION SEQUENCE

### Week 1: Backend (50 hours)
- EMRService, VisitService, ConsultationService
- AyurvedicAssessmentService
- DiagnosisService, PrescriptionService
- TreatmentPlanService, TherapySessionService
- FollowUpService, ClinicalDashboardService

### Week 2: APIs (40 hours)
- All 40+ endpoints
- Full CRUD operations
- Integration points (pharmacy, billing)
- PDF generation
- Error handling

### Week 3: Frontend - Core (45 hours)
- Clinical Dashboard
- Patient EMR Dashboard
- New Consultation
- Vitals, Assessment, Diagnosis
- Prescription Writing

### Week 4: Frontend - Advanced (35 hours)
- Treatment Plans
- Therapy Calendar & Sessions
- Follow-ups
- Reports
- Medical Documents

### Week 5: Integration & Testing (30 hours)
- Pharmacy integration
- Billing integration
- Full workflow testing
- Build verification
- Performance optimization

**Total: ~200 hours (focused development: ~50-60 hours/week × 4 weeks)**

---

## SUCCESS CRITERIA

✅ All 10 services implemented  
✅ All 40+ APIs functional  
✅ All 15 frontend pages rendering  
✅ Prakriti/Vikriti calculations working  
✅ Prescription → Pharmacy auto-flow working  
✅ Therapy sessions tracking  
✅ Follow-up scheduling working  
✅ Clinical dashboard real-time metrics  
✅ Build passing (zero errors)  
✅ Dark mode working  
✅ Responsive design verified  
✅ End-to-end workflow tested  

---

## STATUS

**Database:** ✅ 11 tables designed  
**Services:** ✅ 10 services planned  
**APIs:** ✅ 40+ endpoints mapped  
**Frontend:** ✅ 15 pages designed  
**Integration:** ✅ Pharmacy & Billing flows mapped  

---

## This is Not Generic

This is **Ayurvedic Clinical Management for Ayurshala**.

Built for:
- Single clinic, single location
- Dr. Sanjay's management
- Panchakarma-focused practice
- Integrated pharmacy & billing
- Real clinical workflows

Not built for:
- Multi-branch operations
- Enterprise hierarchies
- Generic hospital workflows
- IPD/ward management
- Insurance claims

**Every table, every API, every page is optimized for how Ayurshala actually operates.**

---

**Status: Ready to implement Phase 7.**

**Next step: Build the Ayurvedic clinical heart of this system.**
