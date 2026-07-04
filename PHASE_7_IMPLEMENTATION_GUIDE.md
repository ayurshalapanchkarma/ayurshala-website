# PHASE 7 IMPLEMENTATION GUIDE
## Clinical ERP & Ayurvedic EMR

**Start Date:** Saturday, 2026-07-04T22:22:19.716+05:30  
**Duration:** 4 weeks (estimated)  
**Focus:** Complete Ayurvedic clinical workflows  
**Status:** Foundation ready, implementation starting  

---

## QUICK START

### 1. Database (1 hour)
```bash
# Run migration
cd /Users/ali/Documents/ayurshala-website
# Execute: migrations/phase7_clinical_emr.sql in Supabase
```

### 2. Services (Week 1 - 10-12 hours)
Create 8 services in `/lib/inventory/`:
- EMRService
- VisitService
- AssessmentService
- DiagnosisService
- PrescriptionService
- TreatmentPlanService
- FollowUpService
- ClinicalNoteService

### 3. APIs (Week 1-2 - 8-10 hours)
Create endpoints in `/app/api/clinic/`:
- `/patient-emr/*`
- `/visits/*`
- `/assessments/*`
- `/diagnoses/*`
- `/prescriptions/*`
- `/treatment-plans/*`
- `/follow-ups/*`
- Integration endpoints

### 4. Frontend (Week 2-3 - 14-18 hours)
Create pages in `/app/admin/clinic/`:
- Patient EMR dashboard
- Visit record
- Assessment forms
- Diagnosis & treatment
- Prescription writing
- Treatment plan
- Follow-up schedule
- Doctor dashboard

### 5. Integration & Testing (Week 4 - 6-8 hours)
- Pharmacy integration
- Billing integration
- Full system testing
- Build verification

---

## WEEK 1: BACKEND FOUNDATION

### 1. EMRService (`/lib/inventory/emr-service.ts`)

```typescript
export class EMRService {
  // Patient medical record management
  static async createPatientEMR(
    patientId: string,
    data: PatientEMRInput,
    userId: string
  ): Promise<PatientEMR>
  
  static async getPatientEMR(patientId: string): Promise<PatientEMR>
  
  static async updatePatientEMR(
    patientId: string,
    data: PatientEMRInput,
    userId: string
  ): Promise<PatientEMR>
  
  static async getPatientMedicalHistory(
    patientId: string
  ): Promise<MedicalHistoryTimeline>
}
```

**Key Methods:**
- Create EMR on first visit
- Update allergies & contraindications
- Retrieve complete medical history
- Export EMR as PDF

### 2. VisitService (`/lib/inventory/visit-service.ts`)

```typescript
export class VisitService {
  static async createVisit(input: CreateVisitInput): Promise<Visit>
  
  static async getVisit(visitId: string): Promise<VisitDetail>
  
  static async completeVisit(visitId: string, data: VisitCompletion): Promise<Visit>
  
  static async getTodayVisits(doctorId: string): Promise<Visit[]>
  
  static async getUpcomingVisits(patientId: string): Promise<Visit[]>
}
```

**Key Methods:**
- Record vitals
- Link to appointment
- Mark visit status
- Retrieve visit history

### 3. AssessmentService (`/lib/inventory/assessment-service.ts`)

```typescript
export class AssessmentService {
  static async createAssessment(
    visitId: string,
    data: AssessmentInput
  ): Promise<Assessment>
  
  static async calculatePrakritVikriti(scores: DoShaScores): Promise<Analysis>
  
  static async generateAssessmentReport(
    assessmentId: string
  ): Promise<string> // HTML/PDF
  
  static async getPatientAssessmentHistory(
    patientId: string
  ): Promise<Assessment[]>
}
```

**Key Methods:**
- Calculate Prakriti/Vikriti scores
- Analyze Dosha dominance
- Nadi Pariksha interpretation
- Generate assessment summary

### 4. DiagnosisService (`/lib/inventory/diagnosis-service.ts`)

```typescript
export class DiagnosisService {
  static async createDiagnosis(
    visitId: string,
    data: DiagnosisInput
  ): Promise<Diagnosis>
  
  static async getDiagnosis(diagnosisId: string): Promise<Diagnosis>
  
  static async suggestTreatment(
    diagnosisId: string
  ): Promise<TreatmentSuggestion>
  
  static async getPatientDiagnoses(
    patientId: string
  ): Promise<Diagnosis[]>
}
```

**Key Methods:**
- Create Ayurvedic diagnosis
- Get ICD code mapping (optional)
- Treatment recommendations
- Contraindication checking

### 5. PrescriptionService (`/lib/inventory/prescription-service.ts`)

```typescript
export class PrescriptionService {
  static async createPrescription(
    input: PrescriptionInput
  ): Promise<Prescription>
  
  static async addItem(
    prescriptionId: string,
    item: PrescriptionItemInput
  ): Promise<PrescriptionItem>
  
  static async generatePrescriptionPDF(
    prescriptionId: string
  ): Promise<Buffer> // PDF bytes
  
  static async linkToPharmacy(
    prescriptionId: string
  ): Promise<{ pharmacyjBillId: string }>
  
  static async emailPrescription(
    prescriptionId: string,
    email: string
  ): Promise<boolean>
}
```

**Key Methods:**
- Create prescription header
- Add medicines with dosage
- Add therapies
- Generate digital prescription
- Send to pharmacy
- Email to patient

### 6. TreatmentPlanService (`/lib/inventory/treatment-plan-service.ts`)

```typescript
export class TreatmentPlanService {
  static async createTreatmentPlan(
    input: TreatmentPlanInput
  ): Promise<TreatmentPlan>
  
  static async updatePhase(
    planId: string,
    phaseNumber: number
  ): Promise<TreatmentPlan>
  
  static async completePlan(
    planId: string
  ): Promise<TreatmentPlan>
  
  static async getActivePlans(
    patientId: string
  ): Promise<TreatmentPlan[]>
}
```

**Key Methods:**
- Create multi-phase treatment plans
- Track progress per phase
- Update plan status
- Generate treatment certificate

### 7. FollowUpService (`/lib/inventory/follow-up-service.ts`)

```typescript
export class FollowUpService {
  static async scheduleFollowUp(
    input: FollowUpInput
  ): Promise<FollowUp>
  
  static async getUpcomingFollowUps(
    limit?: number
  ): Promise<FollowUp[]>
  
  static async markCompleted(
    followUpId: string,
    visitId: string
  ): Promise<FollowUp>
  
  static async sendReminder(
    followUpId: string
  ): Promise<boolean>
}
```

**Key Methods:**
- Schedule follow-ups
- Send SMS/email reminders
- Track completion
- Reschedule if missed

### 8. ClinicalNoteService (`/lib/inventory/clinical-note-service.ts`)

```typescript
export class ClinicalNoteService {
  static async createNote(
    input: ClinicalNoteInput
  ): Promise<ClinicalNote>
  
  static async attachFile(
    noteId: string,
    file: File
  ): Promise<ClinicalNote>
  
  static async getNotes(
    visitId: string
  ): Promise<ClinicalNote[]>
}
```

**Key Methods:**
- Create SOAP notes
- Attach files
- Mark confidential
- Retrieve note history

---

## WEEK 1-2: API ENDPOINTS

### EMR APIs (`/app/api/clinic/patient-emr/`)

```typescript
// GET /api/clinic/patient-emr
- List all patient EMRs (admin only)

// POST /api/clinic/patient-emr
- Create new patient EMR

// GET /api/clinic/patient-emr/[patientId]
- Get patient's EMR

// PUT /api/clinic/patient-emr/[patientId]
- Update patient's EMR

// GET /api/clinic/patient-emr/[patientId]/history
- Get patient's complete medical history
```

### Visit APIs (`/app/api/clinic/visits/`)

```typescript
// GET /api/clinic/visits
- List visits (with filters)

// POST /api/clinic/visits
- Create new visit

// GET /api/clinic/visits/[visitId]
- Get visit details

// PUT /api/clinic/visits/[visitId]
- Update visit

// GET /api/clinic/visits/today
- Get today's visits

// POST /api/clinic/visits/[visitId]/complete
- Mark visit complete
```

### Assessment APIs (`/app/api/clinic/assessments/`)

```typescript
// POST /api/clinic/assessments
- Create assessment

// GET /api/clinic/assessments/[assessmentId]
- Get assessment details

// GET /api/clinic/assessments/[patientId]/history
- Get patient assessment history
```

### Diagnosis APIs (`/app/api/clinic/diagnoses/`)

```typescript
// POST /api/clinic/diagnoses
- Create diagnosis

// GET /api/clinic/diagnoses/[diagnosisId]
- Get diagnosis details

// GET /api/clinic/diagnoses/[patientId]/active
- Get patient's active diagnoses
```

### Prescription APIs (`/app/api/clinic/prescriptions/`)

```typescript
// POST /api/clinic/prescriptions
- Create prescription

// GET /api/clinic/prescriptions/[prescriptionId]
- Get prescription details

// POST /api/clinic/prescriptions/[prescriptionId]/items
- Add prescription item

// GET /api/clinic/prescriptions/[prescriptionId]/pdf
- Generate prescription PDF

// POST /api/clinic/prescriptions/[prescriptionId]/email
- Email prescription to patient

// POST /api/clinic/prescriptions/[prescriptionId]/pharmacy
- Send to pharmacy
```

### Treatment Plan APIs (`/app/api/clinic/treatment-plans/`)

```typescript
// POST /api/clinic/treatment-plans
- Create treatment plan

// GET /api/clinic/treatment-plans/[planId]
- Get plan details

// PUT /api/clinic/treatment-plans/[planId]
- Update plan
```

### Follow-up APIs (`/app/api/clinic/follow-ups/`)

```typescript
// GET /api/clinic/follow-ups
- List follow-ups

// POST /api/clinic/follow-ups
- Schedule follow-up

// GET /api/clinic/follow-ups/upcoming
- Get upcoming follow-ups

// PUT /api/clinic/follow-ups/[followUpId]/complete
- Mark completed
```

---

## WEEK 2-3: FRONTEND PAGES

### 1. Patient EMR Dashboard (`/app/admin/clinic/patient-emr/[patientId]/page.tsx`)

**Display:**
- Patient basic info
- Medical history timeline
- Allergies & contraindications
- Recent diagnoses
- Active prescriptions
- Treatment plans

**Actions:**
- Edit EMR
- Add visit
- Update allergies
- View complete history

### 2. Visit Record (`/app/admin/clinic/visit/[visitId]/page.tsx`)

**Sections:**
- Visit header (date, doctor, appointment)
- Vitals entry form
- Chief complaint
- Assessment form
- Diagnosis selection
- Prescription creation
- Follow-up scheduling
- Save/cancel

### 3. Ayurvedic Assessment (`/app/admin/clinic/assessment/new/page.tsx`)

**Forms:**
- Prakriti/Vikriti score entry (sliders/radio)
- Nadi Pariksha findings
- Other Pariksha (Ashtavidha, Dashavidha)
- Tongue, skin, eye, nail observations
- Auto-calculation of scores
- Assessment summary generation

### 4. Diagnosis & Treatment (`/app/admin/clinic/diagnosis/new/page.tsx`)

**Forms:**
- Ayurvedic diagnosis dropdown
- Severity selection
- Dosha/Dhatu involvement checkboxes
- Recommended treatment
- Contraindications
- Treatment plan creation

### 5. Prescription Writing (`/app/admin/clinic/prescription/new/page.tsx`)

**Interface:**
- Prescription header form
- Medicine search & add
- Dosage/frequency/duration entry
- Therapy recommendations
- Diet & lifestyle advice
- Special instructions
- PDF preview
- Print/email/send to pharmacy

### 6. Treatment Plan (`/app/admin/clinic/treatment-plan/[planId]/page.tsx`)

**Display:**
- Plan overview
- Phase tracking
- Progress notes
- Adjustments
- Completion marking

### 7. Follow-up Schedule (`/app/admin/clinic/follow-ups/page.tsx`)

**List:**
- Upcoming follow-ups
- Overdue follow-ups
- Completed follow-ups
- Actions: reschedule, mark complete, send reminder

### 8. Doctor Dashboard (`/app/admin/clinic/doctor-dashboard/page.tsx`)

**Dashboard:**
- Today's appointments (queue)
- Patient queue status
- Pending follow-ups
- Quick patient search
- Quick actions

---

## WEEK 4: INTEGRATION

### Pharmacy Integration

**Prescription → Pharmacy:**
```
1. Doctor writes prescription
2. Click "Send to Pharmacy"
3. Auto-create pharmacy bill with prescribed items
4. Pharmacy staff dispenses medicines
5. Auto-deduct inventory (FIFO)
6. Link pharmacy bill to patient record
```

**API Call:**
```typescript
POST /api/clinic/prescriptions/[prescriptionId]/pharmacy
// Creates bill in Phase 5 (Pharmacy)
// Links items to inv_products
// Triggers inventory deduction
```

### Billing Integration

**Visit → Invoice:**
```
1. Doctor completes visit
2. System suggests billing items (consultation rate)
3. Click "Create Invoice"
4. Auto-create invoice in Phase 6 (Billing)
5. Link to patient ledger
6. Payment collection
```

**API Call:**
```typescript
POST /api/clinic/visits/[visitId]/create-invoice
// Creates invoice in Phase 6 (Billing)
// Adds consultation charge
// Links to patient
// Notifies billing system
```

### Appointment Integration

**Follow-up → Appointment:**
```
1. Doctor schedules follow-up
2. System creates appointment
3. Patient gets reminder
4. Follow-up date auto-scheduled
```

### Inventory Integration

**Prescription → Inventory:**
```
1. Medicines in prescription linked to products
2. Availability checked
3. Inventory consumed on pharmacy bill
4. Stock auto-updated (FIFO)
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] EMRService methods
- [ ] VisitService methods
- [ ] AssessmentService calculations
- [ ] PrescriptionService PDF generation
- [ ] FollowUpService scheduling

### Integration Tests
- [ ] Create visit → Assessment → Diagnosis → Prescription
- [ ] Prescription → Pharmacy bill creation
- [ ] Visit → Invoice creation
- [ ] Follow-up → Appointment creation
- [ ] Inventory consumption

### Build Tests
- [ ] npm run build passes
- [ ] Zero TypeScript errors
- [ ] All routes compile
- [ ] All pages render
- [ ] Dark mode works
- [ ] Responsive design verified

---

## SUCCESS CRITERIA

✅ All 8 services implemented  
✅ All 20+ APIs functional  
✅ All 8 frontend pages rendering  
✅ Pharmacy integration verified  
✅ Billing integration verified  
✅ Build passing (zero errors)  
✅ Dark mode working  
✅ Responsive design verified  
✅ EMR complete for full clinical workflow  
✅ Ayurvedic terminology throughout  

---

## DEPLOYMENT

### Prerequisites
- [ ] Supabase migration applied (phase7_clinical_emr.sql)
- [ ] Environment variables configured
- [ ] All services compiled
- [ ] All APIs tested

### Deployment Steps
```bash
# 1. Build verification
npm run build

# 2. Deploy to Vercel
git push origin main

# 3. Run migrations in Supabase
# Execute: migrations/phase7_clinical_emr.sql

# 4. Test end-to-end workflow
# Create patient → Visit → Assessment → Diagnosis → Prescription → Pharmacy

# 5. Monitor logs
# Check for errors in Vercel/Supabase
```

---

## TIMELINE

- **Week 1:** Backend services (40 hours)
- **Week 2:** APIs (30 hours)
- **Week 3:** Frontend pages (40 hours)
- **Week 4:** Integration & testing (30 hours)

**Total:** ~140 hours (estimated)

**Actual development:** ~40-50 hours focused work

---

## STATUS

✅ Database schema complete  
✅ Migrations ready  
✅ Service interfaces designed  
✅ API endpoints planned  
✅ Frontend pages outlined  
✅ Integration points identified  

**Ready to start implementation.**

---

**Next Steps:**

1. Create services directory
2. Implement EMRService
3. Build VisitService
4. Create AssessmentService
5. Continue Week 1 services
6. Then start APIs
7. Then start frontend

**Let's build the clinical heart of Ayurshala ERP.**
