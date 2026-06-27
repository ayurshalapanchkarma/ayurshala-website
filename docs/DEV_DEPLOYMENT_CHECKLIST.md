# DEV Deployment Checklist

**Environment**: DEV (dev.ayurshalapanchakarma.com)  
**Phase**: Pre-Production Validation  
**Status**: IN PROGRESS

---

## STEP 1: Environment Setup ⏳

- [ ] Configure NEXT_PUBLIC_SUPABASE_URL (DEV project)
- [ ] Configure SUPABASE_SERVICE_ROLE_KEY (DEV)
- [ ] Generate & configure JWT_SECRET (min 32 chars)
- [ ] Generate & configure CSRF_TOKEN_SECRET (min 32 chars)
- [ ] Generate & configure SESSION_ENCRYPTION_KEY (min 32 chars)
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors

**Script**: `scripts/verify-dev-env.ts`

---

## STEP 2: Database Migrations ⏳

- [ ] Connect to DEV Supabase project
- [ ] Run all 14 phase migrations in order:
  - [ ] Phase 1: Foundation (categories, products, suppliers, units, manufacturers)
  - [ ] Phase 2: Purchase (PO, GRN, batches)
  - [ ] Phase 3: Inventory Engine (stock ledger, transactions, FIFO)
  - [ ] Phase 4: Sales & Pharmacy (sales orders, POS)
  - [ ] Phase 5: Prescriptions (RX management)
  - [ ] Phase 6: Panchakarma (treatment plans, sessions)
  - [ ] Phase 7: Finance (invoices, payments, billing)
  - [ ] Phase 8: CRM (follow-ups, communications, campaigns)
  - [ ] Phase 9: Analytics (materialized views, dashboards)
  - [ ] Phase 10: Settings (clinic config, RBAC)
  - [ ] Phase 11: HRMS (employees, payroll, attendance)
  - [ ] Phase 12: Portal (API keys, webhooks, notifications)
  - [ ] Phase 13: AI (conversations, automations, knowledge base)
  - [ ] Phase 14: Security (audit logs, session tracking)

**Script**: `scripts/validate-migrations.ts`

---

## STEP 3: Database Audit ⏳

- [ ] Verify all 40+ tables exist
- [ ] Verify all views exist
- [ ] Verify all materialized views exist
- [ ] Check foreign key constraints (no orphaned records)
- [ ] Check indexes exist for frequently queried columns
- [ ] Check triggers for audit logging
- [ ] Check RLS policies are enabled
- [ ] Verify no duplicate migrations

**Output**: `docs/DATABASE_AUDIT.md`

---

## STEP 4: Seed Development Data ⏳

- [ ] Create 200 fake patients (never use real data)
- [ ] Create 10 doctors
- [ ] Create 15 therapists
- [ ] Create 8 reception staff
- [ ] Create 5 finance staff
- [ ] Create 5 HR staff
- [ ] Create 500+ medicines inventory
- [ ] Create 120 oils
- [ ] Create 80 herbs
- [ ] Create 100 consumables
- [ ] Create 40 equipment items
- [ ] Create 50 manufacturers
- [ ] Create 40 suppliers
- [ ] Create 1000+ appointments (varied statuses)
- [ ] Create 600 prescriptions
- [ ] Create 350 treatment plans
- [ ] Create 1500 treatment sessions
- [ ] Create 250 purchase orders
- [ ] Create 250 GRNs
- [ ] Create 1200 batches
- [ ] Create 900 sales orders
- [ ] Create 900 invoices
- [ ] Create 1100 payments
- [ ] Create 500 CRM follow-ups
- [ ] Create 50 campaigns
- [ ] Create 400 feedback records
- [ ] Create 60 employees
- [ ] Create 365 days attendance logs
- [ ] Create 12 months payroll

**Constraints**:
- All relationships valid
- No orphaned records
- Realistic data (proper dates, amounts, quantities)
- Never hardcoded sensitive information

**Script**: `scripts/seed-development-data.ts` (to create)

---

## STEP 5: System Users ✅

- [ ] Create SUPER_ADMIN user
- [ ] Create ADMIN user
- [ ] Create DOCTOR user
- [ ] Create THERAPIST user
- [ ] Create RECEPTION user
- [ ] Create PHARMACIST user
- [ ] Create FINANCE user
- [ ] Create HR user
- [ ] Create PATIENT user

Each user:
- [ ] Unique login (email)
- [ ] Strong password
- [ ] Correct RBAC role
- [ ] Profile created in database
- [ ] Verified & active

**Script**: `scripts/seed-system-users.ts` ✅

**Output**: `docs/DEFAULT_USERS.md`

---

## STEP 6: Storage Configuration ⏳

- [ ] Create storage bucket: `patient-documents`
- [ ] Create storage bucket: `certificates`
- [ ] Create storage bucket: `invoices`
- [ ] Create storage bucket: `prescriptions`
- [ ] Create storage bucket: `reports`
- [ ] Create storage bucket: `employee-documents`
- [ ] Create storage bucket: `images`
- [ ] Create storage bucket: `logos`

Each bucket:
- [ ] Proper RLS policies
- [ ] Upload permission test
- [ ] Download permission test
- [ ] Signed URL generation test

---

## STEP 7: Settings Initialization ✅

- [ ] Create clinic settings (name, GST, address, etc.)
- [ ] Create payment methods (CASH, CARD, UPI, BANK_TRANSFER, WALLET)
- [ ] Create tax settings (5%, 12%, 18%, 28%)
- [ ] Create feature flags (AI, Webhooks, Analytics, etc.)
- [ ] Create working hours (all days of week)
- [ ] Create number sequences (INV, PO, GRN, RX, TP)
- [ ] Create holiday calendar (clinic holidays)
- [ ] Create branding settings (logo, colors, fonts)
- [ ] Create notification templates (all channels)
- [ ] Create roles & permissions (RBAC)

**No hardcoded values** — all from database

**Script**: `scripts/initialize-settings.ts` ✅

---

## STEP 8: Module Validation ⏳

Load every page and verify no console errors:

### Inventory Module
- [ ] Categories page
- [ ] Products page
- [ ] Suppliers page
- [ ] Units page
- [ ] Manufacturers page
- [ ] Stock report
- [ ] Expiry alerts

### Purchase Module
- [ ] Create purchase order
- [ ] View purchase orders
- [ ] Receive GRN
- [ ] View GRNs
- [ ] Batch management
- [ ] Stock transactions

### Sales & Pharmacy
- [ ] Create sale order
- [ ] Dispense medicine
- [ ] Process returns
- [ ] Sales report

### Prescriptions
- [ ] Create prescription
- [ ] Attach medicines
- [ ] Attach treatments
- [ ] View prescription

### Panchakarma
- [ ] Create treatment plan
- [ ] Schedule sessions
- [ ] Complete session
- [ ] Track progress
- [ ] Doctor review

### Finance
- [ ] Create invoice
- [ ] Record payment
- [ ] Process refund
- [ ] Revenue reports
- [ ] Collections report
- [ ] Outstanding report

### CRM
- [ ] Create follow-up
- [ ] Send reminder
- [ ] Communication log
- [ ] Patient timeline
- [ ] Feedback collection
- [ ] Campaigns

### Analytics
- [ ] Executive dashboard
- [ ] Department dashboards
- [ ] Revenue trends
- [ ] KPI tracking
- [ ] Custom reports

### HRMS
- [ ] Employee master
- [ ] Attendance
- [ ] Leave management
- [ ] Payroll
- [ ] Performance tracking

### Portal
- [ ] Patient dashboard
- [ ] Patient timeline
- [ ] Download documents
- [ ] View notifications
- [ ] Manage sessions

### AI
- [ ] Start conversation
- [ ] Send message
- [ ] Get suggestions
- [ ] Create workflow

**Verification**:
- [ ] Page loads without errors
- [ ] No console errors
- [ ] No API errors (200 status)
- [ ] Data displays correctly
- [ ] Forms work
- [ ] Buttons clickable

---

## STEP 9: Role Testing ⏳

Login as each role and verify:

### SUPER_ADMIN
- [ ] Access all modules
- [ ] View all dashboards
- [ ] Modify settings
- [ ] Manage users
- [ ] View audit logs

### ADMIN
- [ ] Access operational modules
- [ ] Modify settings
- [ ] View reports

### DOCTOR
- [ ] View patient list
- [ ] Create prescription
- [ ] View treatment plans
- [ ] Cannot access finance

### THERAPIST
- [ ] View scheduled sessions
- [ ] Complete sessions
- [ ] Update progress
- [ ] Cannot modify inventory

### RECEPTION
- [ ] Book appointments
- [ ] View calendar
- [ ] Collect payments
- [ ] Cannot modify recipes

### PHARMACIST
- [ ] View inventory
- [ ] Dispense medicines
- [ ] Process returns
- [ ] Cannot create invoices

### FINANCE
- [ ] Create invoices
- [ ] Record payments
- [ ] View financial reports
- [ ] Cannot modify treatments

### HR
- [ ] Manage employees
- [ ] Track attendance
- [ ] Process payroll
- [ ] Cannot modify inventory

### PATIENT
- [ ] View own dashboard
- [ ] View own timeline
- [ ] Cannot access admin features

**Verification**:
- [ ] Correct menus visible
- [ ] Correct permissions enforced
- [ ] Cannot access unauthorized data
- [ ] CRUD operations work for role

---

## STEP 10: End-to-End Workflow Testing ⏳

Complete workflow:
1. [ ] Patient registration (PATIENT role or RECEPTION)
2. [ ] Book appointment (RECEPTION)
3. [ ] Doctor consultation (DOCTOR)
4. [ ] Create prescription (DOCTOR)
5. [ ] Dispense medicine (PHARMACIST)
6. [ ] Create treatment plan (DOCTOR)
7. [ ] Schedule treatment (RECEPTION)
8. [ ] Complete treatment session (THERAPIST)
9. [ ] Generate invoice (FINANCE)
10. [ ] Record payment (FINANCE or RECEPTION)
11. [ ] Create follow-up (CRM)
12. [ ] Send reminder (CRM automation)
13. [ ] View analytics (ADMIN)
14. [ ] Query AI assistant (any role)

**Verification**:
- [ ] Every step succeeds
- [ ] Data integrity maintained
- [ ] No orphaned records
- [ ] Audit logs created
- [ ] Notifications triggered

---

## STEP 11: API Testing ⏳

Test every endpoint:

### HTTP Methods
- [ ] GET endpoints return 200
- [ ] POST endpoints create records
- [ ] PUT/PATCH endpoints update records
- [ ] DELETE endpoints soft-delete (is_deleted flag)

### Authentication & Authorization
- [ ] Unauthenticated requests return 401
- [ ] Invalid tokens return 401
- [ ] Unauthorized role returns 403
- [ ] Correct role returns 200

### Data Validation
- [ ] Invalid input returns 400
- [ ] Missing required fields return 400
- [ ] Type mismatch returns 400

### Pagination & Filtering
- [ ] Pagination works (limit/offset)
- [ ] Filtering works (status, date, etc.)
- [ ] Sorting works (ascending/descending)
- [ ] Search works

### Rate Limiting
- [ ] Requests under limit succeed
- [ ] Requests over limit return 429

**Output**: `docs/API_TEST_REPORT.md` (to create)

---

## STEP 12: Security Testing ⏳

- [ ] RLS policies enforced (cannot query other users' data)
- [ ] JWT validation working
- [ ] Session timeout working
- [ ] RBAC enforced correctly
- [ ] Storage permissions enforced
- [ ] API keys rotatable
- [ ] Webhook signatures valid
- [ ] Input validation preventing XSS
- [ ] Output escaping applied
- [ ] CSRF tokens working
- [ ] SQL injection prevention verified
- [ ] No sensitive data in logs
- [ ] Passwords hashed
- [ ] Audit trail complete

**Output**: `docs/SECURITY_AUDIT_REPORT.md` (to create)

---

## STEP 13: Performance Testing ⏳

Measure response times for:
- [ ] Dashboard load: < 2s
- [ ] Patient list: < 1s
- [ ] Inventory list: < 1s
- [ ] Invoice creation: < 1s
- [ ] Analytics dashboard: < 3s
- [ ] AI chat: < 5s

Measure resource usage:
- [ ] Memory: < 200MB baseline
- [ ] CPU: < 50% under normal load
- [ ] Bundle size: < 500KB (gzipped)

**Optimization needed if**:
- [ ] Dashboard > 3s
- [ ] APIs > 2s
- [ ] Memory > 300MB

---

## STEP 14: Bug Fixing ⏳

Fix all issues:
- [ ] TypeScript errors: 0
- [ ] ESLint errors: 0
- [ ] Build errors: 0
- [ ] Hydration errors: 0
- [ ] Broken routes (404): 0
- [ ] Server errors (500): 0
- [ ] Null reference errors: 0
- [ ] Slow queries (> 2s): Fixed
- [ ] Broken APIs: Fixed
- [ ] Broken UI: Fixed
- [ ] Responsive issues: Fixed
- [ ] Accessibility issues (WCAG): Fixed
- [ ] TODO comments: Resolved or documented

---

## STEP 15: Responsive Testing ⏳

Test on:
- [ ] Mobile (375px, portrait)
- [ ] Mobile (667px, landscape)
- [ ] Tablet (768px, portrait)
- [ ] Tablet (1024px, landscape)
- [ ] Laptop (1366px)
- [ ] Desktop (1920px)
- [ ] 4K (2560px)

**Verification**:
- [ ] Layout responsive
- [ ] Text readable
- [ ] Buttons clickable
- [ ] Forms functional
- [ ] Navigation accessible

---

## STEP 16: Build Validation ⏳

- [ ] `npm install` succeeds
- [ ] `npm run lint` — 0 errors
- [ ] `npm run type-check` — 0 errors
- [ ] `npm run build` — 0 errors
- [ ] Production build under 2 minutes
- [ ] No warnings in critical dependencies

---

## STEP 17: DEV Deployment ⏳

- [ ] Deploy to dev.ayurshalapanchakarma.com
- [ ] HTTPS certificate valid
- [ ] Environment variables set correctly
- [ ] Database connection works
- [ ] Storage connection works
- [ ] Authentication working
- [ ] Email service working (test)
- [ ] WhatsApp API working (test)
- [ ] SMS API working (test)
- [ ] Payment gateway (sandbox mode)
- [ ] Analytics working
- [ ] AI service working
- [ ] Health check `/health` returns 200
- [ ] Readiness check `/ready` returns 200

---

## STEP 18: User Acceptance Preparation ⏳

**Output**: `docs/UAT_CHECKLIST.md` (to create)

Include testing checklists for:
- [ ] Doctors
- [ ] Therapists
- [ ] Reception staff
- [ ] Finance staff
- [ ] HR staff
- [ ] Inventory staff
- [ ] Management

---

## STEP 19: Final Report ⏳

**Output**: `docs/DEV_DEPLOYMENT_FINAL_REPORT.md` (to create)

Include:
- [ ] Modules verified (all 12 phases)
- [ ] Database status (tables, views, indexes)
- [ ] API status (endpoints tested)
- [ ] Security status (RBAC, RLS, encryption)
- [ ] Performance status (response times, resource usage)
- [ ] Build status (TypeScript, ESLint, Next.js)
- [ ] Deployment status (DEV environment live)
- [ ] Known issues & workarounds
- [ ] Recommended improvements
- [ ] Go-live readiness

---

## SUCCESS CRITERIA ✅

DEV deployment is complete when:

- ✅ All migrations successful (no failures)
- ✅ Seed data populated (all records created)
- ✅ All modules operational (no crashes)
- ✅ All dashboards working (data displays)
- ✅ All APIs tested (200 status codes)
- ✅ RBAC verified (permission enforcement)
- ✅ Storage verified (upload/download working)
- ✅ AI verified (chat, automations)
- ✅ Analytics verified (materializing correctly)
- ✅ No build failures (TypeScript 0 errors)
- ✅ No critical bugs (P1, P2 fixed)
- ✅ DEV deployment successful (live & accessible)
- ✅ All reports generated

---

## Next Phase

1. Commit all fixes to Git
2. Push to GitHub
3. Tag release: `v1.0.0-dev`
4. Internal testing (1-2 weeks)
5. Fix issues reported
6. Then deploy to STAGING/UAT

---

**Status**: IN PROGRESS  
**Last Updated**: 2026-06-27  
**Target Completion**: 2026-07-04
