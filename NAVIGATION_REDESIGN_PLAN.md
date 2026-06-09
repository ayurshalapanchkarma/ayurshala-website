# Navigation & Authentication Redesign - Implementation Plan

## Phase 1: Routes & Pages (CRITICAL)

### Patient Routes
- ✅ `/patient/dashboard` - Patient dashboard (create/update)
- ✅ `/book-appointment` - Booking entry point (rename/create)
- ✅ `/patient/bookings` - My bookings
- ✅ `/patient/profile` - Patient profile

### Admin Routes
- ✅ `/admin/login` - Admin login page (create)
- ✅ `/admin` - Admin dashboard (protected)

### Existing Routes
- ✅ `/` - Home page
- ✅ `/auth/callback` - OAuth callback

---

## Phase 2: Navbar Redesign

### New Navbar Structure
- Guest: Home | About | Treatments | Doctors | Contact | Book Appointment | Admin Login
- Patient: Home | Treatments | My Dashboard | Book Appointment | [Name ▼]
- Admin: Home | Admin Console | [Email ▼]

### Dropdowns
- Patient Dropdown: My Bookings | Profile | Logout
- Admin Dropdown: Dashboard | Refunds | Manage Bookings | Settings | Logout

### Icons (Lucide)
- Home: Home
- Book Appointment: CalendarPlus
- Admin Login: ShieldCheck
- Dashboard: LayoutDashboard
- Logout: LogOut

---

## Phase 3: Admin Login Page

New `/admin/login` page with:
- Email field
- Password field
- Login button
- Premium glassmorphism design
- Consistent with Ayurshala branding

After login:
- Validate role in database
- If ADMIN → redirect to /admin
- If PATIENT → show toast + redirect to /patient/dashboard

---

## Phase 4: Patient Dashboard (/patient/dashboard)

Replace current `/dashboard` with proper patient-specific features:
- My Bookings
- Book New Appointment (link to /book-appointment)
- Invoices
- Profile
- Logout

---

## Phase 5: Refactor Current Routes

- `/dashboard` → `/patient/dashboard`
- `/book` → `/book-appointment`
- Update all internal links
- Keep `/admin` protected with AdminGuard

---

## Implementation Order

1. **Create /admin/login page** (new)
2. **Create /patient/dashboard page** (new)
3. **Rename routes** (/book → /book-appointment)
4. **Update Navbar** (role-aware rendering)
5. **Test all flows**
6. **Deploy**

---

## Files to Create/Modify

### New Files
- `app/admin/login/page.tsx` - Admin login
- `app/patient/dashboard/page.tsx` - Patient dashboard
- `app/book-appointment/page.tsx` - Booking entry

### Modified Files
- `components/Navbar.tsx` - Role-aware navigation
- `lib/useAuth.ts` - Already good
- `components/AdminGuard.tsx` - Already good
- `app/page.tsx` - Home page (no changes needed)

### Can Keep As-Is (redirect)
- `/dashboard` → redirect to `/patient/dashboard`
- `/book` → redirect to `/book-appointment`

---

## Security Checklist

- ✅ Admin routes protected by AdminGuard
- ✅ Role validation on backend (profiles table)
- ✅ Patient cannot access /admin
- ✅ Unauthenticated user redirected to /admin/login
- ✅ Multiple Google accounts supported (role-based, not email-based)
- ✅ Session handling independent per user

---

## Responsive Design

Test at: 375px, 390px, 414px, 768px, 1024px, 1440px
- Mobile hamburger menu
- Tablet responsive tables
- Desktop full navbar
- No horizontal scrolling

---

## Estimated Implementation Time

- Admin Login Page: 15 mins
- Patient Dashboard: 15 mins
- Navbar Redesign: 20 mins
- Testing: 10 mins
- Total: ~1 hour

**Status:** Ready to start Phase 1
