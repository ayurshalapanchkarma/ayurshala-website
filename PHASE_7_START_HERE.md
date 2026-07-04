# PHASE 7: START HERE
## Ayurvedic Clinical Management System for Ayurshala

**Status:** Ready to implement  
**Start Date:** Saturday, 2026-07-04T22:25:22.196+05:30  
**Focus:** Complete Ayurvedic clinical workflows  
**Estimated Duration:** 4-5 weeks (200 hours)  

---

## WHAT YOU'RE BUILDING

**Not a generic hospital EMR.**

**An Ayurvedic Clinical Management System** specifically designed for Ayurshala's actual operations:

```
Patient Appointment
    ↓
Vitals Recording
    ↓
Ayurvedic Assessment (Prakriti/Vikriti/Nadi)
    ↓
Doctor Consultation (SOAP Notes)
    ↓
Ayurvedic Diagnosis
    ↓
Digital Prescription
    ↓
Pharmacy Dispensing (Phase 5)
    ↓
Treatment Planning (if Panchakarma)
    ↓
Daily Therapy Sessions
    ↓
Follow-up Scheduling
    ↓
Clinical Reports & Analytics
```

**Every step integrated. No duplicate data entry. Everything linked.**

---

## DATABASE: START HERE

**File:** `/migrations/phase7_clinical_emr.sql` (already created)

**11 Core Tables:**
1. `emr_patients` — Patient EMR record
2. `emr_visits` — Consultations
3. `emr_vitals` — Vital signs
4. `emr_consultation_notes` — SOAP notes
5. `emr_ayurvedic_assessment` — Prakriti/Vikriti
6. `emr_diagnosis` — Diagnosis
7. `emr_prescriptions` — Digital prescriptions
8. `emr_prescription_items` — Prescription line items
9. `emr_treatment_plans` — Panchakarma plans
10. `emr_therapy_sessions` — Daily therapy tracking
11. `emr_followups` — Follow-up scheduling
+ `emr_documents` — Patient attachments

**To deploy:**
```bash
# In Supabase console:
# 1. Copy migration/phase7_clinical_emr.sql content
# 2. Run in SQL editor
# 3. Tables created with indexes and RLS policies
```

---

## SERVICES: BUILD IN THIS ORDER

**Folder:** `/lib/inventory/`

### Week 1: Core Services (50 hours)

**Day 1-2: EMRService** (~8 hours)
```typescript
// /lib/inventory/emr-service.ts
export class EMRService {
  static async createPatientEMR(patientId, data, userId)
  static async getPatientEMR(patientId)
  static async updatePatientEMR(patientId, data, userId)
  static async getPatientHistory(patientId)
  static async addAllergy(patientId, allergy)
  static async addChronicCondition(patientId, condition)
}
```

**Day 3-4: VisitService** (~8 hours)
```typescript
// /lib/inventory/visit-service.ts
export class VisitService {
  static async createVisit(input) // Start consultation
  static async getVisit(visitId)
  static async completeVisit(visitId, data)
  static async getTodayVisits(doctorId)
  static async getVisitHistory(patientId)
}
```

**Day 5-6: ConsultationService** (~8 hours)
```typescript
// /lib/inventory/consultation-service.ts
export class ConsultationService {
  static async createConsultationNote(input)
  static async getConsultationNote(noteId)
  static async updateSOAPNote(noteId, updates)
}
```

**Day 7-8: AyurvedicAssessmentService** (~10 hours)
```typescript
// /lib/inventory/ayurvedic-assessment-service.ts
export class AyurvedicAssessmentService {
  static async createAssessment(visitId, data)
  static async calculatePrakritVikriti(scores) // Core calculation
  static async calculateAshtavidha(findings)
  static async calculateDashavidha(findings)
  static async getAssessmentReport(assessmentId)
}
```

**Day 9-10: DiagnosisService** (~8 hours)
```typescript
// /lib/inventory/diagnosis-service.ts
export class DiagnosisService {
  static async createDiagnosis(visitId, data)
  static async getDiagnosis(diagnosisId)
  static async suggestTreatment(diagnosisId)
  static async getPatientDiagnoses(patientId)
}
```

**Day 11-12: PrescriptionService** (~10 hours) - Most complex
```typescript
// /lib/inventory/prescription-service.ts
export class PrescriptionService {
  static async createPrescription(input)
  static async addItem(prescriptionId, item)
  static async generatePrescriptionPDF(prescriptionId) // Important
  static async sendToPharmacy(prescriptionId) // Integration
  static async markDispensed(prescriptionId)
  static async emailPrescription(prescriptionId, email)
}
```

**Day 13-14: TreatmentPlanService** (~8 hours)
```typescript
// /lib/inventory/treatment-plan-service.ts
export class TreatmentPlanService {
  static async createTreatmentPlan(input) // Panchakarma plan
  static async getTreatmentPlan(planId)
  static async updatePhase(planId, phaseNumber)
  static async completePlan(planId)
  static async getActivePlans(patientId)
}
```

**Day 15-16: TherapySessionService** (~8 hours)
```typescript
// /lib/inventory/therapy-session-service.ts
export class TherapySessionService {
  static async scheduleSession(input)
  static async getSessions(planId) // Get daily sessions
  static async recordSession(sessionId, notes) // Log session
  static async markSessionCompleted(sessionId, data)
  static async getTherapistSchedule(therapistId) // Schedule
}
```

**Day 17-18: FollowUpService** (~8 hours)
```typescript
// /lib/inventory/follow-up-service.ts
export class FollowUpService {
  static async scheduleFollowUp(input)
  static async getUpcomingFollowUps(limit)
  static async markFollowUpCompleted(followUpId)
  static async getFollowUpHistory(patientId)
  static async sendReminder(followUpId) // Future: SMS/WhatsApp
}
```

**Day 19-20: ClinicalDashboardService** (~8 hours)
```typescript
// /lib/inventory/clinical-dashboard-service.ts
export class ClinicalDashboardService {
  static async getTodayMetrics() // Today's OPD, Panchakarma, revenue
  static async getOPDQueue() // Waiting patients
  static async getPanchakarmaSchedule() // Today's therapies
  static async getTodayRevenue() // Financial metrics
}
```

---

## APIs: BUILD WEEK 2 (40 hours)

**Folder:** `/app/api/clinic/`

**Day 1-2: Core EMR APIs** (~6 hours)
```typescript
// /app/api/clinic/emr/route.ts
POST   /api/clinic/emr
GET    /api/clinic/emr/[patientId]
PUT    /api/clinic/emr/[patientId]
GET    /api/clinic/emr/[patientId]/history
```

**Day 3-4: Visit APIs** (~6 hours)
```typescript
// /app/api/clinic/visits/route.ts
POST   /api/clinic/visits
GET    /api/clinic/visits
GET    /api/clinic/visits/[visitId]
POST   /api/clinic/visits/[visitId]/complete
GET    /api/clinic/visits/today
```

**Day 5: Assessment APIs** (~4 hours)
```typescript
POST   /api/clinic/assessments
GET    /api/clinic/assessments/[assessmentId]
```

**Day 6: Diagnosis APIs** (~4 hours)
```typescript
POST   /api/clinic/diagnoses
GET    /api/clinic/diagnoses/[diagnosisId]
```

**Day 7-8: Prescription APIs** (~8 hours)
```typescript
POST   /api/clinic/prescriptions
GET    /api/clinic/prescriptions/[prescriptionId]
POST   /api/clinic/prescriptions/[prescriptionId]/items
GET    /api/clinic/prescriptions/[prescriptionId]/pdf
POST   /api/clinic/prescriptions/[prescriptionId]/pharmacy
```

**Day 9-10: Treatment Plan APIs** (~6 hours)
```typescript
POST   /api/clinic/treatment-plans
GET    /api/clinic/treatment-plans/[planId]
```

**Day 11: Therapy Session APIs** (~4 hours)
```typescript
POST   /api/clinic/therapy-sessions
GET    /api/clinic/therapy-sessions/today
POST   /api/clinic/therapy-sessions/[sessionId]/complete
```

**Day 12: Follow-up APIs** (~4 hours)
```typescript
GET    /api/clinic/follow-ups/upcoming
PUT    /api/clinic/follow-ups/[followUpId]
```

**Day 13: Dashboard APIs** (~4 hours)
```typescript
GET    /api/clinic/dashboard/today
GET    /api/clinic/dashboard/opd-queue
GET    /api/clinic/dashboard/panchakarma
```

---

## FRONTEND: BUILD WEEKS 3-4 (80 hours)

**Folder:** `/app/admin/clinic/`

### Priority 1: Core Pages (Week 3)

**Day 1-2: Clinical Dashboard** (~12 hours)
```
/admin/clinic/dashboard
- Today's OPD queue
- Panchakarma schedule
- Waiting patients
- Today's revenue
- Completed consultations
```

**Day 3-4: Patient EMR Dashboard** (~12 hours)
```
/admin/clinic/patient/[patientId]
- Patient overview
- Medical history
- Allergies & conditions
- Recent diagnoses
- Active treatment plans
```

**Day 5-6: New Consultation** (~12 hours)
```
/admin/clinic/consultation/new
- Patient search
- Vitals entry
- Chief complaint
- SOAP note template
- Save consultation
```

**Day 7: Vitals Recording** (~8 hours)
```
/admin/clinic/consultation/[visitId]/vitals
- Temperature, HR, BP, RR
- Weight, height, BMI
- Graphical trends
```

**Day 8-9: Assessment Form** (~14 hours)
```
/admin/clinic/consultation/[visitId]/assessment
- Prakriti/Vikriti scoring (sliders)
- Nadi Pariksha
- Ashtavidha/Dashavidha
- Auto-calculation
- Summary generation
```

### Priority 2: Clinical Pages (Week 4)

**Day 10-11: Diagnosis** (~10 hours)
```
/admin/clinic/consultation/[visitId]/diagnosis
- Ayurvedic diagnosis
- Severity selection
- Dosha involvement
- Treatment goals
```

**Day 12-13: Prescription Writing** (~14 hours)
```
/admin/clinic/prescription/new
- Medicine search & add
- Dosage/frequency entry
- Therapy recommendations
- PDF preview
- Print/email/pharmacy
```

**Day 14-15: Treatment Plans** (~10 hours)
```
/admin/clinic/treatment-plan/[planId]
- Plan overview
- Therapy sequence
- Progress tracking
- Completion percentage
```

**Day 16-17: Therapy Calendar** (~12 hours)
```
/admin/clinic/therapy-calendar
- Weekly schedule
- Therapist assignments
- Room allocation
- Reschedule interface
```

**Day 18: Follow-ups** (~8 hours)
```
/admin/clinic/follow-ups
- Upcoming list
- Mark completed
- Reschedule
```

**Day 19: Supporting Pages** (~8 hours)
```
/admin/clinic/patient/[patientId]/timeline
/admin/clinic/patient/[patientId]/prescriptions
/admin/clinic/patient/[patientId]/documents
/admin/clinic/reports
```

---

## INTEGRATION: WEEK 5 (30 hours)

**Day 1-2: Pharmacy Integration** (~8 hours)
```
POST /api/clinic/prescriptions/[prescriptionId]/pharmacy
- Create pharmacy bill from prescription
- Link to inv_products
- Trigger inventory deduction (FIFO)
- Link back to patient record
```

**Day 3-4: Billing Integration** (~8 hours)
```
POST /api/clinic/visits/[visitId]/create-invoice
- Create invoice for consultation
- Add therapy charges
- Link to patient ledger
```

**Day 5: Appointment Integration** (~6 hours)
```
POST /api/clinic/follow-ups/[followUpId]/as-appointment
- Create appointment from follow-up
- Send reminders
```

**Day 6-7: Full Workflow Testing** (~8 hours)
```
Test: Appointment → Visit → Assessment → Diagnosis → 
Prescription → Pharmacy → Treatment Plan → Therapy Sessions
```

---

## BUILD & DEPLOY

### Verification Checklist

- [ ] npm run build passes (0 errors)
- [ ] All 40+ APIs respond correctly
- [ ] All 15 pages render
- [ ] Prescription PDF generates
- [ ] Pharmacy link works
- [ ] Billing link works
- [ ] Dark mode verified
- [ ] Responsive design verified
- [ ] End-to-end workflow tested

### Deployment

```bash
# 1. Finalize code
git add -A
git commit -m "Phase 7: Ayurvedic Clinical Management System Complete"

# 2. Build verification
npm run build

# 3. Deploy to Vercel
git push origin main

# 4. Verify in production
# Test complete workflow
```

---

## KEY PRINCIPLES FOR PHASE 7

✅ **Every feature serves Ayurshala's workflow**  
✅ **No generic hospital assumptions**  
✅ **Prakriti/Vikriti/Nadi assessment is core**  
✅ **Panchakarma session tracking is critical**  
✅ **Integration with Phase 5 & 6 is seamless**  
✅ **No manual data entry between modules**  
✅ **Dark mode on all pages**  
✅ **Responsive design for all devices**  

---

## SUCCESS METRICS

When Phase 7 is complete:

✅ Doctor can create complete patient EMR  
✅ Doctor can perform Ayurvedic assessment  
✅ Doctor can write digital prescriptions  
✅ Pharmacist receives prescription automatically  
✅ Patient medicines auto-bill and inventory auto-updates  
✅ Panchakarma therapies tracked daily  
✅ Follow-ups automatically scheduled  
✅ Clinical dashboard shows real-time metrics  
✅ Patient timeline shows complete journey  
✅ All pages dark-mode & mobile-responsive  

---

## STATUS

**Database:** ✅ Ready (migrations/phase7_clinical_emr.sql)  
**Services:** 🚀 Ready to implement  
**APIs:** 🚀 Ready to implement  
**Frontend:** 🚀 Ready to implement  
**Integration:** 🚀 Ready to implement  

---

## READY TO START?

1. **Deploy database migration** (5 min)
2. **Start Day 1: EMRService** (8 hours)
3. **Continue services** (Week 1)
4. **Build APIs** (Week 2)
5. **Build frontend** (Weeks 3-4)
6. **Integrate & test** (Week 5)
7. **Deploy to production** (Week 6)

---

**Let's build the clinical heart of Ayurshala.**

**Status: 🟢 READY TO IMPLEMENT**
