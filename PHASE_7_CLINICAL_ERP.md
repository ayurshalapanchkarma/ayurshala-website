# PHASE 7: CLINICAL ERP & AYURVEDIC EMR

**Status:** Starting Implementation  
**Date:** Saturday, 2026-07-04T22:22:19.716+05:30  
**Scope:** Complete Ayurvedic clinical module with EMR, assessments, and prescription management  
**Priority:** Highest (core clinic operations)  

---

## VISION

Transform Ayurshala from a **transactional system** (inventory, pharmacy, billing) into a **clinical system** that captures complete Ayurvedic patient care workflows.

**Focus Areas:**
1. Patient medical history & EMR
2. Ayurvedic assessments (Prakriti, Vikriti, Pariksha)
3. Clinical diagnosis & treatment plans
4. Prescription writing & tracking
5. Follow-up management
6. Integration with Phase 5-6 (Pharmacy, Billing)

---

## DATABASE SCHEMA

### Core Clinical Tables

#### 1. Patient Medical Record (Core EMR)
```sql
CREATE TABLE emr_patient_medical_record (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  -- Basic medical info
  blood_type TEXT,
  rhesus_factor TEXT,
  -- Ayurvedic constitution
  prakriti_type TEXT,        -- Vata, Pitta, Kapha, Dual, Tridosha
  -- Current medical status
  allergies TEXT[],          -- Array of allergies
  chronic_conditions TEXT[], -- Array of chronic conditions
  previous_surgeries TEXT,   -- Description
  current_medications TEXT[], -- Array of current medications
  family_medical_history TEXT,
  -- Lifestyle
  occupation TEXT,
  diet_type TEXT,            -- Vegetarian, Non-veg, Mixed
  exercise_frequency TEXT,
  sleep_pattern TEXT,
  stress_level TEXT,         -- Low, Medium, High
  -- Contacts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  -- Record management
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 2. Visit/Consultation Records
```sql
CREATE TABLE emr_visit (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  doctor_uuid UUID NOT NULL REFERENCES profiles(id),
  appointment_uuid UUID REFERENCES appointments(id),
  -- Visit details
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  visit_type TEXT,           -- OPD, Follow-up, Emergency
  chief_complaint TEXT,       -- Main reason for visit
  duration_minutes INTEGER,
  -- Vitals
  temperature_celsius NUMERIC(5,2),
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  respiratory_rate INTEGER,
  weight_kg NUMERIC(6,2),
  height_cm NUMERIC(5,1),
  -- Status
  visit_status TEXT DEFAULT 'COMPLETED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID
);
```

#### 3. Ayurvedic Assessments
```sql
CREATE TABLE emr_ayurvedic_assessment (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid),
  doctor_uuid UUID NOT NULL REFERENCES profiles(id),
  assessment_date DATE,
  -- Prakriti (Constitutional type)
  prakriti_vata_score INTEGER,   -- 0-100
  prakriti_pitta_score INTEGER,  -- 0-100
  prakriti_kapha_score INTEGER,  -- 0-100
  prakriti_dominant TEXT,        -- Primary dosha
  -- Vikriti (Current imbalance)
  vikriti_vata_score INTEGER,    -- 0-100
  vikriti_pitta_score INTEGER,   -- 0-100
  vikriti_kapha_score INTEGER,   -- 0-100
  vikriti_dominant TEXT,         -- Primary imbalance
  vikriti_severity TEXT,         -- Mild, Moderate, Severe
  -- Nadi Pariksha (Pulse assessment)
  nadi_quality TEXT,             -- Vata (thin, fast), Pitta (strong), Kapha (slow)
  nadi_rate INTEGER,             -- Beats per minute
  nadi_findings TEXT,            -- Detailed findings
  -- Other Pariksha (Examinations)
  tongue_examination TEXT,       -- Findings
  skin_condition TEXT,           -- Observations
  eye_examination TEXT,
  nail_condition TEXT,
  -- Ashtavidha Pariksha (Eight-fold examination)
  nadi_pariksha TEXT,
  mala_pariksha TEXT,            -- Stool examination
  mutra_pariksha TEXT,           -- Urine examination
  jihva_pariksha TEXT,           -- Tongue examination
  shabda_pariksha TEXT,          -- Sound/voice examination
  sparsha_pariksha TEXT,         -- Touch examination
  drika_pariksha TEXT,           -- Vision/eye examination
  akriti_pariksha TEXT,          -- Body appearance examination
  -- Assessment notes
  clinical_observations TEXT,
  assessment_summary TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 4. Diagnosis
```sql
CREATE TABLE emr_diagnosis (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid),
  -- Diagnosis
  ayurvedic_diagnosis TEXT NOT NULL,  -- E.g., "Vata-Kapha Imbalance with Digestive Weakness"
  icd_code TEXT,                      -- Optional: International classification code
  severity TEXT,                      -- Mild, Moderate, Severe
  -- Classification
  dosha_involvement TEXT[],           -- Array: [Vata, Pitta, Kapha]
  dhatu_involvement TEXT[],           -- Array: [Rasa, Rakta, etc.]
  mala_involvement TEXT[],            -- Array: [Vata, etc.]
  -- Treatment approach
  recommended_treatment TEXT,         -- E.g., "Panchakarma with Abhyanga and Basti"
  contraindications TEXT,
  -- Status
  is_primary BOOLEAN DEFAULT TRUE,    -- Primary diagnosis
  diagnosis_date DATE,
  created_by UUID,
  created_at TIMESTAMP
);
```

#### 5. Prescription
```sql
CREATE TABLE emr_prescription (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid),
  doctor_uuid UUID NOT NULL REFERENCES profiles(id),
  -- Prescription details
  prescription_number TEXT NOT NULL UNIQUE,
  prescription_date DATE,
  prescription_type TEXT,        -- Medicine, Therapy, Diet, Lifestyle
  -- Status
  prescription_status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
  validity_days INTEGER,
  -- Notes
  special_instructions TEXT,
  follow_up_date DATE,
  follow_up_days INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 6. Prescription Items (Medicines/Therapies)
```sql
CREATE TABLE emr_prescription_item (
  uuid UUID PRIMARY KEY,
  prescription_uuid UUID NOT NULL REFERENCES emr_prescription(uuid) ON DELETE CASCADE,
  item_type TEXT,                -- MEDICINE, THERAPY, DIET, LIFESTYLE
  -- Medicine details (if MEDICINE)
  medicine_name TEXT,
  dosage TEXT,                   -- E.g., "2 tablets"
  frequency TEXT,                -- E.g., "Twice daily"
  duration_days INTEGER,
  -- Therapy details (if THERAPY)
  therapy_name TEXT,             -- E.g., "Abhyanga", "Basti"
  therapy_duration_minutes INTEGER,
  therapy_frequency TEXT,        -- E.g., "Daily for 7 days"
  -- Diet/Lifestyle recommendations
  recommendation TEXT,
  -- Pharmacy link
  product_uuid UUID REFERENCES inv_products(uuid),  -- Link to pharmacy product if applicable
  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  created_at TIMESTAMP
);
```

#### 7. Treatment Plan
```sql
CREATE TABLE emr_treatment_plan (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  diagnosis_uuid UUID NOT NULL REFERENCES emr_diagnosis(uuid),
  -- Plan details
  treatment_plan_number TEXT NOT NULL UNIQUE,
  plan_start_date DATE,
  plan_end_date DATE,
  -- Treatment phases
  total_phases INTEGER,
  phase_duration_days INTEGER,
  -- Objectives
  treatment_objectives TEXT,
  expected_outcome TEXT,
  -- Associated items
  prescription_uuid UUID REFERENCES emr_prescription(uuid),
  -- Monitoring
  review_frequency TEXT,         -- Weekly, Bi-weekly, Monthly
  monitoring_parameters TEXT[],  -- Array of things to monitor
  -- Status
  plan_status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, ABANDONED
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 8. Follow-up Management
```sql
CREATE TABLE emr_follow_up (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid),
  -- Follow-up schedule
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  follow_up_reason TEXT,
  follow_up_type TEXT,           -- Review, Progress Check, Reassessment
  -- Status
  follow_up_status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, MISSED, CANCELLED
  completed_date DATE,
  -- Notes
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP
);
```

#### 9. Clinical Notes
```sql
CREATE TABLE emr_clinical_note (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid),
  doctor_uuid UUID NOT NULL REFERENCES profiles(id),
  -- Note
  note_type TEXT,               -- SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN, FOLLOW_UP
  note_content TEXT,
  -- Attachments
  attachments TEXT[],           -- Array of file URLs
  -- Status
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 10. Investigation Records
```sql
CREATE TABLE emr_investigation (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  visit_uuid UUID NOT NULL REFERENCES emr_visit(uuid),
  -- Investigation details
  investigation_type TEXT,      -- LAB, IMAGING, PATHOLOGY, CUSTOM
  investigation_name TEXT,
  test_date DATE,
  result_date DATE,
  -- Results
  result_value TEXT,
  result_status TEXT,           -- NORMAL, ABNORMAL, PENDING
  result_unit TEXT,
  reference_range TEXT,
  -- Interpretation
  interpretation TEXT,
  -- File
  result_file_url TEXT,         -- URL to PDF/image
  created_at TIMESTAMP
);
```

### Ayurvedic Reference Tables

#### 11. Prakriti Types
```sql
CREATE TABLE ref_prakriti_types (
  uuid UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,     -- Vata, Pitta, Kapha, Vata-Pitta, etc.
  description TEXT,
  characteristics TEXT[],        -- Array of characteristics
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 12. Ayurvedic Diagnoses
```sql
CREATE TABLE ref_ayurvedic_diagnoses (
  uuid UUID PRIMARY KEY,
  diagnosis_code TEXT NOT NULL UNIQUE,
  diagnosis_name TEXT NOT NULL,
  description TEXT,
  dosha_involvement TEXT[],
  dhatu_involvement TEXT[],
  typical_treatment TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## API ENDPOINTS (Phase 7)

### EMR APIs
```
GET    /api/clinic/patient-emr                    — Patient medical record
POST   /api/clinic/patient-emr                    — Create/update EMR
GET    /api/clinic/patient-emr/history            — Complete medical history
```

### Visit APIs
```
GET    /api/clinic/visits                         — List visits
POST   /api/clinic/visits                         — Create visit
GET    /api/clinic/visits/[visitId]               — Get visit details
PUT    /api/clinic/visits/[visitId]               — Update visit
GET    /api/clinic/visits/today                   — Today's visits
```

### Assessment APIs
```
GET    /api/clinic/assessments                    — List assessments
POST   /api/clinic/assessments                    — Create assessment
GET    /api/clinic/assessments/[assessmentId]     — Get assessment
```

### Diagnosis APIs
```
GET    /api/clinic/diagnoses                      — List diagnoses
POST   /api/clinic/diagnoses                      — Create diagnosis
GET    /api/clinic/diagnoses/[diagnosisId]        — Get diagnosis
```

### Prescription APIs
```
GET    /api/clinic/prescriptions                  — List prescriptions
POST   /api/clinic/prescriptions                  — Create prescription
GET    /api/clinic/prescriptions/[prescriptionId] — Get prescription
GET    /api/clinic/prescriptions/print/[prescriptionId] — Print prescription
```

### Treatment Plan APIs
```
GET    /api/clinic/treatment-plans                — List plans
POST   /api/clinic/treatment-plans                — Create plan
GET    /api/clinic/treatment-plans/[planId]       — Get plan
PUT    /api/clinic/treatment-plans/[planId]       — Update plan
```

### Follow-up APIs
```
GET    /api/clinic/follow-ups                     — List follow-ups
POST   /api/clinic/follow-ups                     — Schedule follow-up
GET    /api/clinic/follow-ups/upcoming            — Upcoming follow-ups
PUT    /api/clinic/follow-ups/[followUpId]        — Mark completed
```

### Integration APIs
```
POST   /api/clinic/visits/[visitId]/create-invoice — Auto-create billing invoice
POST   /api/clinic/prescriptions/[prescriptionId]/dispense — Send to pharmacy
```

---

## FRONTEND PAGES (Phase 7)

### Core Pages
1. **Patient EMR Dashboard** `/admin/clinic/patient-emr/[patientId]`
   - Complete patient record
   - Medical history timeline
   - Allergies & contraindications
   - Quick actions

2. **Visit Record** `/admin/clinic/visit/[visitId]`
   - Vitals entry
   - Chief complaint
   - Assessment
   - Diagnosis
   - Prescription
   - Follow-up scheduling

3. **Ayurvedic Assessment** `/admin/clinic/assessment/[visitId]`
   - Prakriti/Vikriti scores
   - Nadi Pariksha
   - Other Pariksha (Ashtavidha, Dashavidha)
   - Assessment summary

4. **Diagnosis & Treatment** `/admin/clinic/diagnosis/[visitId]`
   - Diagnosis entry
   - Treatment plan creation
   - Therapy recommendations
   - Diet & lifestyle advice

5. **Prescription Writing** `/admin/clinic/prescription/new`
   - Medicine selection
   - Dosage entry
   - Instructions
   - Digital prescription
   - Print/email prescription

6. **Treatment Plan** `/admin/clinic/treatment-plan/[planId]`
   - Plan overview
   - Progress tracking
   - Adjustments
   - Completion marking

7. **Follow-up Schedule** `/admin/clinic/follow-ups`
   - Upcoming follow-ups
   - Overdue follow-ups
   - Reschedule options
   - Completion tracking

8. **Doctor Dashboard** `/admin/clinic/doctor-dashboard`
   - Today's appointments
   - Pending follow-ups
   - Patient queue
   - Quick actions

---

## SERVICES (Phase 7)

### 1. EMRService
- createPatientEMR()
- getPatientEMR()
- updatePatientEMR()
- getPatientHistory()

### 2. VisitService
- createVisit()
- getVisit()
- updateVisit()
- getTodayVisits()
- completeVisit()

### 3. AssessmentService
- createAssessment()
- getAssessment()
- calculatePrakritVikriti()
- generateAssessmentReport()

### 4. DiagnosisService
- createDiagnosis()
- getDiagnosis()
- suggestTreatment()

### 5. PrescriptionService
- createPrescription()
- getPrescription()
- generatePrescriptionPDF()
- emailPrescription()
- linkToPharmacy()

### 6. TreatmentPlanService
- createTreatmentPlan()
- getTreatmentPlan()
- updatePlanPhase()
- completeTreatmentPlan()

### 7. FollowUpService
- scheduleFollowUp()
- getUpcomingFollowUps()
- markFollowUpCompleted()
- sendFollowUpReminder()

### 8. ClinicalNoteService
- createNote()
- getNote()
- attachFile()

---

## INTEGRATION POINTS

### With Phase 5 (Pharmacy)
- Prescription → Pharmacy dispense
- Auto-create pharmacy bill from prescribed items
- Inventory deduction from prescription medicines
- Patient medicine history

### With Phase 6 (Billing)
- Create invoice from consultation
- Create invoice from therapy sessions
- Link prescriptions to pharmacy charges
- Patient ledger auto-update

### With Appointments
- Link visit to appointment
- Mark appointment as completed
- Schedule follow-up as new appointment

### With Phase 4 (Inventory)
- Medicine availability check
- Inventory consumption tracking
- Batch tracking for prescribed medicines

---

## IMPLEMENTATION SEQUENCE

### Week 1: Database & Services
1. Create all tables (10 tables)
2. Create migrations
3. Implement services (8 services)
4. Implement APIs (20+ endpoints)

### Week 2: Frontend - Core Pages
1. Patient EMR dashboard
2. Visit recording
3. Assessment forms

### Week 3: Frontend - Clinical Pages
1. Diagnosis & treatment
2. Prescription writing
3. Treatment plan

### Week 4: Integration & Polish
1. Pharmacy integration
2. Billing integration
3. Testing & refinement
4. Build verification

---

## SUCCESS CRITERIA

✅ All 10 tables created and migrated  
✅ All 20+ APIs functional  
✅ All 8 pages rendering  
✅ Ayurvedic assessments working  
✅ Prescriptions generating PDFs  
✅ Pharmacy integration verified  
✅ Billing integration verified  
✅ Build passing (zero errors)  
✅ Dark mode working  
✅ Responsive design verified  

---

## ESTIMATED EFFORT

- Database & Services: 8-10 hours
- API endpoints: 6-8 hours
- Frontend pages: 12-16 hours
- Integration: 6-8 hours
- Testing & Polish: 4-6 hours

**Total: ~40-50 hours of focused development**

---

## START DATE

**NOW** — Saturday, 2026-07-04T22:22:19.716+05:30

All prerequisites met. Database design complete. Ready to implement.

