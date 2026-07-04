# CLINICAL CORE — START HERE

**For:** Ayurshala – Ayurveda and Panchakarma Center  
**Admin:** Dr. Sanjay  
**Status:** ✅ **Ready to implement**  
**Timeline:** 6 weeks, ~240 hours  

---

## What Is Clinical Core?

The digital patient journey from appointment to follow-up, all in one system.

```
Patient arrives for appointment
  ↓
Check-in & vitals recorded
  ↓
Ayurvedic assessment (Prakriti, Vikriti, Nadi, Pariksha)
  ↓
Doctor consultation & diagnosis
  ↓
Digital prescription created
  ↓ (auto-links to pharmacy)
Pharmacy dispenses medicine
  ↓ (auto-deducts inventory, auto-creates bill)
Patient invoice created & paid
  ↓
If Panchakarma: Treatment plan created
  ↓
Daily therapy sessions tracked (oil, duration, therapist)
  ↓
Follow-up scheduled (auto-creates appointment)
  ↓
Next appointment
```

**Every step connects to one patient record. No duplicate data entry.**

---

## Why This Matters

Right now, you have:
- ✅ Inventory (what you stock)
- ✅ Pharmacy POS (what you sell)
- ✅ Billing (what you charge)

After Clinical Core, you'll have:
- ✅ **Complete patient history** (EMR)
- ✅ **Consultation records** (SOAP notes)
- ✅ **Ayurvedic assessments** (Prakriti, Vikriti, Nadi)
- ✅ **Treatment plans** (Panchakarma tracking)
- ✅ **Daily therapy sessions** (all 15 therapy types)
- ✅ **Real-time dashboards** (today's operations)
- ✅ **Clinical analytics** (disease trends, therapy stats)
- ✅ **Complete integration** (no manual data transfer)

---

## What You Get

### 10 Digital Modules
1. Electronic Medical Record (EMR)
2. Consultation Management
3. Ayurvedic Assessment
4. Diagnosis Management
5. Digital Prescription Engine
6. Panchakarma Management
7. Therapy Calendar
8. Follow-up Management
9. Clinical Dashboard
10. Clinical Reports

### 15 Pages (Dr. Sanjay's Daily Interface)
- Clinical Dashboard — Today's operations
- Patient Timeline — Complete history
- New Consultation — Start a visit
- Vitals Recording — Track vital signs
- Ayurvedic Assessment — Prakriti/Vikriti/Nadi scoring
- Diagnosis — Record diagnosis
- Prescription Writing — Digital prescriptions
- Panchakarma Planner — Create treatment plans
- Therapy Calendar — Weekly scheduling
- Therapy Session — Record daily sessions
- Follow-ups — Manage continuity
- Clinical Reports — Analytics
- EMR Documents — Attachments
- Consultation History — Previous visits
- Doctor Dashboard — Personal metrics

### 12 Database Tables
- emr_visits
- emr_vitals
- emr_assessments
- emr_diagnoses
- emr_prescriptions
- emr_prescription_items
- emr_treatment_plans
- emr_therapy_sessions
- emr_followups
- emr_documents
- emr_clinical_notes
- emr_patient_flags

### 10 Backend Services
- VisitService
- VitalsService
- AyurvedicAssessmentService
- ConsultationService
- DiagnosisService
- PrescriptionService
- TreatmentPlanService
- TherapySessionService
- FollowUpService
- ClinicalDashboardService

### 40+ API Endpoints
- Complete CRUD for all entities
- Integration endpoints (pharmacy, billing, appointments)
- Dashboard endpoints
- Report endpoints

---

## Ayurvedic Features (Your Differentiator)

### Assessment Framework
- **Prakriti** — Constitutional type (0-100 per Dosha)
- **Vikriti** — Current imbalance (0-100 per Dosha)
- **Nadi Pariksha** — Pulse examination findings
- **Dashavidha Pariksha** — 10-fold examination (prakrithi, vikrithi, sara, samhanana, etc.)
- **Ashtavidha Pariksha** — 8-fold examination (nadi, jihva, mala, mutra, agni, nidra, manas, kaya)

### Panchakarma Tracking (15 Therapies)
- Abhyanga, Shirodhara, Pizhichil, Njavarakizhi
- Vamana, Virechana, Basti, Nasya
- Raktamokshana, Udwartana
- Kati Basti, Janu Basti, Greeva Basti
- Netra Tarpana, Karna Purana

**Per session:** Therapist, date, room, oils/medicines used, duration, observations, patient response

---

## Implementation Timeline

### Week 1: Backend Services (50 hours)
- Create 10 service files
- Implement 80+ methods
- All using real Supabase queries

### Week 2: API Endpoints (40 hours)
- Implement 40+ endpoints
- Error handling & validation
- Integration endpoints (pharmacy, billing, appointments)

### Week 3: Frontend Core (45 hours)
- 5 essential pages (dashboard, timeline, new consultation, vitals, assessment)
- Dark mode & responsive on all pages

### Week 4: Frontend Advanced (35 hours)
- 5 advanced pages (diagnosis, prescription, Panchakarma planner, therapy calendar, therapy session)

### Week 5: Frontend Management (30 hours)
- 5 management pages (follow-ups, history, reports, documents, doctor dashboard)

### Week 6: Integration & Testing (30 hours)
- End-to-end patient journey verification
- Pharmacy integration test
- Billing integration test
- Appointment integration test
- Build verification

**Total: ~240 hours (~40 hours/week for 6 weeks)**

---

## Integration Architecture

### No Duplicate Data Entry

```
Prescription → Pharmacy (auto-bill)
            → Inventory (auto-deduct FIFO)
            → Patient Ledger (auto-add)

Visit → Invoice (auto-create)
     → Patient Ledger (auto-add)

Therapy Session → Inventory (auto-deduct oils)
               → Invoice (auto-add charge)
               → Patient Ledger (auto-add)

Follow-up → Appointment (auto-create in Phase 3)
          → Patient notified
          → Doctor sees in OPD queue
```

All connected by one patient record. All automatic.

---

## Success Criteria

When Clinical Core is complete:

✅ Doctor creates complete patient EMR  
✅ Vitals recorded at each visit  
✅ Ayurvedic assessment completed digitally  
✅ Diagnosis with treatment plan created  
✅ Digital prescription generated  
✅ Prescription auto-links to pharmacy  
✅ Pharmacist receives prescription  
✅ Medicine auto-bills and inventory auto-updates  
✅ Patient invoice auto-created  
✅ Panchakarma therapies tracked daily  
✅ Treatment progress visible in real-time  
✅ Follow-ups automatically scheduled  
✅ Clinical dashboard shows today's metrics  
✅ Patient timeline shows complete journey  
✅ Reports show clinic analytics  
✅ Build passes (0 errors)  
✅ All pages dark-mode & responsive  

---

## Why This Is Different

### NOT Generic Hospital Software
- ❌ No multi-branch support
- ❌ No enterprise hierarchy
- ❌ No ward management
- ❌ No lab workflows
- ❌ No insurance claims

### AYURVEDA-FOCUSED
- ✅ Prakriti/Vikriti assessment
- ✅ Panchakarma workflow
- ✅ 15 specific therapies
- ✅ Ayurvedic diagnosis
- ✅ Dosha-based treatment

### SINGLE CLINIC OPTIMIZED
- ✅ Dr. Sanjay's workflow
- ✅ One admin, optional staff
- ✅ Simple RBAC (5 roles)
- ✅ Built for daily use
- ✅ Real-time dashboards

---

## After Clinical Core

You'll have a **complete, integrated, Ayurveda-focused clinical management system**.

### Optional: Future Modules (Can Add Later)

**Module 5: Analytics & Reports** (~3 weeks)
- Disease trends
- Panchakarma statistics
- Medicine consumption analysis
- Revenue dashboards
- Doctor productivity metrics

**Module 6: Administration** (~2 weeks)
- Clinic settings
- Backup & restore
- Audit logs
- Printer configuration

**Module 7: Optimization** (~2 weeks)
- Performance improvements
- Mobile enhancements
- Offline support
- Import/export tools

---

## Documentation

**Read these in order:**

1. **This file** — Overview (you're reading it)
2. `/CLINICAL_CORE_ROADMAP.md` — High-level design (15 pages, architecture)
3. `/CLINICAL_CORE_IMPLEMENTATION.md` — Week-by-week guide (30+ pages, detailed tasks)
4. `/AYURSHALA_ERP_STATUS.md` — Overall status (modules, timeline)

---

## Ready to Start?

### Prerequisites
- Node.js installed
- npm dependencies installed
- Supabase project configured
- Build passing (verify: `npm run build`)

### To Begin Week 1

```bash
cd /Users/ali/Documents/ayurshala-website

# Create database tables
# (Run migrations/clinical_core_schema.sql in Supabase console)

# Create services directory
mkdir -p lib/inventory/clinical

# Start implementing services (see CLINICAL_CORE_IMPLEMENTATION.md)
```

---

## Current Status

**Build:** ✅ PASSING (260+ routes, 0 errors)  
**Modules Complete:** 3 (Inventory, Pharmacy, Billing)  
**Next Module:** Clinical Core (ready to start)  
**Timeline:** 6 weeks  
**Effort:** ~240 hours  

---

## Summary

**Clinical Core is the highest-value module for Ayurshala.**

After 6 weeks of focused development, you'll have:
- Complete patient digital journey
- Ayurveda-specific workflows
- Full Panchakarma tracking
- Real-time dashboards
- Integrated system (zero duplicate entry)

**This is the software your doctors and therapists use every day.**

---

**Status: ✅ Ready to implement. Start immediately.**

---

## Quick Reference

| Item | Details |
|------|---------|
| **Timeline** | 6 weeks (240 hours) |
| **Database Tables** | 12 |
| **Backend Services** | 10 |
| **API Endpoints** | 40+ |
| **Frontend Pages** | 15 |
| **Ayurvedic Features** | Prakriti, Vikriti, Nadi, Pariksha, 15 therapies |
| **Integration** | Prescription → Pharmacy → Billing → Appointment |
| **Build Status** | ✅ Passing |
| **Next Step** | Start Week 1 (backend services) |

---

*Ayurshala – Ayurveda and Panchakarma Center*  
*Single Clinic. Fully Integrated. Ayurveda-First.*
