# CLINICAL CORE — IMPLEMENTATION GUIDE
## Week-by-week breakdown for 6-week delivery

---

## WEEK 1: BACKEND SERVICES (50 hours)

### Day 1-2: Vitals & Visits (8 hours)

**File:** `/lib/inventory/clinical-visit-service.ts`

```typescript
export class VisitService {
  // Create new visit (check-in)
  static async createVisit(patientId: string, input: {
    appointmentId?: string;
    chiefComplaint: string;
    notes?: string;
  }): Promise<Visit>
  
  // Get visit details
  static async getVisit(visitId: string): Promise<Visit>
  
  // Get patient's visit history
  static async getPatientVisits(patientId: string): Promise<Visit[]>
  
  // Complete visit (when consultation done)
  static async completeVisit(visitId: string, input: {
    summary?: string;
  }): Promise<Visit>
  
  // Get today's visits
  static async getTodayVisits(): Promise<Visit[]>
}
```

**File:** `/lib/inventory/vitals-service.ts`

```typescript
export class VitalsService {
  // Record vital signs
  static async recordVitals(visitId: string, input: {
    temperature?: number;    // Celsius
    heartRate?: number;      // BPM
    systolic?: number;       // BP systolic
    diastolic?: number;      // BP diastolic
    respiratoryRate?: number; // Breaths/min
    weight?: number;         // kg
    height?: number;         // cm
  }): Promise<Vitals>
  
  // Get patient's vital trends
  static async getVitalsTrend(patientId: string, days: number = 30): Promise<Vitals[]>
  
  // Calculate BMI
  static calculateBMI(weight: number, height: number): number
}
```

### Day 3-4: Ayurvedic Assessment (8 hours)

**File:** `/lib/inventory/ayurvedic-assessment-service.ts`

```typescript
export class AyurvedicAssessmentService {
  // Create assessment
  static async createAssessment(visitId: string, input: {
    prakritScores: {
      vata: number;
      pitta: number;
      kapha: number;
    };
    vikritScores: {
      vata: number;
      pitta: number;
      kapha: number;
    };
  }): Promise<Assessment>
  
  // Calculate Dosha dominance
  static calculateDoshaDominance(vata: number, pitta: number, kapha: number): string
  
  // Record Nadi Pariksha
  static async recordNadi(assessmentId: string, input: {
    type: 'vata' | 'pitta' | 'kapha';
    intensity: number;
    rate: number;
    quality: string;
  }): Promise<Assessment>
  
  // Record Dashavidha examination
  static async recordDashavidha(assessmentId: string, input: {
    prakrithi: string;
    vikrithi: string;
    sara: string;
    samhanana: string;
    pramana: string;
    satmya: string;
    satva: string;
    aharaSakti: string;
    vyayamaSakti: string;
    rogaBala: string;
  }): Promise<Assessment>
  
  // Record Ashtavidha examination
  static async recordAshtavidha(assessmentId: string, input: {
    nadi: string;
    jihva: string;
    mala: string;
    mutra: string;
    agni: string;
    nidra: string;
    manas: string;
    kaya: string;
  }): Promise<Assessment>
}
```

### Day 5-6: Consultation & Diagnosis (8 hours)

**File:** `/lib/inventory/consultation-service.ts`

```typescript
export class ConsultationService {
  // Create SOAP note
  static async createConsultationNote(visitId: string, input: {
    subjective: string;          // Patient's description
    objective: string;           // Examination findings
    assessment: string;          // Doctor's assessment
    plan: string;               // Treatment plan
  }): Promise<ConsultationNote>
  
  // Get consultation note
  static async getConsultationNote(consultationId: string): Promise<ConsultationNote>
  
  // Update SOAP note
  static async updateConsultationNote(consultationId: string, input: Partial<ConsultationNote>): Promise<ConsultationNote>
}
```

**File:** `/lib/inventory/diagnosis-service.ts`

```typescript
export class DiagnosisService {
  // Create diagnosis
  static async createDiagnosis(visitId: string, input: {
    ayurvedicDiagnosis: string;
    modernDiagnosis?: string;
    severity: 'mild' | 'moderate' | 'severe';
    doshaInvolvement: string[];  // e.g., ['vata', 'pitta']
    treatmentGoals: string;
    contraindications?: string;
  }): Promise<Diagnosis>
  
  // Get diagnosis
  static async getDiagnosis(diagnosisId: string): Promise<Diagnosis>
  
  // Get patient's diagnoses
  static async getPatientDiagnoses(patientId: string): Promise<Diagnosis[]>
}
```

### Day 7-8: Prescription Engine (8 hours)

**File:** `/lib/inventory/prescription-service.ts`

```typescript
export class PrescriptionService {
  // Create prescription
  static async createPrescription(visitId: string, input: {
    validity: number;  // Days valid
    notes?: string;
  }): Promise<Prescription>
  
  // Add item to prescription
  static async addItem(prescriptionId: string, input: {
    medicineId: string;
    dosage: string;
    frequency: string;
    duration?: string;
    withFood?: boolean;
    instructions?: string;
  }): Promise<PrescriptionItem>
  
  // Add therapy to prescription
  static async addTherapy(prescriptionId: string, input: {
    therapyType: string;
    frequency?: string;
    notes?: string;
  }): Promise<Prescription>
  
  // Add diet/lifestyle
  static async addDietAdvice(prescriptionId: string, advice: string): Promise<Prescription>
  
  // Generate PDF
  static async generatePDF(prescriptionId: string): Promise<Buffer>
  
  // Send to pharmacy
  static async sendToPharmacy(prescriptionId: string): Promise<PharmacyBill>
  
  // Mark dispensed
  static async markDispensed(prescriptionId: string): Promise<Prescription>
}
```

### Day 9-10: Panchakarma Services (10 hours)

**File:** `/lib/inventory/treatment-plan-service.ts`

```typescript
export class TreatmentPlanService {
  // Create treatment plan
  static async createTreatmentPlan(diagnosisId: string, input: {
    therapySequence: string[];  // e.g., ['abhyanga', 'shirodhara']
    planDuration: number;        // Days
    notes?: string;
  }): Promise<TreatmentPlan>
  
  // Get treatment plan
  static async getTreatmentPlan(planId: string): Promise<TreatmentPlan>
  
  // Get patient's active plans
  static async getActivePatientPlans(patientId: string): Promise<TreatmentPlan[]>
  
  // Update plan status
  static async updatePlanStatus(planId: string, status: 'active' | 'completed' | 'cancelled'): Promise<TreatmentPlan>
}
```

**File:** `/lib/inventory/therapy-session-service.ts`

```typescript
export class TherapySessionService {
  // Schedule therapy session
  static async scheduleSession(planId: string, input: {
    therapyType: string;
    therapistId: string;
    roomId: string;
    scheduledDate: string;
    scheduledTime: string;
  }): Promise<TherapySession>
  
  // Record session
  static async recordSession(sessionId: string, input: {
    oilsUsed: Array<{ medicineId: string; quantity: number }>;
    duration: number;  // minutes
    observations: string;
    patientResponse: string;
  }): Promise<TherapySession>
  
  // Mark session complete
  static async completeSession(sessionId: string): Promise<TherapySession>
  
  // Get therapist's daily schedule
  static async getTherapistSchedule(therapistId: string, date: string): Promise<TherapySession[]>
  
  // Get today's all sessions
  static async getTodaySessions(): Promise<TherapySession[]>
}
```

### Day 11-12: Follow-ups & Dashboard (10 hours)

**File:** `/lib/inventory/follow-up-service.ts`

```typescript
export class FollowUpService {
  // Schedule follow-up
  static async scheduleFollowUp(visitId: string, input: {
    followUpDate: string;
    reason: string;
    doctorNotes?: string;
  }): Promise<FollowUp>
  
  // Get patient's follow-ups
  static async getPatientFollowUps(patientId: string): Promise<FollowUp[]>
  
  // Get upcoming follow-ups
  static async getUpcomingFollowUps(days: number = 7): Promise<FollowUp[]>
  
  // Mark completed
  static async markFollowUpCompleted(followUpId: string): Promise<FollowUp>
  
  // Link to appointment
  static async linkToAppointment(followUpId: string, appointmentId: string): Promise<FollowUp>
}
```

**File:** `/lib/inventory/clinical-dashboard-service.ts`

```typescript
export class ClinicalDashboardService {
  // Get today's metrics
  static async getTodayMetrics(): Promise<{
    appointmentsTotal: number;
    appointmentsCompleted: number;
    appointmentsWaiting: number;
    therapySessionsScheduled: number;
    therapySessionsCompleted: number;
    followUpsPending: number;
    todayRevenue: number;
    medicinesDispensed: number;
  }>
  
  // Get OPD queue
  static async getOPDQueue(): Promise<Array<{
    patientId: string;
    patientName: string;
    appointmentTime: string;
    waitTime: number; // minutes
    status: 'waiting' | 'consulting' | 'completed';
  }>>
  
  // Get Panchakarma schedule
  static async getPanchakarmaSchedule(): Promise<TherapySession[]>
}
```

---

## WEEK 2: API ENDPOINTS (40 hours)

### Visits API (`/app/api/clinic/visits/route.ts`)
```
POST   /api/clinic/visits                 — Create visit
GET    /api/clinic/visits                 — List today's visits
GET    /api/clinic/visits/[id]            — Get visit
PUT    /api/clinic/visits/[id]            — Update visit
POST   /api/clinic/visits/[id]/complete   — Complete visit
GET    /api/clinic/visits/history/[patientId] — Get history
```

### Vitals API (`/app/api/clinic/vitals/route.ts`)
```
POST   /api/clinic/vitals                 — Record vitals
GET    /api/clinic/vitals/[id]            — Get vitals
GET    /api/clinic/vitals/trend/[patientId] — Get trend
```

### Assessments API (`/app/api/clinic/assessments/route.ts`)
```
POST   /api/clinic/assessments            — Create assessment
GET    /api/clinic/assessments/[id]       — Get assessment
POST   /api/clinic/assessments/[id]/nadi  — Record Nadi
POST   /api/clinic/assessments/[id]/dashavidha — Record Dashavidha
POST   /api/clinic/assessments/[id]/ashtavidha — Record Ashtavidha
```

### Consultations API (`/app/api/clinic/consultations/route.ts`)
```
POST   /api/clinic/consultations          — Create SOAP note
GET    /api/clinic/consultations/[id]     — Get consultation
PUT    /api/clinic/consultations/[id]     — Update consultation
```

### Diagnoses API (`/app/api/clinic/diagnoses/route.ts`)
```
POST   /api/clinic/diagnoses              — Create diagnosis
GET    /api/clinic/diagnoses/[id]         — Get diagnosis
GET    /api/clinic/diagnoses/patient/[patientId] — Get patient diagnoses
```

### Prescriptions API (`/app/api/clinic/prescriptions/route.ts`)
```
POST   /api/clinic/prescriptions          — Create prescription
GET    /api/clinic/prescriptions/[id]     — Get prescription
POST   /api/clinic/prescriptions/[id]/item — Add item
POST   /api/clinic/prescriptions/[id]/pdf — Generate PDF
POST   /api/clinic/prescriptions/[id]/send-pharmacy — Send to pharmacy
PUT    /api/clinic/prescriptions/[id]/dispensed — Mark dispensed
```

### Treatment Plans API (`/app/api/clinic/treatment-plans/route.ts`)
```
POST   /api/clinic/treatment-plans        — Create plan
GET    /api/clinic/treatment-plans/[id]   — Get plan
GET    /api/clinic/treatment-plans/patient/[patientId] — Get active plans
PUT    /api/clinic/treatment-plans/[id]   — Update plan
```

### Therapy Sessions API (`/app/api/clinic/therapy-sessions/route.ts`)
```
POST   /api/clinic/therapy-sessions       — Schedule session
GET    /api/clinic/therapy-sessions/today — Today's sessions
GET    /api/clinic/therapy-sessions/therapist/[id]/date/[date] — Therapist schedule
POST   /api/clinic/therapy-sessions/[id]/record — Record session
PUT    /api/clinic/therapy-sessions/[id]/complete — Complete session
```

### Follow-ups API (`/app/api/clinic/follow-ups/route.ts`)
```
POST   /api/clinic/follow-ups             — Schedule follow-up
GET    /api/clinic/follow-ups/patient/[patientId] — Get follow-ups
GET    /api/clinic/follow-ups/upcoming    — Get upcoming
PUT    /api/clinic/follow-ups/[id]/complete — Mark completed
```

### Dashboard API (`/app/api/clinic/dashboard/route.ts`)
```
GET    /api/clinic/dashboard/today        — Today's metrics
GET    /api/clinic/dashboard/queue        — OPD queue
GET    /api/clinic/dashboard/panchakarma  — Therapy schedule
```

---

## WEEK 3: FRONTEND - CORE PAGES (45 hours)

### Clinical Dashboard (`/app/admin/clinic/dashboard/page.tsx`)
- Real-time metrics cards (OPD, therapy, revenue)
- OPD queue table
- Today's completed consultations
- Pending follow-ups
- Auto-refresh every 30 seconds

### Patient Timeline (`/app/admin/clinic/patient/[patientId]/timeline/page.tsx`)
- Chronological visit history
- All consultations
- All prescriptions
- All therapy sessions
- Filter by type/date

### New Consultation (`/app/admin/clinic/consultation/new/page.tsx`)
- Patient search
- Chief complaint input
- Vitals entry form
- Save consultation

### Vitals Recording (`/app/admin/clinic/consultation/[visitId]/vitals/page.tsx`)
- Vital signs form
- BMI calculation
- Trend chart

### Ayurvedic Assessment (`/app/admin/clinic/consultation/[visitId]/assessment/page.tsx`)
- Prakriti scoring sliders
- Vikriti scoring sliders
- Nadi Pariksha form
- Dashavidha checklist
- Ashtavidha checklist
- Auto-calculation display

---

## WEEK 4: FRONTEND - ADVANCED PAGES (35 hours)

### Diagnosis (`/app/admin/clinic/consultation/[visitId]/diagnosis/page.tsx`)
- Ayurvedic diagnosis input
- Modern diagnosis optional
- Severity selector
- Dosha involvement checkboxes
- Treatment goals
- Save diagnosis

### Prescription (`/app/admin/clinic/prescription/new/page.tsx`)
- Create prescription
- Medicine search & add
- Dosage/frequency form
- Therapy recommendations
- Diet advice
- Preview PDF
- Print/Email/Send to pharmacy

### Panchakarma Planner (`/app/admin/clinic/treatment-plan/new/page.tsx`)
- Select therapy type(s)
- Set therapy sequence
- Set plan duration
- Assign therapist
- Allocate room
- Schedule sessions

### Therapy Calendar (`/app/admin/clinic/therapy-calendar/page.tsx`)
- Weekly calendar view
- Therapist assignments
- Room allocations
- Session times
- Patient names
- Reschedule interface

### Therapy Session (`/app/admin/clinic/therapy-session/[sessionId]/page.tsx`)
- Session details
- Oils/medicines used
- Duration input
- Observations
- Patient response
- Mark complete

---

## WEEK 5: FRONTEND - MANAGEMENT PAGES (30 hours)

### Follow-ups (`/app/admin/clinic/follow-ups/page.tsx`)
- Upcoming follow-ups list
- Overdue list
- Mark completed
- Reschedule interface
- Doctor notes view

### Consultation History (`/app/admin/clinic/patient/[patientId]/consultations/page.tsx`)
- List all patient consultations
- View/edit SOAP notes
- View diagnosis
- View prescription

### Clinical Reports (`/app/admin/clinic/reports/page.tsx`)
- Disease trends chart
- Panchakarma statistics
- Medicine consumption
- Therapist performance
- Doctor productivity
- Revenue dashboard

### EMR Documents (`/app/admin/clinic/patient/[patientId]/documents/page.tsx`)
- Upload PDFs/images
- View/download
- Search
- Filter by type

### Doctor Dashboard (`/app/admin/clinic/doctor-dashboard/page.tsx`)
- Personal metrics
- My consultations
- My revenue
- My pending follow-ups

---

## WEEK 6: INTEGRATION & TESTING (30 hours)

### Integration Tests

1. **Pharmacy Integration**
   - Write prescription
   - Send to pharmacy
   - Verify bill created
   - Verify inventory deducted

2. **Billing Integration**
   - Complete visit
   - Verify invoice created
   - Verify ledger entry added

3. **Appointment Integration**
   - Schedule follow-up
   - Verify appointment created
   - Verify in OPD queue

4. **Complete Workflow**
   - End-to-end: Appointment → Consultation → Assessment → Diagnosis → Prescription → Pharmacy → Billing → Panchakarma → Therapy → Follow-up

### QA Verification

- ✅ Dark mode on all pages
- ✅ Responsive design on all pages
- ✅ All forms have validation
- ✅ All dashboards auto-refresh
- ✅ All integrations verified
- ✅ RBAC enforced on all pages
- ✅ Build passes (0 errors)

---

## DATABASE MIGRATION

Create `/migrations/clinical_core_schema.sql`:

```sql
-- 12 core tables
CREATE TABLE emr_visits (...);
CREATE TABLE emr_vitals (...);
CREATE TABLE emr_assessments (...);
CREATE TABLE emr_diagnoses (...);
CREATE TABLE emr_prescriptions (...);
CREATE TABLE emr_prescription_items (...);
CREATE TABLE emr_treatment_plans (...);
CREATE TABLE emr_therapy_sessions (...);
CREATE TABLE emr_followups (...);
CREATE TABLE emr_documents (...);
CREATE TABLE emr_clinical_notes (...);
CREATE TABLE emr_patient_flags (...);

-- All with proper indexes, RLS, soft deletes
```

---

## GIT COMMITS

**Week 1:** `Clinical Core Week 1: Backend Services (10 services, complete)`

**Week 2:** `Clinical Core Week 2: API Endpoints (40+ endpoints, complete)`

**Week 3:** `Clinical Core Week 3: Frontend Core (5 pages, complete)`

**Week 4:** `Clinical Core Week 4: Frontend Advanced (5 pages, complete)`

**Week 5:** `Clinical Core Week 5: Frontend Management (5 pages, complete)`

**Week 6:** `Clinical Core: Complete (15 pages, 40+ APIs, 10 services, integration verified)`

---

## SUCCESS METRICS

After Week 6:

✅ 12 database tables  
✅ 10 backend services  
✅ 40+ API endpoints  
✅ 15 frontend pages  
✅ Zero duplicate data entry  
✅ All integrations working  
✅ 0 TypeScript errors  
✅ Build passing  
✅ Dark mode complete  
✅ Responsive design complete  

---

**Clinical Core: Ready to build. Start Week 1 immediately.**
