# Phase 3 — Inventory Masters Module

## Overview
Build complete CRUD UI for all inventory master data modules:
1. Categories
2. Units
3. Manufacturers
4. Suppliers
5. Products (most complex)

**Execution Strategy**: Build each module to 100% completion before moving to the next.

## Module Building Order

### 1. Categories ✅ (Start)
- List page with search, pagination, sorting
- Create/Edit forms with validation
- View modal
- Soft delete with restore
- Status toggle
- Dashboard integration

### 2. Units
- List page
- Create/Edit forms
- View modal
- Soft delete

### 3. Manufacturers
- List page
- Create/Edit forms
- View modal
- GSTIN validation
- Email validation

### 4. Suppliers
- List page (most fields)
- Create/Edit forms
- View modal
- GSTIN validation
- Bank details
- Credit limit management

### 5. Products (Most Important)
- List page with advanced filtering
- Create/Edit forms (complex multi-section form)
- View modal
- Batch tracking toggle
- Expiry tracking toggle
- Supplier linking
- Dashboard integration

## API Endpoints Required

### Categories
- GET /api/inventory/categories
- GET /api/inventory/categories/:id
- POST /api/inventory/categories
- PUT /api/inventory/categories/:id
- DELETE /api/inventory/categories/:id (soft delete)
- POST /api/inventory/categories/:id/restore

### Units
- GET /api/inventory/units
- GET /api/inventory/units/:id
- POST /api/inventory/units
- PUT /api/inventory/units/:id
- DELETE /api/inventory/units/:id

### Manufacturers
- GET /api/inventory/manufacturers
- GET /api/inventory/manufacturers/:id
- POST /api/inventory/manufacturers
- PUT /api/inventory/manufacturers/:id
- DELETE /api/inventory/manufacturers/:id
- POST /api/inventory/manufacturers/:id/restore

### Suppliers
- GET /api/inventory/suppliers
- GET /api/inventory/suppliers/:id
- POST /api/inventory/suppliers
- PUT /api/inventory/suppliers/:id
- DELETE /api/inventory/suppliers/:id
- POST /api/inventory/suppliers/:id/restore

### Products
- GET /api/inventory/products (with filters)
- GET /api/inventory/products/:id
- POST /api/inventory/products
- PUT /api/inventory/products/:id
- DELETE /api/inventory/products/:id (soft delete)
- POST /api/inventory/products/:id/restore
- GET /api/inventory/products/links/suppliers (supplier linking)
- POST /api/inventory/products/:id/suppliers (link supplier)
- DELETE /api/inventory/products/:id/suppliers/:supplierId (unlink supplier)

## Frontend Components to Build

### Shared Components
- `MasterListPage` — Generic list page with pagination, search, sorting
- `MasterFormModal` — Generic create/edit modal
- `MasterViewModal` — View-only modal
- `ConfirmDialog` — Delete confirmation
- `FormField` — Reusable form field with validation
- `ValidationErrors` — Display field errors
- `SkeletonLoader` — Loading state

### Master Data Tables
- Generic columns configuration
- Reusable row actions (Edit, Delete, View)
- Status badges
- Soft delete UI (grayed out with restore option)

### Products-Specific
- `ProductForm` — Multi-section form with tabs
- `ProductPricingSection` — Pricing fields
- `ProductInventorySection` — Stock settings
- `ProductStorageSection` — Warehouse/Rack/Shelf/Bin
- `SupplierLinkingModal` — Link/unlink suppliers

## TypeScript Interfaces

```typescript
// Categories
interface Category {
  uuid: string
  name: string
  description?: string
  display_order: number
  color?: string
  icon?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// Units
interface Unit {
  uuid: string
  name: string
  short_name: string
  decimal_allowed: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// Manufacturers
interface Manufacturer {
  uuid: string
  manufacturer_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  city?: string
  state?: string
  website?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// Suppliers
interface Supplier {
  uuid: string
  supplier_code: string
  company_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  payment_terms?: string
  credit_days: number
  bank_name?: string
  account_number?: string
  ifsc?: string
  opening_balance: number
  credit_limit: number
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// Products
interface Product {
  uuid: string
  product_code: string
  sku?: string
  barcode?: string
  product_name: string
  generic_name?: string
  category_uuid: string
  manufacturer_uuid?: string
  unit_uuid: string
  default_supplier_uuid?: string
  purchase_price: number
  selling_price: number
  mrp: number
  gst_percentage: number
  hsn_code?: string
  minimum_stock: number
  reorder_level: number
  maximum_stock?: number
  batch_tracking: boolean
  expiry_tracking: boolean
  storage_location?: string
  rack_number?: string
  shelf_number?: string
  bin_number?: string
  description?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// Relations
interface ProductSupplier {
  product_uuid: string
  supplier_uuid: string
  supplier_code: string
  unit_rate: number
  lead_time_days?: number
  is_active: boolean
}
```

## Implementation Checklist

### For Each Module
- [ ] TypeScript interfaces defined
- [ ] API routes created (GET, POST, PUT, DELETE)
- [ ] Validation implemented
- [ ] Duplicate prevention implemented
- [ ] List page built
- [ ] Create/Edit form built
- [ ] View modal built
- [ ] Search implemented
- [ ] Pagination implemented
- [ ] Sorting implemented
- [ ] Filtering implemented (where applicable)
- [ ] Soft delete implemented
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Confirmation dialogs
- [ ] Responsive design
- [ ] Dark mode support
- [ ] Accessibility (a11y)
- [ ] Production build passes

## Dashboard Integration

Every CRUD action should auto-update these dashboard metrics:
```typescript
{
  total_products: number
  total_categories: number
  total_suppliers: number
  total_manufacturers: number
  active_batches: number
  low_stock_count: number
  out_of_stock_count: number
  total_inventory_value_cost: number
  total_inventory_value_mrp: number
}
```

Use React Query or SWR for real-time updates without page refresh.

## Validation Rules

### Categories
- Name: required, max 100 chars, unique
- Description: optional, max 500 chars
- Display order: optional, number

### Units
- Name: required, max 100 chars, unique
- Short name: required, max 20 chars, unique
- Decimal allowed: boolean

### Manufacturers
- Name: required, max 200 chars, unique
- Email: optional, valid email format
- GSTIN: optional, valid GSTIN format (15 chars)
- Mobile: optional, valid Indian phone number

### Suppliers
- Company name: required, max 200 chars
- Supplier code: auto-generated, unique
- Email: optional, valid email
- GSTIN: optional, valid GSTIN
- PAN: optional, valid PAN format
- Credit days: number, >= 0
- Credit limit: number, >= 0
- Mobile: optional, valid phone

### Products
- Product code: auto-generated OR user-provided unique
- Product name: required, max 200 chars, unique
- Category: required, must exist
- Unit: required, must exist
- Purchase price: required, >= 0
- Selling price: required, >= 0
- MRP: required, >= selling price
- GST: required, 0-100
- Minimum stock: required, >= 0
- Reorder level: required, >= minimum stock
- Batch tracking: boolean
- Expiry tracking: boolean

## Deliverables (After Completion)

1. **Screenshots** — Every page (list, create, edit, view) for all 5 modules
2. **API Endpoint List** — Complete documentation
3. **CRUD Verification** — Test screenshots showing all operations work
4. **Search/Filter Verification** — Working search and filters
5. **Production Build** — Zero errors, optimized bundle
6. **Git Commit Hash** — Final commit
7. **Database Schema** — Verify all tables exist and populated
8. **Performance Metrics** — Page load times, bundle size

## Timeline
- Categories: 1-2 hours
- Units: 30 mins (simpler, reuse components)
- Manufacturers: 1 hour (validation complexity)
- Suppliers: 2 hours (many fields, complex validation)
- Products: 4-5 hours (most complex, supplier linking, pricing)

**Total: 8-10 hours for complete Phase 3**

## No Phase 4 Yet
Do NOT start Purchase Orders, GRN UI, Batch Management, or Stock Adjustments until:
- All 5 master modules are 100% complete
- All tests pass
- Production build succeeds
- All deliverables collected

---

**Status**: Ready to begin
**Start Date**: 2026-07-04
