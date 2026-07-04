# CLINIC-SPECIFIC REFACTORING PLAN

**Objective:** Transform the ERP from generic "hospital" terminology to **Ayurshala Panchakarma Centre** — a single-owner, single-location clinic.

**Status:** Pre-implementation audit complete. Changes ready to deploy.

---

## WHAT NEEDS TO CHANGE

### 1. **Terminology & Branding** (Search/Replace)

| Current | New | Reason |
|---------|-----|--------|
| "Hospital" | "Ayurshala" or "Clinic" | Accurate branding |
| "Hospital Billing" | "Clinic Billing" | Smaller scope |
| "Ward/IPD" | (Remove support) | Not applicable now |
| "Organization" | (Remove concept) | Single clinic only |
| "Branch" | (Remove concept) | Single location only |
| "Enterprise" | (Remove concept) | Not relevant |

### 2. **RBAC Simplification**

**Current Structure:**
- Admin, Patient, Doctor, Receptionist, Pharmacist
- Generic permissions system

**New Structure:**
```
ADMIN
  └─ Dr. Sanjay (full system access, only admin until others are onboarded)

DOCTOR
  └─ Optional: Other doctors (if they join later)

RECEPTION
  └─ Optional: Reception staff (if hired)

THERAPIST
  └─ Optional: Therapists (if hired)

PHARMACIST
  └─ Optional: Pharmacist (if hired)

PATIENT
  └─ Self-service portal (if enabled)
```

**Implementation:**
- Keep single admin (Dr. Sanjay) as default
- Other roles remain disabled until accounts are created
- No multi-level admin hierarchy
- No enterprise permissions needed

### 3. **Database Schema - What's Already Correct**

✅ **Already clinic-focused (no changes needed):**
- Phase 5 (Pharmacy): Uses `ph_*` namespace (no org_id, branch_id)
- Phase 6 (Billing): Uses `bill_*` namespace (no org_id, branch_id)
- Inventory (Phase 4): Single warehouse (already seeded as "Default Warehouse")
- Patients table: Simple patient records (no org relationships)
- Users: Based on Supabase auth (no tenant_id needed)

✅ **Warehouse already configured for single clinic:**
```sql
INSERT INTO inv_warehouses (warehouse_name, address, is_default) VALUES
  ('Ayurshala Panchakarma Centre', 'Your Address Here', TRUE);
```

### 4. **Frontend Refactoring**

| Component | Current | New |
|-----------|---------|-----|
| Logo/Branding | Generic | Ayurshala logo |
| Sidebar Title | "Admin Panel" | "Ayurshala Admin" |
| Page Headers | "Hospital Billing" | "Clinic Billing" |
| Dashboard Label | "Hospital Dashboard" | "Clinic Dashboard" |
| Settings > Organization | Generic | Single clinic (read-only) |
| User Menu | Generic names | "Dr. Sanjay (Admin)" |
| Email footers | Generic | "Ayurshala Panchakarma Centre" |
| Invoice headers | Generic | "Ayurshala Panchakarma Centre" |
| Reports > Hospital | Rename to "Clinic" | |

### 5. **API & Services Refactoring**

| File | Current | New |
|------|---------|-----|
| hospital-billing-service.ts | Generic | ayurshala-clinic-service.ts (or keep, rename in comments) |
| API paths: /api/billing/* | Keep (generic enough) | Consider /api/clinic/billing/* (optional) |
| Dashboard metric labels | "Hospital Revenue" | "Clinic Revenue" |
| Error messages | Generic | Specific to Ayurshala |

### 6. **Settings & Configuration**

**Currently hardcoded or config-based:**
- Clinic name: Should be "Ayurshala Panchakarma Centre"
- Clinic address: Should be populated
- GST number: Should be Ayurshala's GST ID
- Invoice prefix: `INV-` (clinic-specific format)
- Pharmacy prefix: `PH-` (clinic-specific format)
- Receipt footer: Can reference Ayurshala branding

**Location:** `/admin/settings` (to be created in Phase 7)
- Should be **read-only** except for Dr. Sanjay
- Clinic name, address, GST, etc. should be pre-filled

### 7. **Removed/Disabled Concepts**

❌ **Remove if present:**
- Multi-branch support code
- Organization hierarchy logic
- Franchise management code
- IPD/Ward/Bed management (for now)
- Insurance claim workflows (for now)
- Corporate/bulk billing workflows

❌ **Disable in settings:**
- Multi-location inventory
- Branch-level reporting
- Corporate admin panels

✅ **Keep & localize:**
- Inventory (single warehouse)
- Pharmacy (single location)
- Billing (single clinic)
- Patients (clinic patients only)
- Appointments (clinic appointments)
- Reports (clinic reports)

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Database & Migration (No schema changes needed)
- [x] Phase 5 schema already clinic-focused
- [x] Phase 6 schema already clinic-focused
- [x] Inventory schema already single-warehouse
- [ ] Create migration: `setup_clinic_config.sql`
  - Insert clinic metadata (name, address, GST, etc.)
  - Set Dr. Sanjay as admin user
  - Disable unnecessary roles by default

### Phase 2: Frontend Rebranding (Search/Replace + Manual)
- [ ] Replace "Hospital" → "Clinic" in all pages
- [ ] Update page titles and headers
- [ ] Update sidebar navigation labels
- [ ] Update dashboard metric labels
- [ ] Add Ayurshala branding (logo, colors)
- [ ] Update error messages to reference clinic

### Phase 3: Services & APIs (Code cleanup)
- [ ] Rename HospitalBillingService → ClinicBillingService (optional, keep if not used directly)
- [ ] Update service comments to reference Ayurshala
- [ ] Update API error messages
- [ ] Update dashboard service names

### Phase 4: Settings & Configuration
- [ ] Create clinic settings page (read-only for non-admins)
- [ ] Populate clinic metadata (pre-filled)
- [ ] Set GST, invoice prefix, etc.

### Phase 5: Testing & Deployment
- [ ] Build verification
- [ ] Dark mode check (all pages)
- [ ] Responsive design check
- [ ] Admin access verification
- [ ] Test with Dr. Sanjay account

---

## FILES TO MODIFY (Priority Order)

### High Priority (User-facing)
1. `/app/admin/layout.tsx` — Sidebar branding
2. `/app/admin/pharmacy/dashboard/page.tsx` — Dashboard labels
3. `/app/admin/billing/dashboard/page.tsx` — Dashboard labels
4. `/app/admin/pharmacy/pos/page.tsx` — POS labels
5. `/app/admin/billing/create-invoice/page.tsx` — Invoice labels

### Medium Priority (Business logic)
6. `/lib/inventory/hospital-billing-service.ts` — Comments only
7. `/app/api/billing/dashboard/route.ts` — Metric labels
8. `/app/api/pharmacy/dashboard/route.ts` — Metric labels

### Low Priority (Setup/Config)
9. Create `/app/admin/settings/page.tsx` — Clinic settings
10. Create migration: `setup_clinic_config.sql` — Metadata

---

## ESTIMATED EFFORT

- **Rebranding**: 1-2 hours
  - Search/replace: 30 min
  - Frontend updates: 45 min
  - Testing: 30 min

- **Database setup**: 30 min
  - Create clinic config table (optional)
  - Seed clinic metadata
  - Set admin user

- **Testing**: 30 min
  - Build verification
  - Dark mode check
  - Responsive check

**Total:** ~3 hours

---

## POST-REFACTORING

### Immediate (Before Phase 7)
1. ✅ Build verification (npm run build)
2. ✅ Test admin login (Dr. Sanjay)
3. ✅ Verify all pages render
4. ✅ Verify dark mode works
5. ✅ Verify responsive design

### Before Deployment
1. Update clinic name, address, GST in settings
2. Update invoice templates with Ayurshala branding
3. Update email footers
4. Test full workflow: Inventory → Pharmacy → Billing

### Phase 7 Prerequisites
- ✅ Clinic branding complete
- ✅ Single admin (Dr. Sanjay) setup
- ✅ Ready for clinical workflows (EMR, consultations, therapy)

---

## OUTCOME

After this refactoring:
- ✅ ERP is branded for Ayurshala Panchakarma Centre
- ✅ Single admin (Dr. Sanjay) controls the system
- ✅ Optional roles (Reception, Therapist, Pharmacist) ready if hired
- ✅ No enterprise bloat or complexity
- ✅ Clean, focused codebase for clinic needs
- ✅ Ready for Phase 7 (EMR & Clinical Workflows)

