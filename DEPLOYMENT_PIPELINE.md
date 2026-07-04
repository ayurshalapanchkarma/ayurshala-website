# Ayurshala Deployment Pipeline

**Philosophy**: Automate code deployment, keep database migrations deliberate  
**Principle**: Safe, reversible deployments with health checks and rollback

---

## Deployment Architecture

### Code Deployment (Automated)
```
Developer Push
    ↓
Git Push → main
    ↓
Vercel Webhook Trigger
    ↓
Lint Check (npm run lint)
    ↓
Type Check (npm run type-check)
    ↓
Build (npm run build)
    ↓
Build Passes? → Deploy to Production
    ↓
Health Check (/api/health)
    ↓
Health OK? → Release Live
    ↓
Dr. Sanjay uses updated system
```

### Database Migrations (Manual & Deliberate)
```
Developer Writes Migration
    ↓
Code Review & Testing (local/staging)
    ↓
Developer Executes Manually in Supabase
    ↓
Verify in Production (run checks)
    ↓
Application Code Uses New Schema
    ↓
Monitor for Issues
```

**Key Principle**: Code deploys automatically. Schema changes are deliberate, manual steps.

---

## Step 1: Vercel Automatic Deployment Setup

### Configuration

**File**: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role"
  },
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### Environment Variables (Vercel Dashboard)

**Production Environment**:
```
NEXT_PUBLIC_SUPABASE_URL = [production-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [production-key]
SUPABASE_SERVICE_ROLE_KEY = [production-service-role]
```

**Preview Environment**:
```
NEXT_PUBLIC_SUPABASE_URL = [staging-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [staging-key]
SUPABASE_SERVICE_ROLE_KEY = [staging-service-role]
```

**Development** (local only, in `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL = [local-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [local-key]
SUPABASE_SERVICE_ROLE_KEY = [local-service-role]
```

### Workflow

```bash
# Developer makes changes
git add .
git commit -m "Sprint 1: Add patient visit workflow"

# Push to main
git push origin main

# Vercel automatically:
# 1. Pulls latest code
# 2. Runs: npm run lint
# 3. Runs: npm run type-check
# 4. Runs: npm run build
# 5. If all pass → Deploy to production
# 6. If any fail → Deployment blocked, notifications sent
```

---

## Step 2: Database Migrations (Manual)

### Workflow

Never automatically apply migrations in production. Instead:

```
1. Developer writes migration
   └─ File: migrations/sprint1_patient_visit.sql
   
2. Test migration locally
   └─ Run in local Supabase or staging
   └─ Verify schema changes work
   
3. Code review
   └─ Get approval from tech lead
   └─ Verify migration doesn't break existing queries
   
4. Manual execution in production
   └─ Supabase SQL Editor
   └─ Copy migration file
   └─ Execute (all at once, in transaction)
   
5. Verification
   └─ Run health checks
   └─ Run smoke tests
   └─ Monitor logs
   
6. Application deployment
   └─ Only AFTER migration verified
   └─ Deploy new code that uses new schema
```

### Migration Checklist

Before executing in production:

```sql
-- 1. Verify migration is idempotent
-- (safe to re-run without errors)

-- 2. Verify no breaking changes to existing tables
-- (only ADD columns, never DELETE or RENAME without deprecation)

-- 3. Verify foreign keys are correct
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

-- 4. Verify indexes are in place
SELECT indexname FROM pg_indexes
WHERE tablename = 'emr_visit';

-- 5. Verify RLS policies exist
SELECT policyname FROM pg_policies;

-- 6. Test a read query from application
SELECT * FROM emr_visit LIMIT 1;

-- 7. Test a write query
INSERT INTO emr_visit_timeline (visit_uuid, event_type, title)
VALUES (gen_random_uuid(), 'TEST', 'test') RETURNING *;
```

### Migration History

Keep a record in version control:

```
migrations/
├── sprint1_patient_visit.sql (✅ 2026-07-05, verified)
├── sprint2_consultation.sql (⏳ pending)
├── sprint3_assessment.sql (⏳ pending)
└── MIGRATION_LOG.md
```

**File**: `migrations/MIGRATION_LOG.md`

```markdown
# Migration History

## Sprint 1: Patient Visit
- **File**: sprint1_patient_visit.sql
- **Date Applied**: 2026-07-05
- **Applied By**: [Name]
- **Status**: ✅ Verified in production
- **Tables Added**: emr_visit_timeline
- **Tables Extended**: emr_visit
- **Functions**: emr_generate_visit_number, emr_calculate_bmi
- **Views**: v_todays_queue, v_doctor_queue
- **Issues**: None
- **Rollback**: Not needed (no errors)

## Sprint 2: Consultation
- **File**: sprint2_consultation.sql
- **Date Applied**: [TBD]
- **Applied By**: [TBD]
- **Status**: ⏳ Pending
```

---

## Step 3: Pre-Deployment Checks

### Local Verification (Before Pushing)

```bash
# 1. Lint check
npm run lint
# Expected: No errors

# 2. Type check
npm run type-check
# Expected: No errors

# 3. Build
npm run build
# Expected: Build succeeds, no errors in .next/

# 4. Health check (if running locally)
curl http://localhost:3000/api/health
# Expected: 200 OK, all checks pass
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "pre-push": "npm run lint && npm run type-check && npm run build",
    "health-check": "curl http://localhost:3000/api/health"
  }
}
```

### Pre-Push Hook (Optional)

**File**: `.git/hooks/pre-push` (or use husky)

```bash
#!/bin/bash
echo "Running pre-push checks..."

npm run lint || exit 1
npm run type-check || exit 1
npm run build || exit 1

echo "✅ All checks passed. Proceeding with push."
```

---

## Step 4: Health Check Endpoint

### Implementation

**File**: `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      supabase_connectivity: false,
      database_responsive: false,
      environment_variables: false,
      build_info: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        build_date: process.env.NEXT_PUBLIC_BUILD_DATE || 'unknown'
      }
    },
    status: 'healthy'
  };

  try {
    // 1. Check environment variables
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      checks.checks.environment_variables = true;
    } else {
      checks.status = 'unhealthy';
      return NextResponse.json(checks, { status: 503 });
    }

    // 2. Check Supabase connectivity
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    checks.checks.supabase_connectivity = true;

    // 3. Check database responsiveness
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (error) {
      checks.status = 'unhealthy';
      checks.checks.database_responsive = false;
      return NextResponse.json(checks, { status: 503 });
    }

    checks.checks.database_responsive = true;

    // All checks passed
    return NextResponse.json(checks, { status: 200 });
  } catch (err) {
    console.error('Health check failed:', err);
    checks.status = 'unhealthy';
    return NextResponse.json(checks, { status: 503 });
  }
}
```

### Usage

```bash
# Local
curl http://localhost:3000/api/health

# Production
curl https://ayurshala.vercel.app/api/health
```

### Response (Healthy)

```json
{
  "timestamp": "2026-07-05T00:30:00.000Z",
  "environment": "production",
  "checks": {
    "supabase_connectivity": true,
    "database_responsive": true,
    "environment_variables": true,
    "build_info": {
      "version": "sprint1-clinical-core",
      "build_date": "2026-07-05T00:25:00.000Z"
    }
  },
  "status": "healthy"
}
```

### Response (Unhealthy)

```json
{
  "timestamp": "2026-07-05T00:30:00.000Z",
  "environment": "production",
  "checks": {
    "supabase_connectivity": true,
    "database_responsive": false,
    "environment_variables": true
  },
  "status": "unhealthy"
}
```

---

## Step 5: Vercel Deployment Monitoring

### Vercel Dashboard Configuration

1. **Go to Project Settings** → Deployments
2. **Enable Automatic Rollback**:
   - Rollback on failed health check
   - Rollback URL: `https://ayurshala.vercel.app/api/health`
   - Expected status: `200`

3. **Configure Notifications**:
   - Slack integration (optional)
   - Email on deployment failure
   - Email on successful deployment

4. **Environment Variables**:
   - Production environment locked
   - Only deploy with correct credentials
   - Prevent accidental staging → production mix-up

### Deployment Status Checks

```bash
# Check deployment status
vercel status

# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback
```

---

## Step 6: Separate Environments

### Development (Local)

```bash
npm run dev
# Uses local Supabase
# .env.local: Local credentials
```

### Preview (Staging)

```
Vercel deploys to preview URL whenever:
- Pull request created
- Branch pushed to non-main branch

Uses staging database credentials (PREVIEW_* env vars)
```

### Production

```
Vercel deploys to production when:
- Code pushed to main
- All checks (lint, type-check, build) pass
- Uses production credentials
```

---

## Deployment Workflow Example

### Scenario: Sprint 1 Code Deployment

```bash
# 1. Developer finishes Sprint 1 code
git status
# modified: lib/emr/visit.service.ts
# modified: app/api/emr/visits/route.ts
# etc.

# 2. Commit changes
git add .
git commit -m "Sprint 1: Patient Visit EMR implementation

- Add VisitService with 8 core methods
- Add 7 API endpoints for visit management
- Add reception check-in page
- Add doctor queue dashboard
- Add vitals form with BMI calculation
"

# 3. Run pre-push checks
npm run lint          # ✅ Pass
npm run type-check    # ✅ Pass
npm run build         # ✅ Pass

# 4. Push to main
git push origin main

# 5. Vercel automatically:
#    - Builds application
#    - Deploys to production
#    - Runs /api/health check
#    - Live in ~3-5 minutes

# 6. Verify deployment
curl https://ayurshala.vercel.app/api/health
# ✅ Healthy
```

### Scenario: Sprint 1 Database Migration

```bash
# BEFORE code deployment, apply schema changes:

# 1. Review migration in version control
cat migrations/sprint1_patient_visit.sql

# 2. Test migration locally first
# (already done during development)

# 3. In Supabase Dashboard:
#    - SQL Editor
#    - Paste migration file
#    - Execute

# 4. Verify schema changes
SELECT * FROM emr_visit LIMIT 1;
SELECT * FROM emr_visit_timeline LIMIT 1;

# 5. Run health checks
curl https://ayurshala.vercel.app/api/health

# 6. THEN deploy application code
#    (which uses the new schema)
git push origin main
```

---

## Rollback Procedures

### Automatic Rollback (Health Check Failed)

```
Deployment detected unhealthy status
    ↓
Vercel automatically rolls back to previous version
    ↓
Previous version now live
    ↓
Alert sent (email/Slack)
    ↓
Team investigates issue
```

### Manual Rollback (If Needed)

```bash
# In Vercel Dashboard:
# 1. Deployments → find bad deployment
# 2. Click three dots → Rollback
# 3. Previous version is now live

# OR via CLI:
vercel rollback
```

### Database Rollback (If Migration Failed)

```
IF migration causes issues:

1. Identify the problem
2. Create reverse migration (carefully)
3. Apply reverse migration in Supabase
4. Fix root cause in original migration
5. Re-apply corrected migration
6. Test thoroughly before re-deploying code
```

**Backup Procedure** (Before applying migrations):

```bash
# In Supabase Dashboard:
# 1. Go to Backups
# 2. Enable automated daily backups
# 3. Before critical migrations, create manual backup
# 4. Keep 7-day retention minimum
```

---

## Continuous Deployment Checklist

### Before Each Deployment

- [ ] Code committed and pushed to main
- [ ] All tests pass (lint, type-check, build)
- [ ] No console errors during build
- [ ] Database migrations applied (if needed)
- [ ] Migration verified in staging/production
- [ ] Health check endpoint responds 200
- [ ] All environment variables set correctly
- [ ] Previous version is stable (no active issues)

### After Each Deployment

- [ ] Deployment complete (Vercel dashboard green)
- [ ] Health check passing (200 OK)
- [ ] Key workflows tested (check-in, queue, status)
- [ ] No error logs in Vercel
- [ ] Team notified via Slack (automated)
- [ ] Monitor for 30 minutes post-deployment

### If Deployment Fails

- [ ] Check build logs (Vercel dashboard)
- [ ] Identify root cause (lint, type, build, or health check)
- [ ] Fix issue locally
- [ ] Commit and push fix
- [ ] Vercel re-deploys automatically
- [ ] Verify health check passes

---

## Production Monitoring

### Key Metrics

- Deployment frequency (every 1-2 days)
- Deployment success rate (target: 100%)
- Rollback rate (target: < 5%)
- Uptime (target: 99.9%)
- Health check latency (target: < 500ms)

### Alerts

Set up notifications for:
- ❌ Deployment failure
- ❌ Health check failure
- ❌ Database unavailable
- ⚠️ High error rate (>1% of requests)
- ⚠️ High latency (>1s)

### Log Monitoring

- Vercel logs: View in Vercel dashboard
- Supabase logs: View in Supabase dashboard
- Application logs: Structured logging (timestamps, severity)

---

## Summary

### Code Deployment (Automated)
1. Developer pushes to main
2. Vercel builds automatically
3. Tests must pass (lint, type-check, build)
4. Health check must pass
5. Production updated in ~3-5 minutes
6. Automatic rollback if health check fails

### Database Migrations (Manual & Deliberate)
1. Developer writes migration
2. Test locally/staging
3. Get code review
4. Manually execute in Supabase
5. Verify schema changes
6. THEN deploy application code

### Safety Principles
- ✅ Automate what's safe (code builds)
- ✅ Keep manual what's risky (schema changes)
- ✅ Health checks verify system is working
- ✅ Automatic rollback if health fails
- ✅ Separate environments (dev, preview, production)
- ✅ Environment variables stay separate

### Result
- Safe, fast code deployments (automated)
- Careful, deliberate schema changes (manual)
- Quick rollback if anything goes wrong
- Dr. Sanjay gets updates smoothly without downtime

