# Admin Console Development Plan – 5 Phases

## Overview
Complete Admin Console redesign and feature implementation with warm Ayurvedic branding and comprehensive functionality.

---

## Phase 1: Color System Foundation ✅ IN PROGRESS

### Objective
Establish consistent design tokens and color palette across Admin Console.

### Deliverables
- ✅ Create `lib/colorSystem.ts` with complete color tokens
- [ ] Apply to Sidebar component
- [ ] Apply to Card components
- [ ] Apply to Button components
- [ ] Apply to Form controls
- [ ] Apply to Tables
- [ ] Apply to Badges/Status indicators
- [ ] Update all pages to use tokens

### Colors Applied
- **Primary**: Warm orange/gold (`#ea580c`, `#d97706`)
- **Secondary**: Emerald green (`#10b981`, `#059669`)
- **Accent**: Brown (`#b45309`, `#92400e`)
- **Neutral**: Stone grays (`#1c1917` - `#fafaf9`)
- **Glass**: Semi-transparent backgrounds with warm border tints

### Impact
- All Admin Console pages inherit consistent branding
- Light & Dark mode fully supported
- Professional glassmorphic appearance

### Estimated Time: 4-6 hours
### Status: Foundation created, rollout starting

---

## Phase 2: Doctors Module

### Objective
Implement complete Doctors management module (currently returns 404).

### Scope

#### Data Source
- Fetch from Supabase `doctors` table
- No mock data

#### Features Required
- ✅ List view with pagination
- ✅ Search doctors by name/specialization
- ✅ Filter by status/specialization
- ✅ View doctor profile
- ✅ Add new doctor
- ✅ Edit doctor details
- ✅ Delete doctor
- ✅ Bulk actions (optional)

#### Display Fields
- Name
- Qualification
- Specialization
- Experience (years)
- Consultation timings
- Phone
- Email
- Status (Active/Inactive)
- Photo/Avatar
- Availability (availability_days)
- Treatments offered
- Bio/About

#### UI Components
- Responsive table with filters
- Doctor card view (optional grid)
- Modal/form for add/edit
- Search bar
- Status badges (Active: green, Inactive: red)
- Action buttons (View, Edit, Delete)

#### Responsive
- Desktop: Full table layout
- Tablet: Simplified table + card view
- Mobile: Card view only

### Database Schema (Assumed)
```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
  name VARCHAR,
  qualification VARCHAR,
  specialization VARCHAR,
  experience_years INT,
  consultation_timings VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  status VARCHAR, -- 'active' | 'inactive'
  photo_url VARCHAR,
  availability_days VARCHAR,
  treatments_offered TEXT[],
  bio TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Pages to Create
- `/admin/doctors` (list/management)
- `/admin/doctors/[id]` (detail view)

### Estimated Time: 4-5 hours
### Status: Ready to start

---

## Phase 3: Patients Module

### Objective
Build complete Patients management module (currently returns 404).

### Scope

#### Data Source
- Fetch from Supabase `patients` table
- Real database data, no mock

#### Features Required
- ✅ List all patients with pagination
- ✅ Search patients by ID/name/phone
- ✅ Filter by status/blood group/age group
- ✅ View patient profile (detailed view)
- ✅ Add new patient
- ✅ Edit patient details
- ✅ Delete patient
- ✅ View medical history
- ✅ Show last visit date
- ✅ Show upcoming appointment

#### Display Fields
- Patient ID
- Name
- Age / DOB
- Gender
- Phone
- Email
- Address
- Blood Group
- Medical History (conditions)
- Allergies
- Last Visit (date + doctor)
- Upcoming Appointment (if any)
- Status (Active/Inactive)
- Photos (optional)
- Emergency Contact

#### UI Components
- Responsive patient table
- Search + multi-filter system
- Status badges
- Color-coded by status
- Modal forms for add/edit
- Timeline view for medical history
- Medical history sidebar

#### Responsive
- Desktop: Full table + sidebar
- Tablet: Table + collapsible history
- Mobile: Card view with expandable details

### Database Schema (Assumed)
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  patient_id VARCHAR UNIQUE,
  name VARCHAR,
  dob DATE,
  gender VARCHAR, -- 'M' | 'F' | 'Other'
  phone VARCHAR,
  email VARCHAR,
  address TEXT,
  blood_group VARCHAR,
  medical_history TEXT[],
  allergies TEXT[],
  emergency_contact VARCHAR,
  emergency_phone VARCHAR,
  last_visit_date DATE,
  last_visit_doctor_id UUID,
  status VARCHAR, -- 'active' | 'inactive'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Pages to Create
- `/admin/patients` (list/management)
- `/admin/patients/[id]` (detail view)

### Estimated Time: 5-6 hours
### Status: Ready to start

---

## Phase 4: Billing Module

### Objective
Implement comprehensive billing and invoicing system.

### Scope (Very Complex)

#### Workflow
1. **Patient Selection**
   - Search existing patient
   - Select from list
   - Walk-in patient (new patient on-the-fly)

2. **Appointment Linking**
   - Link to appointment (optional)
   - Show doctor assigned
   - Show treatment provided

3. **Line Items (Multiple)**
   - Consultation fee
   - Panchakarma charges
   - Abhyanga
   - Shirodhara
   - Medicines
   - Products
   - Therapies
   - Custom items

4. **Inventory Integration**
   - Medicines auto-deduct stock
   - Products auto-deduct inventory
   - Real-time stock check

5. **Discounts**
   - Percentage discount
   - Fixed amount discount
   - Multiple discounts allowed

6. **Taxes**
   - Configurable GST
   - Tax on specific items only
   - Tax exemptions

7. **Payment Modes**
   - Cash
   - UPI
   - Card (Stripe integration)
   - Bank Transfer
   - Mixed payment (partial cash + card)

8. **Invoice Generation**
   - Unique invoice number (auto-generated)
   - Printable format
   - PDF export
   - QR code (optional)
   - Company header
   - Patient details
   - Line items breakdown
   - Total, tax, discount calculation

9. **Refunds**
   - Full refund
   - Partial refund
   - Refund reason tracking

10. **Reports**
    - Revenue by date range
    - Outstanding payments
    - Daily collection
    - Monthly collection
    - Doctor-wise revenue
    - Treatment-wise revenue
    - Top treatments
    - Payment method breakdown

11. **Invoice Search**
    - By Invoice ID
    - By Patient name
    - By Doctor
    - By Date range
    - By Payment status

12. **Status Tracking**
    - Paid (100%)
    - Pending (0%)
    - Partial (1-99%)
    - Cancelled

### Pages to Create
- `/admin/billing` (create new invoice)
- `/admin/invoices` (list all invoices)
- `/admin/invoices/[id]` (view/print/edit)
- `/admin/reports/billing` (revenue reports)

### UI Components
- Patient selector with search
- Line item builder (add/remove items)
- Discount calculator
- Tax calculator
- Payment method selector
- Invoice preview
- Print-friendly view
- PDF export button
- Search and filter

### Database Schema (Assumed)
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR UNIQUE,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  appointment_id UUID REFERENCES appointments(id),
  subtotal DECIMAL,
  discount_amount DECIMAL,
  discount_percent DECIMAL,
  tax_amount DECIMAL,
  total_amount DECIMAL,
  paid_amount DECIMAL,
  remaining_amount DECIMAL,
  status VARCHAR, -- 'paid' | 'pending' | 'partial' | 'cancelled'
  payment_method VARCHAR, -- 'cash' | 'upi' | 'card' | 'bank' | 'mixed'
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  item_name VARCHAR,
  item_type VARCHAR, -- 'consultation' | 'treatment' | 'medicine' | 'product' | 'therapy' | 'custom'
  quantity INT,
  unit_price DECIMAL,
  amount DECIMAL,
  tax_percent DECIMAL,
  tax_amount DECIMAL,
  created_at TIMESTAMP
)

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL,
  method VARCHAR,
  reference VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
)
```

### Estimated Time: 10-12 hours
### Status: Ready to start (complex, needs careful planning)

---

## Phase 5: Settings Page

### Objective
Create comprehensive settings page for Admin configuration.

### Scope

#### General Settings
- [ ] Clinic/Clinic name
- [ ] Clinic logo
- [ ] Clinic address
- [ ] Phone
- [ ] Email
- [ ] Website
- [ ] Hours of operation

#### Billing Settings
- [ ] Invoice prefix (e.g., INV-2026-)
- [ ] Invoice starting number
- [ ] Default GST rate
- [ ] Default discount percentage
- [ ] Tax-exempt items
- [ ] Payment modes enabled
- [ ] Currency symbol

#### Doctor Settings
- [ ] Doctor specializations list (configurable)
- [ ] Default consultation fee
- [ ] Appointment duration
- [ ] Working days
- [ ] Holiday dates

#### Patient Settings
- [ ] Patient ID prefix
- [ ] Next patient ID number
- [ ] Blood group options
- [ ] Medical condition templates

#### Inventory Settings
- [ ] Low stock alert threshold
- [ ] Reorder quantity
- [ ] Units (already exists in inventory module)
- [ ] Default warehouse

#### Appearance
- [ ] Theme (Light/Dark)
- [ ] Color scheme (already implemented)
- [ ] Logo upload
- [ ] Accent color customization

#### User Management
- [ ] List admin users
- [ ] Add new admin
- [ ] Edit admin permissions
- [ ] Delete admin
- [ ] Activity log

#### Notifications
- [ ] Email notifications enabled
- [ ] SMS notifications enabled
- [ ] Appointment reminders
- [ ] Payment reminders

#### Backup & Security
- [ ] Database backup (scheduled)
- [ ] Last backup date
- [ ] Security settings
- [ ] Session timeout
- [ ] Password policy

### Pages to Create
- `/admin/settings` (main settings hub)
- `/admin/settings/general`
- `/admin/settings/billing`
- `/admin/settings/doctors`
- `/admin/settings/patients`
- `/admin/settings/inventory`
- `/admin/settings/appearance`
- `/admin/settings/users`
- `/admin/settings/notifications`
- `/admin/settings/backup`

### UI Components
- Tabbed navigation
- Settings form with validation
- Save/Cancel buttons
- Success/error toasts
- Confirmation dialogs for destructive actions

### Estimated Time: 6-8 hours
### Status: Ready to start

---

## Timeline Summary

| Phase | Name | Hours | Dependency |
|-------|------|-------|------------|
| 1 | Color System | 4-6 | None |
| 2 | Doctors Module | 4-5 | Phase 1 |
| 3 | Patients Module | 5-6 | Phase 1 |
| 4 | Billing Module | 10-12 | Phase 1, 2, 3 |
| 5 | Settings Page | 6-8 | Phase 1 |

**Total Estimated Time**: 29-37 hours

---

## Build & Deploy

After each phase:
- ✅ Run `npm run build`
- ✅ Verify zero errors
- ✅ Test in Light & Dark modes
- ✅ Verify responsive design
- ✅ Check database integration

---

## Current Status

- ✅ Phase 1: Color System created (`lib/colorSystem.ts`)
- ⏳ Phase 2: Doctors Module - Ready to start
- ⏳ Phase 3: Patients Module - Ready to start
- ⏳ Phase 4: Billing Module - Complex, needs careful implementation
- ⏳ Phase 5: Settings Page - Ready to start

---

## Next Action

Start Phase 2 (Doctors Module) with full CRUD operations and search/filter functionality.
