# DEV Validation Quickstart Guide

**Phase**: DEV Validation & Pre-Production  
**Duration**: 1 week  
**Goal**: Production-ready ERP in development environment

---

## Quick Commands

### 1. Install & Build
```bash
npm install
npm run lint
npm run type-check
npm run build
```

### 2. Verify DEV Environment
```bash
npx ts-node scripts/verify-dev-env.ts
```
**Checks**: Supabase connection, database, storage, auth, env vars

### 3. Validate Migrations
```bash
npx ts-node scripts/validate-migrations.ts
```
**Checks**: All tables exist, views created, indexes present

### 4. Create System Users
```bash
npx ts-node scripts/seed-system-users.ts
```
**Creates**: 9 demo users with RBAC roles  
**Output**: Login credentials for testing

### 5. Initialize Settings
```bash
npx ts-node scripts/initialize-settings.ts
```
**Creates**: Clinic config, payment methods, taxes, working hours, sequences

### 6. Run Development Server
```bash
npm run dev
```
**Opens**: http://localhost:3000

---

## Demo User Logins

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | superadmin@ayurshala.local | SuperAdmin@123456 |
| ADMIN | admin@ayurshala.local | Admin@123456 |
| DOCTOR | doctor@ayurshala.local | Doctor@123456 |
| THERAPIST | therapist@ayurshala.local | Therapist@123456 |
| RECEPTION | reception@ayurshala.local | Reception@123456 |
| PHARMACIST | pharmacist@ayurshala.local | Pharmacist@123456 |
| FINANCE | finance@ayurshala.local | Finance@123456 |
| HR | hr@ayurshala.local | HR@123456 |
| PATIENT | patient@ayurshala.local | Patient@123456 |

⚠️ **Change these passwords in production!**

---

## 19-Step Validation Checklist

### ✅ Completed
1. Verify DEV Environment
2. Database Migrations
3. Database Audit
4. Seed Development Data
5. Create System Users
6. Storage Configuration
7. Settings Initialization

### ⏳ Next Steps
8. Module Validation (load every page)
9. Role Testing (login as each role)
10. End-to-End Workflows (complete patient journey)
11. API Testing (test every endpoint)
12. Security Testing (RLS, JWT, RBAC)
13. Performance Testing (response times)
14. Bug Fixing (zero errors)
15. Responsive Testing (mobile, tablet, desktop)
16. Build Validation (npm run build)
17. DEV Deployment (deploy to dev.ayurshalapanchakarma.com)
18. UAT Preparation (role testing checklists)
19. Final Report (go/no-go decision)

**Full Checklist**: `docs/DEV_DEPLOYMENT_CHECKLIST.md`

---

## Testing Workflows

### Patient Journey E2E
```
1. Register patient (PATIENT or RECEPTION)
2. Book appointment (RECEPTION)
3. Doctor consultation (DOCTOR)
4. Create prescription (DOCTOR)
5. Dispense medicine (PHARMACIST)
6. Create treatment plan (DOCTOR)
7. Schedule treatment (RECEPTION)
8. Complete session (THERAPIST)
9. Generate invoice (FINANCE)
10. Record payment (FINANCE)
11. Create follow-up (CRM)
12. View analytics (ADMIN)
```

### Role Permission Test
```
Login as each role:
- SUPER_ADMIN → Access everything
- DOCTOR → Only clinical data
- THERAPIST → Only treatment sessions
- RECEPTION → Only appointments
- PHARMACIST → Only inventory
- FINANCE → Only invoices/payments
- HR → Only employees/payroll
- PATIENT → Only own data
```

### API Endpoint Test
```
For every endpoint:
- GET → Should return 200
- POST → Should create record
- PUT/PATCH → Should update record
- DELETE → Should soft-delete (is_deleted=true)
- Invalid role → Should return 403
- Missing auth → Should return 401
```

---

## Common Issues & Fixes

### Issue: Migration fails
**Fix**: Check Supabase SQL Editor for errors, run manually if needed

### Issue: Users can't login
**Fix**: Run `npx ts-node scripts/seed-system-users.ts` again

### Issue: Settings not showing
**Fix**: Run `npx ts-node scripts/initialize-settings.ts` again

### Issue: Storage buckets missing
**Fix**: Create manually in Supabase Storage UI

### Issue: Build fails (TypeScript errors)
**Fix**: Run `npm run type-check`, fix all errors

### Issue: Hydration errors
**Fix**: Clear `.next` folder, rebuild with `npm run build`

### Issue: API returns 500
**Fix**: Check logs in Supabase SQL Editor, verify RLS policies

---

## File Locations

| File | Purpose |
|------|---------|
| `scripts/verify-dev-env.ts` | Verify environment setup |
| `scripts/validate-migrations.ts` | Validate database schema |
| `scripts/seed-system-users.ts` | Create demo users |
| `scripts/initialize-settings.ts` | Initialize configuration |
| `docs/DEV_DEPLOYMENT_CHECKLIST.md` | Full 19-step checklist |
| `docs/DEV_VALIDATION_INITIATED.md` | Phase overview |
| `middleware.ts` | Security headers |
| `lib/security.ts` | Security utilities |
| `lib/secure-api.ts` | API response wrapper |
| `lib/logger.ts` | Structured logging |

---

## Environment Variables

**DEV Environment**: `.env.development.template` or `.env.local`

Required:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=<min 32 chars>
CSRF_TOKEN_SECRET=<min 32 chars>
SESSION_ENCRYPTION_KEY=<min 32 chars>
```

---

## Validation Success Criteria

✅ All migrations applied  
✅ All tables exist (40+)  
✅ Seed data populated  
✅ All modules operational  
✅ All dashboards working  
✅ All APIs tested (200 status)  
✅ RBAC verified  
✅ Zero TypeScript errors  
✅ Zero build errors  
✅ No critical bugs  
✅ DEV deployment successful  

---

## Next Phase: STAGING Deployment

After DEV validation passes:
1. Tag release: `v1.0.0-dev`
2. Push to GitHub
3. Internal testing (1-2 weeks)
4. Fix reported issues
5. Deploy to STAGING environment
6. User Acceptance Testing (UAT)
7. Final approval for PRODUCTION

---

## Support

**Documentation**: `docs/DEV_DEPLOYMENT_CHECKLIST.md`  
**Build Issues**: `npm run build` and check error output  
**Database Issues**: Supabase SQL Editor  
**Deployment**: Contact DevOps team

---

**Status**: Ready to begin DEV validation  
**Last Updated**: 2026-06-27  
**Target Completion**: 2026-07-04
