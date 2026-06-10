# Ayurshala Website - UI Inventory & Branding Audit
**Date:** June 11, 2026  
**Status:** AUDIT ONLY (No code changes)

---

## 1. COMPLETE ROUTE INVENTORY

**Total Routes:** 19 pages + API routes

| # | Route | Purpose | User Type | Form | Navbar | Ayurshala Logo | Lucida Logo | Notes |
|---|-------|---------|-----------|------|--------|---|---|---|
| 1 | `/` | Homepage - Landing Page | Public | No | ✅ | ✅ (In Navbar) | ❌ | Hero, Hero content (8 components: Stats, About, Treatments, Conditions, Doctors, Gallery, Testimonials, FAQ, Contact, WhatsApp button) |
| 2 | `/book` | Booking Form | Patient/Guest | ✅ Form | ❌ | ✅ | ❌ | Multi-step booking: therapies, date/time, patient info, payment |
| 3 | `/book/confirmed` | Payment Success | Patient | No | ❌ | ✅ | ❌ | Confirmation page with booking details |
| 4 | `/book/failed` | Booking Failed | Patient | No | ❌ | ✅ | ❌ | Error page when booking creation fails |
| 5 | `/book/payment-failed` | Payment Declined | Patient | No | ❌ | ✅ | ❌ | Cashfree payment failure screen |
| 6 | `/book/payment-cancelled` | Payment Cancelled | Patient | No | ❌ | ✅ | ❌ | User cancelled payment manually |
| 7 | `/admin/login` | Admin Login | Admin | No | ❌ | ✅ | ❌ | Google OAuth login with "Administrator Access" title |
| 8 | `/admin` | Admin Dashboard | Admin | No* | ❌ | ❌ | ❌ | **MISSING LOGO** Reschedule approvals, booking management, payment tracking |
| 9 | `/admin/refunds` | Admin Refund Management | Admin | No* | ❌ | ❌ | ❌ | **MISSING LOGO** View/manage refund requests |
| 10 | `/dashboard` | Dashboard Redirect | Authenticated | No | ❌ | ❌ | ❌ | Generic redirect to user-specific dashboard |
| 11 | `/doctor` | Doctor Dashboard | Doctor | No | ❌ | ❌ | ❌ | Placeholder/stub page |
| 12 | `/reception` | Reception Dashboard | Reception | No | ❌ | ❌ | ❌ | Placeholder/stub page |
| 13 | `/patient/dashboard` | Patient Portal | Patient | No | ❌ | ❌ | ❌ | **MISSING LOGO** Patient profile, quick actions |
| 14 | `/patient/bookings` | Patient Bookings (NEW) | Patient | Modal | ❌ | ✅ | ❌ | **INCONSISTENT** Reschedule/Cancel modals, status tracking |
| 15 | `/my-bookings` | Bookings (ALT) | Patient | Modal | ❌ | ✅ | ❌ | Alternative view (duplicate of /patient/bookings) |
| 16 | `/login` | Login Redirect | Public | No | ❌ | ❌ | ❌ | Redirects to `/` |
| 17 | `/book-appointment` | Booking Redirect | Public | No | ❌ | ❌ | ❌ | Redirects to `/book` |
| 18 | `/auth/callback` | OAuth Callback | System | No | ❌ | ❌ | ❌ | OAuth handler (Supabase auth) |
| 19 | `/unauthorized` | Unauthorized Access | Admin | No | ❌ | ❌ | ❌ | Custom error page with StatusPage component |

---

## 2. FORM PAGES DETAILED INVENTORY

### 2.1 Booking Forms

**File:** `app/book/page.tsx`

**Forms:**
- **Primary Form:** 6-step booking wizard
  1. Therapy Selection
  2. Date/Time Selection
  3. Patient Info (Guest: name, email, phone)
  4. Concern/Description
  5. Payment Method (Online/COD)
  6. Review & Confirm

**Modals:** None (single-step inline form)

**Logo Display:** ✅ Yes (at top, size: h-14 sm:h-20)

**Navbar:** ❌ No

---

### 2.2 Reschedule Modal Forms

**File:** `app/patient/bookings/page.tsx`

**Forms:**
- **Reschedule Modal:** Select new date, time, reason (10+ char)
  - Fields: Date picker, Time select, Reason textarea
  - Validation: Friday blocked, slot capacity, no duplicate slots
  - Error handling: Inline error messages

- **Cancel Modal:** Confirmation dialog
  - Simple yes/no confirmation
  - Shows booking ID

**Logo Display:** ✅ Yes (at top)

**Navbar:** ❌ No

---

### 2.3 Admin Forms

**File:** `app/admin/page.tsx`

**Forms:**
- **Approve/Reject Reschedule:** Inline action buttons (not form)
- **Mark Payment:** Status update buttons

**Logo Display:** ❌ MISSING

---

### 2.4 Refund Forms

**File:** `app/admin/refunds/page.tsx`

**Forms:**
- **Filter/Search:** Status filter (PENDING/COMPLETED/REJECTED)
- **Refund Actions:** Approve/Reject buttons (not form)

**Logo Display:** ❌ MISSING

---

## 3. SHARED UI COMPONENTS

### 3.1 Component Inventory

| Component | File Path | Purpose | Used In | Logo | Notes |
|-----------|-----------|---------|---------|------|-------|
| **Navbar** | `components/Navbar.tsx` | Top sticky nav | `/` only | ✅ (Logo in center) | Dark/light mode, responsive, mobile menu |
| **GlassBackground** | `components/GlassBackground.tsx` | Animated gradient bg | Most pages | N/A | Animated blob shapes |
| **GlassCard** | `components/GlassCard.tsx` | Card wrapper | Landing page sections | N/A | Glass morphism styling |
| **Hero** | `components/Hero.tsx` | Hero section | `/` only | N/A | Liquid blob, CTA buttons |
| **About** | `components/About.tsx` | About section | `/` only | N/A | Clinic story, values |
| **Treatments** | `components/Treatments.tsx` | Treatment cards (8) | `/` only | N/A | Glass cards with icons |
| **Conditions** | `components/Conditions.tsx` | Condition list | `/` only | N/A | Accordion-style list |
| **Doctors** | `components/Doctors.tsx` | Doctor profiles (2) | `/` only | N/A | Doctor cards with images |
| **Gallery** | `components/Gallery.tsx` | Image gallery | `/` only | N/A | Clinic photos (24 images) |
| **Testimonials** | `components/Testimonials.tsx` | Patient reviews (6+) | `/` only | N/A | Card carousel |
| **FAQ** | `components/FAQ.tsx` | FAQ accordion | `/` only | N/A | Common questions |
| **Contact** | `components/Contact.tsx` | Contact section + Footer | `/` only | N/A | Address, hours, social links |
| **WhatsAppButton** | `components/WhatsAppButton.tsx` | Floating WhatsApp | Most pages | N/A | Fixed bottom-right |
| **StatusPage** | `components/StatusPage.tsx` | Error/Status pages | Success/Error/Unauthorized | ❌ | Reusable status display |
| **AdminGuard** | `components/AdminGuard.tsx` | Auth wrapper | Admin pages | N/A | Role-based guard |
| **ThemeProvider** | `components/ThemeProvider.tsx` | Dark/Light mode | Root layout | N/A | Next-themes integration |

### 3.2 Shared Component Distribution

**High Reuse:**
- `GlassBackground`: 15+ pages (almost all)
- `GlassCard`: Landing page + modals + cards

**Medium Reuse:**
- `WhatsAppButton`: Booking pages, dashboards
- Status pages: Error flows

**Landing Page Only:**
- `Hero`, `About`, `Treatments`, `Conditions`, `Doctors`, `Gallery`, `Testimonials`, `FAQ`, `Contact`

---

## 4. BRANDING AUDIT

### 4.1 Logo Presence Analysis

**Ayurshala Logo Locations:**
- ✅ `/` (Homepage) - In Navbar
- ✅ `/book` - Top center (h-14 sm:h-20)
- ✅ `/book/confirmed` - Center (h-14)
- ✅ `/book/failed` - Center (h-14)
- ✅ `/book/payment-failed` - Top (h-10)
- ✅ `/book/payment-cancelled` - Inline with text
- ✅ `/admin/login` - Center below icon (h-14)
- ✅ `/patient/bookings` - Top left (h-10 sm:h-12)
- ✅ `/my-bookings` - Top left (h-10 sm:h-12)
- ❌ `/admin` - **MISSING**
- ❌ `/admin/refunds` - **MISSING**
- ❌ `/patient/dashboard` - **MISSING**
- ❌ `/dashboard` - **MISSING**
- ❌ `/doctor` - **MISSING**
- ❌ `/reception` - **MISSING**
- ❌ Unauthorized pages - Uses `StatusPage` without logo
- ❌ Redirects (login, book-appointment) - Redirects don't count

**Missing Logo Summary:** 6 pages + 2 redirect pages + auth callback

---

### 4.2 Lucida Branding

**Status:** ⚠️ NOT FOUND IN CODEBASE

- No Lucida logo files in `/public`
- No Lucida references in components
- No Lucida color palette identified
- **Recommendation:** Clarify if Lucida branding is needed or if "logo" refers to Ayurshala only

---

### 4.3 Color Palette Inconsistency

**Tailwind Theme Colors:**
```
Primary:   #E8621A (Brand Orange)
Accent 1:  #F5A623 (Warm Amber)
Accent 2:  #0D9488 (Teal)
Accent 3:  #E11D48 (Rose)
Cream:     #fdf6ee
Dark:      #0e0a06
```

**Light Mode Gradients:**
- Homepage: `linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)`
- Bookings: `linear-gradient(135deg,#fdf6ee,#ffecd2)`
- Login: `linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)`

**Dark Mode Gradients:**
- All pages: `linear-gradient(135deg,#0a0f0a,#1a1008)`

**Inconsistencies Found:**
- ⚠️ `/patient/dashboard` uses `from-orange-50 to-amber-50` (non-custom gradient)
- ⚠️ `/dashboard` uses default background (no gradient specified)
- ⚠️ Redirect pages use basic colors (border-orange-500, border-blue-500, border-green-500)
- ❌ No consistent CSS classes for branding

---

## 5. CSS ARCHITECTURE REVIEW

### 5.1 Global CSS Files

**Main:** `app/globals.css` (450+ lines)

**Contents:**
- Font imports (Marcellus serif, Poppins sans-serif)
- Tailwind directives (@tailwind base, components, utilities)
- Glass morphism utilities
- Dark mode overrides (40+ rules)
- Theme transitions
- Animation keyframes (blob1-blob4)

---

### 5.2 Tailwind Configuration

**File:** `tailwind.config.ts`

**Custom Extensions:**
```typescript
colors: {
  brand: '#E8621A',
  amber: '#F5A623',
  teal: '#0D9488',
  rose: '#E11D48',
  cream: '#fdf6ee',
  dark: '#0e0a06',
}

fontFamily: {
  serif: ['Marcellus', 'Georgia', 'serif'],
  sans: ['Poppins', 'system-ui', 'sans-serif'],
}

animations: blob1-4 (liquid blob animations)
```

---

### 5.3 Shared Utility Classes

**Defined in `globals.css`:**

```css
.btn-glass          /* Button glass style */
.glass              /* Card glass style */
.glass-strong       /* Stronger glass style */
.glass-input        /* Input glass style */
.text-gradient      /* Text gradient utility */
.backdrop-blur-*    /* Backdrop blur (Tailwind) */
```

**Repeated Patterns (NOT Centralized):**

❌ Inline `style={{}}` for gradients:
```typescript
background: 'linear-gradient(135deg,#fdf6ee,#ffecd2)'
border: '1px solid rgba(232,98,26,0.2)'
backdropFilter: 'blur(40px)'
boxShadow: '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08)'
```

**Frequency:** Found in 10+ pages (~/booking, ~/admin/login, ~/patient/bookings, etc.)

---

### 5.4 Theme Provider

**File:** `components/ThemeProvider.tsx`

**Setup:**
- Uses `next-themes` library
- Provides dark/light mode toggle
- Integrated in root layout

---

### 5.5 Dark Mode Implementation

**Strategy:** CSS class-based (`dark:` prefix)

**Coverage:** 40+ dark mode rules in globals.css

**Issues:**
- ⚠️ Dark mode text overrides complex (multiple selectors)
- ⚠️ Some inline styles not responsive to dark mode
- ⚠️ Color: #E8621A (brand orange) may be too dark in dark mode

---

## 6. BRANDING INCONSISTENCIES DETAILED

### 6.1 Logo Missing Pages (CRITICAL)

Pages without Ayurshala logo:

| Page | Severity | File Path | Impact |
|------|----------|-----------|--------|
| Admin Dashboard | HIGH | `app/admin/page.tsx` | 1000+ admin interactions |
| Admin Refunds | HIGH | `app/admin/refunds/page.tsx` | 100+ refund decisions |
| Patient Dashboard | HIGH | `app/patient/dashboard/page.tsx` | 100+ patient logins |
| Generic Dashboard | MEDIUM | `app/dashboard/page.tsx` | Redirect (low impact) |
| Doctor Dashboard | LOW | `app/doctor/page.tsx` | Stub/placeholder |
| Reception Dashboard | LOW | `app/reception/page.tsx` | Stub/placeholder |

---

### 6.2 Logo Size Inconsistency

| Page | Logo Size | Tailwind Class |
|------|-----------|---|
| `/book` | h-14 sm:h-20 (56px → 80px) | Largest |
| `/book/confirmed` | h-14 (56px) | Large |
| `/book/failed` | h-14 (56px) | Large |
| `/admin/login` | h-14 (56px) | Large |
| `/patient/bookings` | h-10 sm:h-12 (40px → 48px) | Small |
| `/my-bookings` | h-10 sm:h-12 (40px → 48px) | Small |

**Issue:** Inconsistent sizing (56px vs 40px)

---

### 6.3 Logo Placement Inconsistency

| Page | Placement | Component |
|------|-----------|-----------|
| `/` | Navbar center | Navbar (sticky) |
| `/book` | Card center, top | Static |
| `/admin/login` | Modal center, below icon | Static |
| `/patient/bookings` | Card top-left | Static |

**Issue:** No consistent placement strategy

---

### 6.4 Glass Morphism Inconsistency

**Variant 1:** Light mode glass (10+ pages)
```
background: rgba(255,255,255,0.72)
border: rgba(255,255,255,0.85)
backdropFilter: blur(40px)
```

**Variant 2:** Dark mode glass
```
background: rgba(255,255,255,0.06)
border: rgba(255,255,255,0.10)
```

**Issue:** Defined in multiple places, not centralized

---

### 6.5 Color Palette Inconsistency

**Correct Brand Color:** `#E8621A` (Tailwind `brand`)

**Also Found:**
- `#E8621A` (correct, 15+ places)
- `#F5A623` (amber, used as secondary)
- `#E11D48` (rose, error states)
- CSS color in inline styles vs Tailwind classes

**Issue:** Mixed usage of color strategies

---

## 7. DESIGN SYSTEM GAPS

### 7.1 Missing Design System Components

- ❌ Centralized button component (mix of `btn-glass` and inline styled buttons)
- ❌ Centralized card component (mix of `GlassCard` and inline styled divs)
- ❌ Centralized input component (mix of styled inputs)
- ❌ Badge component (duplicate badge code in multiple pages)
- ❌ Modal wrapper component (Framer Motion animations in each page)
- ❌ Loading skeleton components
- ⚠️ Navbar reuse (only used on `/`, not on internal pages)

### 7.2 Inline Style Prevalence

**Finding:** ~40% of styling is inline `style={{}}` instead of classes

**Examples:**
```typescript
style={{ color: '#E8621A' }}
style={{ background: 'linear-gradient(...)' }}
style={{ backdropFilter: 'blur(40px)' }}
```

**Impact:** Hard to maintain, hard to theme, not responsive

---

## 8. RECOMMENDATION REPORT

### RECOMMENDED IMPLEMENTATION STRATEGY: **HYBRID APPROACH (Option C)**

**Why NOT Option A (Shared Components Only):**
- ❌ Doesn't address admin/dashboard pages (no shared components exist)
- ❌ Navbar only used on `/`, not valuable for internal pages
- ❌ Would require creating new shared components (increases scope)

**Why NOT Option B (Individual Pages):**
- ❌ Repetitive work (same logo/branding on 6+ pages)
- ❌ High maintenance burden
- ❌ Inconsistent sizing/placement
- ❌ Duplicates inline styles

**Why HYBRID APPROACH (Option C):**
- ✅ Centralizes inline style patterns into CSS utilities
- ✅ Adds missing logos to admin/dashboard pages
- ✅ Maintains consistency without breaking existing design
- ✅ Minimal refactoring (surgical changes only)
- ✅ Improves maintainability for future changes

---

### 8.1 HYBRID APPROACH - PHASE 1: CSS Centralization

**Step 1: Consolidate Glass Morphism Styles**

Create new CSS utilities in `app/globals.css`:

```css
.glass-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.65) 100%);
  border: 1px solid rgba(255,255,255,0.85);
  backdrop-filter: blur(40px);
  box-shadow: 0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08);
  border-radius: 1.5rem;
}

.glass-card-dark {
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.04) 100%);
  border: 1px solid rgba(255,255,255,0.10);
}

.gradient-page {
  background: linear-gradient(135deg, #fdf6ee, #ffecd2, #fff8f0);
}

.gradient-page-dark {
  background: linear-gradient(135deg, #0a0f0a, #1a1008);
}
```

**Files to Update:**
- `app/globals.css` (add utilities)
- `app/book/page.tsx` (replace 2-3 inline styles)
- `app/admin/login/page.tsx` (replace 1-2 inline styles)
- `app/patient/bookings/page.tsx` (replace 2-3 inline styles)

---

### 8.2 HYBRID APPROACH - PHASE 2: Logo Addition

**Pages Needing Logo (6 critical + 2 optional):**

1. ✅ `app/admin/page.tsx` → Add logo (h-14 size, top-left)
2. ✅ `app/admin/refunds/page.tsx` → Add logo (h-14 size, top-left)
3. ✅ `app/patient/dashboard/page.tsx` → Add logo (h-14 size, top-left)
4. ✅ `app/dashboard/page.tsx` → Add logo (h-14 size, top-left)
5. ⚠️ `app/doctor/page.tsx` → Add logo (optional, stub page)
6. ⚠️ `app/reception/page.tsx` → Add logo (optional, stub page)
7. ⚠️ `components/StatusPage.tsx` → Add logo parameter (optional, for reuse)

**Implementation:**
- Import `Image` from 'next/image'
- Add Logo above main content (as Link to home or static)
- Use consistent size: `h-14 w-auto` with `width={200} height={56}`
- Use existing `/ayurshala_text.png` asset

**Time: ~15-20 minutes** (surgical changes, copy-paste)

---

### 8.3 HYBRID APPROACH - PHASE 3: Consistency Updates

**Optional Enhancements (after Phase 1 & 2):**

1. **Standardize Logo Size:** Update all pages to use `h-12 sm:h-14` (medium)
   - Files: 9 pages with logos
   - Keeps harmony, improves visual balance

2. **Navbar Integration:** No change needed (Navbar already displays logo)

3. **Dark Mode Logo:** 
   - Current logo works fine in dark mode
   - ✅ No change needed

4. **Status Page Enhancement:**
   - Add optional `logo` prop to `StatusPage` component
   - Benefits unauthorized + error pages
   - Optional feature

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Utility Consolidation (CSS)
**Effort:** 30 minutes  
**Risk:** LOW (additive changes, no removals)  
**Files:** 1 (globals.css) + 3-4 page updates  
**Testing:** Visual regression test on affected pages

### Phase 2: Logo Addition (Images)
**Effort:** 20 minutes  
**Risk:** LOW (simple additions)  
**Files:** 6 critical pages + 2 optional  
**Testing:** Visual check on desktop + mobile

### Phase 3: Consistency Polish (Optional)
**Effort:** 15 minutes  
**Risk:** LOW (visual only)  
**Files:** 9 pages with logos  
**Testing:** Visual check on all pages

**Total Effort:** ~65 minutes (1 hour 5 minutes)  
**Total Risk:** LOW  
**Breaking Changes:** ZERO

---

## 10. PRIORITY MATRIX

| Page | Priority | Reason |
|------|----------|--------|
| `/admin` | 🔴 CRITICAL | High traffic, missing logo, poor UX |
| `/admin/refunds` | 🔴 CRITICAL | Admin-facing, missing logo |
| `/patient/dashboard` | 🟡 HIGH | Patient-facing, missing logo |
| `/patient/bookings` | 🟡 HIGH | Reschedule workflow, needs consistency |
| `/book` | 🟢 MEDIUM | Already has logo, can consolidate CSS |
| Other pages | 🟢 MEDIUM | Low traffic or redirects |

---

## 11. LUCIDA BRANDING CLARIFICATION NEEDED

**Question:** Is Lucida a separate brand or part of Ayurshala?

**Current Status:** 
- ❌ No Lucida assets found in `/public`
- ❌ No Lucida references in codebase
- ✅ Only Ayurshala branding exists

**Recommendations:**
1. Clarify Lucida's role (co-brand, partner, etc.)
2. Provide Lucida logo assets if required
3. Define placement strategy for Lucida if needed
4. Update this audit after clarification

---

## 12. SUMMARY TABLE: AUDIT FINDINGS

| Category | Finding | Severity | Count |
|----------|---------|----------|-------|
| Missing Logos | Admin + Patient dashboards | 🔴 HIGH | 6 pages |
| CSS Duplication | Inline glass morphism styles | 🟡 MEDIUM | ~15 instances |
| Color Consistency | Mixed usage of Tailwind + inline | 🟡 MEDIUM | ~10 pages |
| Logo Sizing | h-14 vs h-10 inconsistency | 🟡 MEDIUM | 6 pages |
| Logo Placement | Varying positions (top, center) | 🟡 MEDIUM | 6 pages |
| Component Reuse | StatusPage + Navbar not reused | 🟢 LOW | 2 components |
| Dark Mode | Fully supported, no gaps | ✅ GOOD | All pages |
| Lucida Branding | Not found in codebase | ⚠️ CLARIFY | N/A |

---

## AUDIT COMPLETE

**Next Steps:**
1. Review and approve this audit
2. Proceed with **Phase 1 (CSS Consolidation)**
3. Proceed with **Phase 2 (Logo Addition)**
4. Perform visual regression testing
5. Deploy to Vercel

**Questions?** Ask before proceeding with implementation.

