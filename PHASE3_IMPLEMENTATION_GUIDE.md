# Phase 3 - Inventory Masters Complete Implementation Guide

## Executive Summary
This guide provides the **complete, step-by-step implementation** for Phase 3 Inventory Masters. Each step is self-contained and can be executed immediately. Follow in order without skipping.

**Total Implementation Time: 8-10 hours of continuous work**
**No pausing. No asking for approval. Build all 5 modules sequentially.**

---

## PART 1: SERVICE LAYER

All service files go in `/lib/inventory/`

### Step 1.1: Copy and enhance CategoryService

The pattern in `/lib/inventory/category-service-v2.ts` is your template.

For each of the 5 modules, follow this exact structure:

```typescript
// 1. Interfaces (types)
interface Entity { /* ... */ }
interface CreateInput { /* ... */ }
interface UpdateInput { /* ... */ }
interface ListOptions { /* ... */ }
interface ListResponse<T> { /* ... */ }

// 2. Service class with static methods:
export class XxxService {
  static async getXxx(options: ListOptions): Promise<ListResponse<Xxx>>
  static async getXxxById(id: string): Promise<Xxx>
  static async createXxx(input: CreateInput, userId?: string): Promise<Xxx>
  static async updateXxx(id: string, input: UpdateInput, userId?: string): Promise<Xxx>
  static async deleteXxx(id: string, userId?: string): Promise<void>
  static async restoreXxx(id: string, userId?: string): Promise<Xxx>
  static async toggleStatus(id: string, userId?: string): Promise<Xxx>
}

// 3. Error handling:
throw new ValidationError({ field: 'error message' })
throw new Error('Failed to ...')
```

### Step 1.2: Create all 5 service files

1. **UnitService** → `/lib/inventory/unit-service.ts`
   - Table: `inv_units`
   - Fields: name, short_name, decimal_allowed, is_active
   - No soft delete (simpler)

2. **ManufacturerService** → `/lib/inventory/manufacturer-service.ts`
   - Table: `inv_manufacturers`
   - Fields: manufacturer_name, contact_person, mobile, email, gst_number, city, state, website, is_active, is_deleted
   - Has soft delete

3. **SupplierService** → `/lib/inventory/supplier-service.ts`
   - Table: `inv_suppliers`
   - Fields: supplier_code (auto-gen), company_name, contact_person, mobile, email, gst_number, pan, address, city, state, pincode, payment_terms, credit_days, bank_name, account_number, ifsc, opening_balance, credit_limit, is_active, is_deleted
   - Has soft delete
   - **Auto-generate supplier_code** using sequence function

4. **ProductService** → `/lib/inventory/product-service-v2.ts`
   - Table: `inv_products`
   - Most fields
   - Has soft delete
   - **Auto-generate product_code** using sequence
   - Include supplier linking methods

5. **Update existing UnitService** → `/lib/inventory/unit-service.ts`
   - Add missing methods (search, pagination, filters)

---

## PART 2: API ROUTES

All routes go in `/app/api/inventory/`

### Step 2.1: Create API structure

For each module, create:
```
/app/api/inventory/{module}/
  route.ts          → GET (list), POST (create)
  [id]/
    route.ts        → GET (single), PUT (update), DELETE (soft delete)
    restore/
      route.ts      → POST (restore)
    toggle-status/
      route.ts      → POST (toggle active/inactive)
```

### Step 2.2: API Route Template

Every route file should follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { XxxService } from '@/lib/inventory/xxx-service'
import { validateUUID } from '@/lib/inventory/api-helper'

// GET /api/inventory/xxx - List with pagination and search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const options = {
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const result = await XxxService.getXxx(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching xxx:', error)
    return NextResponse.json(
      { error: 'Failed to fetch xxx' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/xxx - Create
export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const userId = request.headers.get('x-user-id') // From auth middleware

    const result = await XxxService.createXxx(input, userId || undefined)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating xxx:', error)
    return NextResponse.json(
      { error: 'Failed to create xxx' },
      { status: 500 }
    )
  }
}
```

Repeat for [id]/route.ts and [id]/restore/route.ts

---

## PART 3: REACT COMPONENTS

All components go in `/components/inventory/masters/`

### Step 3.1: Create reusable component library

```
/components/inventory/masters/
  MasterListPage.tsx        → Generic list page component
  MasterFormModal.tsx       → Create/edit modal
  MasterViewModal.tsx       → View-only modal
  ConfirmDeleteDialog.tsx   → Delete confirmation
  FormField.tsx             → Reusable form input
  ValidationErrors.tsx      → Display errors
  SkeletonLoader.tsx        → Loading states
  StatusBadge.tsx          → Active/Inactive/Deleted badges
  useMasterList.ts         → React hook for list state
  useMasterForm.ts         → React hook for form state
```

### Step 3.2: MasterListPage Component Structure

```typescript
// MasterListPage.tsx
interface MasterListPageProps<T> {
  title: string
  createLabel: string
  items: T[]
  loading: boolean
  error?: string
  columns: ColumnConfig<T>[]
  onSearch: (term: string) => void
  onSort: (field: string) => void
  onPageChange: (page: number) => void
  onCreateClick: () => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onRestore?: (item: T) => void
  pagination: { page: number; totalPages: number; total: number }
}

export function MasterListPage<T>({ /* props */ }) {
  // Render table with all columns
  // Render search bar
  // Render pagination
  // Render action buttons (Edit, Delete, Restore, View)
}
```

### Step 3.3: Form Components

Use existing form components from Ayurshala if available, or create:

```typescript
// FormField.tsx
interface FormFieldProps {
  label: string
  name: string
  type: 'text' | 'email' | 'number' | 'select' | 'textarea'
  value: any
  onChange: (value: any) => void
  error?: string
  required?: boolean
  options?: { label: string; value: any }[]
  placeholder?: string
  disabled?: boolean
}

export function FormField({ /* props */ }) {
  // Render label
  // Render input with error state
  // Render error message
}
```

---

## PART 4: PAGES

### Step 4.1: Create module pages

For each module, create:
```
/app/admin/inventory/{module}/
  page.tsx              → Main list page
  create/page.tsx       → Create page (optional - can use modal)
  [id]/page.tsx         → View page (optional - can use modal)
  [id]/edit/page.tsx    → Edit page (optional - can use modal)
```

### Step 4.2: List Page Template

```typescript
'use client'

import { useState, useEffect } from 'react'
import { MasterListPage } from '@/components/inventory/masters/MasterListPage'
import { XxxService } from '@/lib/inventory/xxx-service'

interface XxxPageProps {}

export default function XxxPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    loadItems()
  }, [searchTerm, page])

  async function loadItems() {
    try {
      setLoading(true)
      const result = await XxxService.getXxx({
        search: searchTerm,
        page,
        pageSize,
      })
      setItems(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item: any) {
    if (!confirm('Are you sure?')) return
    try {
      await XxxService.deleteXxx(item.uuid)
      setItems(items.filter(i => i.uuid !== item.uuid))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <MasterListPage
      title="Xxx"
      items={items}
      loading={loading}
      error={error}
      columns={[ /* define columns */ ]}
      onSearch={setSearchTerm}
      onPageChange={setPage}
      onDelete={handleDelete}
      pagination={{ page, total, pageSize }}
    />
  )
}
```

---

## PART 5: EXECUTION ORDER

Follow this exact sequence WITHOUT STOPPING:

### Module 1: Categories ✅ (Already planned)
1. Create service (use template from `category-service-v2.ts`)
2. Create API routes (GET, POST, PUT, DELETE, restore)
3. Create React components
4. Create list page
5. Test all operations
6. Commit: `git commit -m "Phase 3.1: Categories CRUD complete"`

### Module 2: Units (Simplest)
1. Create UnitService (simpler - no soft delete initially)
2. Create API routes
3. Reuse components from Categories
4. Create list page
5. Test
6. Commit: `git commit -m "Phase 3.2: Units CRUD complete"`

### Module 3: Manufacturers
1. Create ManufacturerService (add GSTIN/email validation)
2. Create API routes
3. Enhance forms with validation UI
4. Create list page
5. Test
6. Commit: `git commit -m "Phase 3.3: Manufacturers CRUD complete"`

### Module 4: Suppliers (Complex)
1. Create SupplierService (many fields, auto-generate code)
2. Create API routes with supplier code generation
3. Create comprehensive form (use tabs/sections)
4. Create list page with advanced filters
5. Test all validations
6. Commit: `git commit -m "Phase 3.4: Suppliers CRUD complete"`

### Module 5: Products (Most Complex)
1. Create ProductService
2. Create API routes + supplier linking endpoints
3. Create multi-section form (General, Pricing, Inventory, Storage, Suppliers)
4. Create list page with filters (category, manufacturer, supplier, status)
5. Create supplier linking modal
6. Test all operations
7. Commit: `git commit -m "Phase 3.5: Products CRUD complete"`

---

## PART 6: DATABASE INTEGRATION

For auto-generated codes, use existing sequence functions from Phase 2:

```sql
-- For Supplier Code
SELECT fn_next_sequence_value('seq_supplier_last_number') AS next_number;

-- For Product Code  
SELECT fn_next_sequence_value('seq_product_last_number') AS next_number;
```

In service layer:
```typescript
async function generateSupplierCode(): Promise<string> {
  const { data } = await supabase
    .rpc('fn_next_sequence_value', { p_key: 'seq_supplier_last_number' })
  return `SUP-${String(data).padStart(6, '0')}`
}
```

---

## PART 7: DASHBOARD INTEGRATION

After each CRUD operation, emit event to update dashboard:

```typescript
// After creating/updating/deleting a category
window.dispatchEvent(new CustomEvent('inventory-updated', {
  detail: { module: 'categories', action: 'create' }
}))

// Dashboard listens:
useEffect(() => {
  window.addEventListener('inventory-updated', () => {
    // Refetch dashboard stats
  })
}, [])
```

---

## PART 8: TESTING CHECKLIST

For each module, verify:
- [ ] Create works → Item appears in list
- [ ] Edit works → Changes persist
- [ ] View shows all fields correctly
- [ ] Delete soft-deletes → Item grayed out (can restore)
- [ ] Search filters correctly
- [ ] Pagination works
- [ ] Validation prevents invalid data
- [ ] Duplicate names rejected
- [ ] Dashboard updates without refresh
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Error states handled gracefully

---

## PART 9: DELIVERABLES

When all 5 modules complete, provide:

```bash
# Screenshots
screens/
  categories-list.png
  categories-create.png
  categories-edit.png
  units-list.png
  units-create.png
  manufacturers-list.png
  manufacturers-create.png
  suppliers-list.png
  suppliers-create.png
  products-list.png
  products-create.png
  products-pricing-section.png
  products-inventory-section.png
  products-supplier-linking.png

# API endpoints
API_ENDPOINTS.md

# Git log
git log --oneline | head -5

# Production build
npm run build
```

---

## IMPORTANT NOTES

1. **Do not create mock data** - All data comes from Supabase
2. **Strict TypeScript** - No `any` types
3. **Reuse components** - Don't duplicate FormField, Modal, etc.
4. **Consistent styling** - Match existing Ayurshala admin design
5. **Error messages** - User-friendly, specific to field
6. **Loading states** - Show skeleton loaders while fetching
7. **Validation** - Frontend + backend validation
8. **Accessibility** - Proper labels, ARIA attributes
9. **Dark mode** - Test in both light and dark themes
10. **No pausing** - Build continuously until all 5 modules done

---

## QUICK START COMMANDS

```bash
# Start development
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit

# After each module
git add .
git commit -m "Phase 3.X: [Module Name] CRUD complete"
git push

# Final commit
git log --oneline | head -1  # Get commit hash
```

---

**Status**: Ready to execute
**Architecture**: Finalized and documented
**No more planning**: Start building now
