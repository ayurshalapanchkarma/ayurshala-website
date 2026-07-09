# CRITICAL BUG FIX - "supabaseKey is required" Error

## Commit Hash
```
0273871
```

---

## ROOT CAUSE IDENTIFIED

### The Problem
The create product page (`/admin/inventory/products/create`) was crashing with:
```
supabaseKey is required
```

### Why It Happened
1. **File**: `/lib/supabase-admin.ts` creates a Supabase client at **module load time** using `SUPABASE_SERVICE_ROLE_KEY`
2. **Issue**: This file was being imported into `ProductService` class
3. **Problem**: The create product page is a `'use client'` component that imported `ProductService`
4. **Result**: Browser tried to access `SUPABASE_SERVICE_ROLE_KEY` (a server-only env var), which is `undefined`
5. **Error**: Supabase client constructor threw "supabaseKey is required"

### The Code That Failed
```typescript
// lib/supabase-admin.ts
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ Undefined in browser
)

// app/admin/inventory/products/create/page.tsx
'use client'
import { ProductService } from '@/lib/inventory'  // ❌ Imports supabase-admin

export default function CreateProductPage() {
  // When page loads in browser, supabase-admin.ts module code runs
  // SUPABASE_SERVICE_ROLE_KEY is undefined → Error!
}
```

---

## THE FIX

### What Changed
**File**: `app/admin/inventory/products/create/page.tsx`

**Before**: Used direct services that initialize Supabase client
```typescript
import { ProductService, CategoryService } from '@/lib/inventory'

// This triggered server-only client in browser context ❌
const cats = await CategoryService.getCategories()
```

**After**: Use API endpoints (like the working products list page)
```typescript
// Fetch via API endpoints ✅
const catRes = await fetch('/api/inventory/categories?pageSize=1000')
const catData = await catRes.json()
setCategories(catData.data || [])

const res = await fetch('/api/inventory/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
})
```

### Why This Works
- **API endpoints are server-side** - They can safely use `SUPABASE_SERVICE_ROLE_KEY`
- **Browser makes HTTP requests** - No direct Supabase client needed
- **No module imports** - No environment variable leaking to browser
- **Follows the pattern** - Matches how the working products list page loads data

---

## VERIFICATION

### Before Fix
```
Page: /admin/inventory/products/create
Browser Console: ❌ "supabaseKey is required"
Status: BROKEN
```

### After Fix
```
Page: /admin/inventory/products/create
Browser Console: ✅ No errors
Categories Loaded: ✅ Yes
Units Loaded: ✅ Yes
Form Displays: ✅ Yes
Create Product Works: ✅ Yes
Status: FIXED
```

---

## KEY LESSON

### Environment Variables by Context

| Variable | Server-Side | Browser |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Available | ✅ Available |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Available | ✅ Available |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Available | ❌ NOT AVAILABLE |

### Safe Patterns

✅ **Good - Browser Page**:
```typescript
'use client'
export default function MyPage() {
  useEffect(() => {
    fetch('/api/my-endpoint')  // ✅ Safe - server handles auth
  }, [])
}
```

❌ **Bad - Browser Page**:
```typescript
'use client'
import { supabaseAdmin } from '@/lib/supabase-admin'  // ❌ Breaks

export default function MyPage() {
  supabaseAdmin.from('table')...  // ❌ supabaseAdmin created with undefined key
}
```

✅ **Good - API Route**:
```typescript
// app/api/my-route/route.ts
import { supabaseAdmin } from '@/lib/supabase-admin'  // ✅ Safe - server-only

export async function GET() {
  const data = await supabaseAdmin.from('table')...
  return Response.json(data)
}
```

---

## RELATED FILES TO AUDIT

Any file that imports from services using `supabaseAdmin` and is also a `'use client'` component will have the same issue:

```bash
# Find all 'use client' components
grep -r "'use client'" app/ | grep "\.tsx"

# For each, check if it imports:
grep -r "ProductService\|CategoryService\|SupplierService\|etc" app/admin/inventory

# If it does, it needs the same fix: use API endpoints instead
```

---

## DEPLOYMENT CHECKLIST

- [x] Root cause identified: server-side client in browser context
- [x] Fix applied: use API endpoints
- [x] Build passes: 0 errors
- [x] Page loads: No "supabaseKey is required" error
- [x] Categories load: Via `/api/inventory/categories`
- [x] Units load: Via `/api/inventory/units`
- [x] Create product form: Functional
- [x] POST to `/api/inventory/products`: Works

---

## STATUS

🟢 **CRITICAL BUG FIXED**

The `/admin/inventory/products/create` page now loads successfully without the "supabaseKey is required" error.

The page uses proper API endpoints for all data fetching, keeping the server-side Supabase admin client server-only.

---

**Fixed**: 2026-07-09 10:40 UTC+05:30
**Commit**: `0273871`
