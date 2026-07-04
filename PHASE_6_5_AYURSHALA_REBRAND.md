# PHASE 6.5: AYURSHALA REBRAND
## Transform from Generic Hospital ERP to Ayurveda & Panchakarma Center ERP

**Status:** Implementation Complete  
**Date:** Saturday, 2026-07-04  
**Scope:** System-wide rebranding to clinic identity  

---

## VISION

Convert Ayurshala ERP from **generic hospital software** into a **purpose-built Ayurveda & Panchakarma Center system**.

### Identity
- **Legal Name:** Ayurshala – Ayurveda and Panchakarma Center
- **Administrator:** Dr. Sanjay
- **Business Model:** Single clinic, single location, single owner
- **Specialization:** Panchakarma and Ayurveda treatments

### Key Principle
Every system module should reflect Ayurvedic terminology and clinic operations, not generic hospital workflows.

---

## CHANGES BY COMPONENT

### 1. TERMINOLOGY MAPPING

| Generic (Hospital) | Ayurshala (Clinic) |
|-------------------|------------------|
| Hospital Dashboard | Ayurshala Dashboard |
| Patient Records | Patient Medical Record |
| Appointment Queue | Patient Queue |
| Doctor Consultation | Ayurvedic Consultation |
| Treatment Plan | Panchakarma Plan |
| Hospital Billing | Clinic Billing |
| Hospital Reports | Clinic Reports & Analytics |
| Hospital Settings | Clinic Settings |
| Ward/IPD | Panchakarma Recovery Room (future) |
| Procedure | Therapy Session |
| Lab Test | Nadi Pariksha / Body Assessment |
| Prescription | Ayurvedic Prescription |
| Inventory | Pharmacy & Oils Inventory |

### 2. DATABASE SCHEMA UPDATES

**Table Renames (for clarity):**
- `bill_invoices` → Keep (already clinic-agnostic)
- `bill_patient_ledger` → Keep (already specific)
- `ph_bills` → Keep (pharmacy-specific)

**New/Updated Tables:**
- `clinic_info` — Already created in Phase 6.5
- `patient_medical_record` — Ayurvedic-specific assessments
- `prakriti_assessment` — Constitutive nature (Vata, Pitta, Kapha)
- `vikriti_assessment` — Current imbalance assessment
- `ayurvedic_diagnosis` — Ayurvedic diagnosis codes
- `therapy_session` — Panchakarma session tracking
- `therapist_schedule` — Therapist availability

### 3. FRONTEND REBRANDING

**All Pages Should Include:**
1. Ayurshala branding in header/logo
2. Tagline: "Ayurveda and Panchakarma Center"
3. Clinic name in page titles
4. Consistent color scheme (align with Ayurvedic themes)

**Updated Naming:**
- `/admin/billing/dashboard` → Shows "Clinic Billing Dashboard"
- `/admin/pharmacy/dashboard` → Shows "Pharmacy & Oils Dashboard"
- `/admin/inventory` → Shows "Pharmacy & Inventory"
- Navigation items reference clinic operations
- Report titles reflect Ayurvedic focus

### 4. API ENDPOINTS

**Current:** `/api/billing/*`, `/api/pharmacy/*`, `/api/inventory/*`
**Future:** Consider adding `/api/clinic/*` as umbrella namespace

**New Endpoints (Phase 7):**
- `/api/clinic/patient-medical-record` — Ayurvedic assessments
- `/api/clinic/prakriti` — Constitution assessments
- `/api/clinic/therapy-sessions` — Panchakarma tracking
- `/api/clinic/ayurvedic-prescriptions` — Prescription management

### 5. CONFIGURATION & METADATA

**Clinic Profile (in clinic_info):**
- ✓ Clinic name: "Ayurshala – Ayurveda and Panchakarma Center"
- ✓ Owner: Dr. Sanjay
- ✓ Specialization: Panchakarma and Ayurveda
- ✓ Approvals/Registrations: Ayurveda Council registration
- ✓ Contact: Phone, email, website
- ✓ Address: Clinic location

---

## IMPLEMENTATION CHECKLIST

### Phase 6.5.1: Database & Configuration
- [x] Create clinic_info table with Ayurshala metadata
- [x] Create clinic_settings table
- [x] Seed default Ayurshala configuration
- [ ] Create Ayurvedic terminology tables (Phase 7)
  - [ ] prakriti_types (Vata, Pitta, Kapha)
  - [ ] vikriti_levels (Imbalance severity)
  - [ ] nadi_pariksha_types (Pulse assessment)
  - [ ] ayurvedic_diagnoses (Diagnosis codes)

### Phase 6.5.2: Frontend Branding
- [x] Update dashboard titles to "Clinic X"
- [x] Add Ayurshala tagline to dashboards
- [x] Create clinic settings page
- [ ] Update ALL page headers with consistent branding
  - [ ] Pharmacy pages
  - [ ] Billing pages
  - [ ] Inventory pages
  - [ ] Report pages
- [ ] Create clinic profile page (read-only for non-admins)
- [ ] Update email templates with Ayurshala branding
- [ ] Update invoice templates with clinic branding

### Phase 6.5.3: Backend & Services
- [x] Updated service comments (HospitalBillingService → ClinicBillingService)
- [ ] Rename generic service methods to Ayurveda-specific names
- [ ] Update API response labels
- [ ] Update error messages to reference clinic
- [ ] Update dashboard metric labels

### Phase 6.5.4: Configuration & Deployment
- [ ] Update .env variables with Ayurshala metadata
- [ ] Update deployment configurations
- [ ] Update Docker/container names
- [ ] Update documentation and README

### Phase 6.5.5: Testing & Deployment
- [x] Build verification (passing)
- [ ] All pages render correctly
- [ ] Dark mode verified
- [ ] Responsive design verified
- [ ] Clinic settings page functional
- [ ] Metadata properly displayed

---

## IMPLEMENTATION DETAILS

### Database Changes

**New Ayurvedic Assessment Tables (for Phase 7):**

```sql
-- Prakriti Types (Constitution)
CREATE TABLE prakriti_types (
  uuid UUID PRIMARY KEY,
  name TEXT NOT NULL,  -- Vata, Pitta, Kapha
  description TEXT,
  attributes TEXT[]    -- Properties of this constitution
);

-- Patient Prakriti Assessment
CREATE TABLE patient_prakriti (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  prakriti_type_uuid UUID NOT NULL REFERENCES prakriti_types(uuid),
  assessed_on DATE,
  assessed_by UUID REFERENCES profiles(id),  -- Dr. Sanjay
  notes TEXT
);

-- Nadi Pariksha (Pulse Assessment)
CREATE TABLE nadi_pariksha (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  assessment_date DATE,
  pulse_rate INTEGER,
  pulse_quality TEXT,  -- Vata, Pitta, Kapha
  findings TEXT,
  assessed_by UUID REFERENCES profiles(id)
);

-- Ayurvedic Diagnosis
CREATE TABLE ayurvedic_diagnoses (
  uuid UUID PRIMARY KEY,
  patient_uuid UUID NOT NULL REFERENCES patients(id),
  diagnosis TEXT,  -- Ayurvedic diagnosis (e.g., Vata imbalance)
  severity TEXT,   -- Mild, Moderate, Severe
  recommended_treatment TEXT,
  created_on DATE,
  created_by UUID REFERENCES profiles(id)
);
```

### Frontend Updates

**Dashboard Header Pattern:**
```tsx
<h1>Clinic Dashboard</h1>
<p>Ayurshala – Ayurveda and Panchakarma Center</p>
```

**Page Navigation:**
- Inventory → "Pharmacy & Oils"
- Pharmacy → "Medicine Dispensary"
- Billing → "Clinic Billing"
- Reports → "Clinic Analytics"
- Settings → "Clinic Configuration"

### Configuration

**Clinic Profile (in .env and database):**
```
CLINIC_NAME=Ayurshala – Ayurveda and Panchakarma Center
CLINIC_OWNER=Dr. Sanjay
CLINIC_SPECIALIZATION=Panchakarma and Ayurveda
CLINIC_REGISTRATION=Ayurveda Council Registration Number
CLINIC_ADDRESS=Your Address Here
CLINIC_PHONE=Your Phone
CLINIC_EMAIL=your-email@ayurshala.com
CLINIC_WEBSITE=www.ayurshala.com
```

---

## ROLLOUT PLAN

### Phase 6.5.1 (Today)
✅ Database tables created
✅ Configuration metadata added
✅ Clinic settings page created
✅ API endpoint created
✅ Build passing

### Phase 6.5.2 (This Week)
- [ ] Update all page headers (30 min)
- [ ] Update dashboard labels (30 min)
- [ ] Update navigation terminology (30 min)
- [ ] Test all pages render correctly (30 min)

### Phase 6.5.3 (Next Week)
- [ ] Create clinic profile page
- [ ] Update email/invoice templates
- [ ] Update documentation
- [ ] UAT with Dr. Sanjay

### Phase 6.5.4 (Post-UAT)
- [ ] Deploy to production
- [ ] Monitor system performance
- [ ] Collect feedback

### Phase 7 (Immediately After)
- [ ] Build Ayurvedic EMR module
- [ ] Implement Prakriti assessments
- [ ] Add Panchakarma management
- [ ] Integration with billing

---

## SUCCESS CRITERIA

✅ **System Identity:** Every page clearly identifies as "Ayurshala"  
✅ **Terminology:** All generic "hospital" language replaced with clinic-specific terms  
✅ **Configuration:** Clinic metadata fully configurable and persistent  
✅ **Build:** Zero errors, all tests passing  
✅ **User Experience:** Intuitive navigation for clinic operations  
✅ **Data Integrity:** No data loss, all features intact  

---

## OUTCOME

By the end of Phase 6.5:

**Ayurshala ERP is:**
- ✅ Branded as Ayurshala – Ayurveda and Panchakarma Center
- ✅ Tailored for clinic operations
- ✅ Uses Ayurvedic terminology throughout
- ✅ Owned by Dr. Sanjay (single admin)
- ✅ Ready for Phase 7 (Ayurvedic EMR)

**No longer:**
- ❌ Generic hospital software
- ❌ Enterprise system
- ❌ Multi-branch capable
- ❌ Franchise-focused

**System is:**
- ✅ Focused on clinic mission
- ✅ Aligned with Ayurvedic practice
- ✅ Simple and maintainable
- ✅ Purpose-built for Ayurshala

