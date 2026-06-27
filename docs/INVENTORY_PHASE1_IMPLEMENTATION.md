# Inventory System - Phase 1 Implementation

## Overview

Phase 1 establishes the master data structure for the Ayurshala Inventory System. It provides the foundation for all subsequent phases (purchases, sales, stock tracking, etc.).

**Status**: ✅ Complete with Production-Ready Service Layer  
**Date**: 2026-06-27  
**Components**: Categories, Products, Suppliers, Product-Supplier Relationships

---

## Architecture

### Layer Structure

```
API Routes (Next.js)
    ↓
Services (Business Logic)
    ↓
Supabase (PostgreSQL + RLS)
```

### Directory Structure

```
lib/inventory/
├── index.ts                 # Central exports
├── types.ts                 # All TypeScript interfaces
├── api-helper.ts            # Error handling & response formatting
├── category.service.ts      # Category operations
├── product.service.ts       # Product operations
├── supplier.service.ts      # Supplier operations
└── ... (future phases)

app/api/inventory/
├── categories/
│   ├── route.ts             # GET all, POST create
│   └── [id]/route.ts        # GET one, PUT update, DELETE
├── products/
│   ├── route.ts             # GET all, POST create
│   ├── [id]/route.ts        # GET one, PUT update, DELETE
│   └── [id]/suppliers/      # Link/unlink suppliers
└── suppliers/
    ├── route.ts             # GET all, POST create
    └── [id]/route.ts        # GET one, PUT update, DELETE
```

---

## Database Schema

### inventory_categories

Master list of product categories.

```sql
- id (UUID, PK)
- name (TEXT, NOT NULL)
- slug (TEXT, UNIQUE) — auto-generated from name
- description (TEXT)
- icon (TEXT) — emoji or icon name
- sort_order (INTEGER) — for UI ordering
- is_active (BOOLEAN)
- is_deleted (BOOLEAN) — soft delete
- clinic_id (UUID) — future: multi-clinic
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Pre-seeded Categories**:
- Medicines
- Oils
- Churna
- Tablets
- Capsules
- Consumables
- Equipment
- Herbs
- Packaging
- Other

---

### inventory_products

Core product master data.

```sql
- id (UUID, PK)
- sku (TEXT, UNIQUE) — e.g., "OILS-0001"
- name (TEXT, NOT NULL)
- description (TEXT)
- category_id (UUID, FK → inventory_categories)
- unit (TEXT) — ml, gm, nos, litre, pack, kg, etc.
- purchase_price (NUMERIC 10,2)
- sale_price (NUMERIC 10,2)
- mrp (NUMERIC 10,2) — Maximum Retail Price
- gst_percent (NUMERIC 5,2) — 0-100
- hsn_code (TEXT) — Harmonized System Code (India tax)
- reorder_level (INTEGER)
- reorder_quantity (INTEGER)
- status (TEXT) — ACTIVE, INACTIVE, DISCONTINUED
- notes (TEXT)
- clinic_id (UUID) — future: multi-clinic
- is_deleted (BOOLEAN) — soft delete
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Constraints**:
- SKU must be unique (non-deleted products only)
- status must be one of: ACTIVE, INACTIVE, DISCONTINUED
- Prices are non-negative
- GST is 0-100

---

### suppliers

Supplier/vendor master data.

```sql
- id (UUID, PK)
- supplier_name (TEXT, NOT NULL)
- contact_person (TEXT)
- mobile (TEXT) — 10-digit Indian format
- email (TEXT)
- gstin (TEXT) — Goods & Services Tax ID (India)
- address (TEXT)
- city (TEXT)
- state (TEXT)
- pincode (TEXT)
- is_active (BOOLEAN)
- notes (TEXT)
- clinic_id (UUID) — future: multi-clinic
- is_deleted (BOOLEAN) — soft delete
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Validation Rules**:
- Mobile: 10 digits only
- Email: standard email format
- GSTIN: 15-character alphanumeric code

---

### product_suppliers

Many-to-many relationship between products and suppliers.

```sql
- product_id (UUID, FK → inventory_products)
- supplier_id (UUID, FK → suppliers)
- is_preferred (BOOLEAN) — mark preferred supplier
- created_at (TIMESTAMPTZ)
- PK: (product_id, supplier_id)
```

**Use Case**: A product can have multiple suppliers; one can be marked as preferred for auto-selection in purchases.

---

## Row-Level Security (RLS)

All tables have RLS enabled with these policies:

### SELECT
- **Authenticated users** can read all categories, products, suppliers
- **Service role** (backend) can read all

### INSERT
- Authenticated users with role **ADMIN** or **PHARMACIST** can insert
- Service role can insert

### UPDATE
- Authenticated users with role **ADMIN** or **PHARMACIST** can update
- Service role can update

### DELETE
- Only **ADMIN** role can delete
- Service role can delete

**Note**: Deletes use soft-delete (`is_deleted = true`); hard deletes are never used.

---

## Service Layer API

All services are static classes in `/lib/inventory/`:

### CategoryService

**Methods**:

```typescript
// Fetch
static async getCategories(includeDeleted?: boolean): Promise<InventoryCategory[]>
static async getCategoryById(id: string): Promise<InventoryCategory>
static async getCategoryBySlug(slug: string): Promise<InventoryCategory>

// Create
static async createCategory(input: CreateCategoryInput): Promise<InventoryCategory>

// Update
static async updateCategory(id: string, input: UpdateCategoryInput): Promise<InventoryCategory>

// Delete
static async deleteCategory(id: string): Promise<void>
static async restoreCategory(id: string): Promise<InventoryCategory>
```

**Example Usage**:

```typescript
import { CategoryService } from '@/lib/inventory'

// Get all categories
const categories = await CategoryService.getCategories()

// Create new category
const category = await CategoryService.createCategory({
  name: 'Supplements',
  description: 'Dietary supplements',
  icon: '💊',
  sort_order: 11,
})

// Update
const updated = await CategoryService.updateCategory(categoryId, {
  description: 'Updated description',
})

// Delete
await CategoryService.deleteCategory(categoryId)
```

---

### ProductService

**Methods**:

```typescript
// Fetch
static async getProducts(categoryId?: string, includeDeleted?: boolean): Promise<InventoryProduct[]>
static async getProductById(id: string): Promise<InventoryProduct>
static async getProductBySku(sku: string): Promise<InventoryProduct>

// Create
static async createProduct(input: CreateProductInput): Promise<InventoryProduct>

// Update
static async updateProduct(id: string, input: UpdateProductInput): Promise<InventoryProduct>

// Delete
static async deleteProduct(id: string): Promise<void>

// Supplier Links
static async getProductSuppliers(productId: string): Promise<ProductSupplier[]>
static async linkSupplier(productId: string, input: LinkProductSupplierInput): Promise<ProductSupplier>
static async unlinkSupplier(productId: string, supplierId: string): Promise<void>
```

**Validation**:
- SKU must be unique, uppercase
- Required fields: sku, name, category_id, unit
- Prices must be non-negative
- GST must be 0-100

**Example Usage**:

```typescript
import { ProductService } from '@/lib/inventory'

// Create product
const product = await ProductService.createProduct({
  sku: 'OIL-0001',
  name: 'Dhanwantharam Tailam',
  category_id: oilsCategoryId,
  unit: 'ml',
  purchase_price: 500,
  sale_price: 800,
  mrp: 999,
  gst_percent: 5,
})

// Link supplier
await ProductService.linkSupplier(productId, {
  supplier_id: supplierId,
  is_preferred: true,
})

// Get suppliers for product
const suppliers = await ProductService.getProductSuppliers(productId)
```

---

### SupplierService

**Methods**:

```typescript
// Fetch
static async getSuppliers(includeDeleted?: boolean): Promise<Supplier[]>
static async getActiveSuppliers(): Promise<Supplier[]>
static async getSupplierById(id: string): Promise<Supplier>

// Create
static async createSupplier(input: CreateSupplierInput): Promise<Supplier>

// Update
static async updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier>

// Delete
static async deleteSupplier(id: string): Promise<void>
static async restoreSupplier(id: string): Promise<Supplier>
```

**Validation**:
- Email: standard email format
- Mobile: 10 digits
- GSTIN: 15-character format

**Example Usage**:

```typescript
import { SupplierService } from '@/lib/inventory'

// Create supplier
const supplier = await SupplierService.createSupplier({
  supplier_name: 'Arya Vaidya Pharmacy',
  contact_person: 'Mr. Kumar',
  mobile: '9876543210',
  email: 'contact@aryavaidya.com',
  gstin: '36AABCU9603R1Z5',
  address: '123 Market St',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
})

// Get active suppliers
const active = await SupplierService.getActiveSuppliers()
```

---

## API Endpoints

All endpoints return standardized JSON responses:

### Success Response (200/201)
```json
{
  "id": "uuid",
  "name": "...",
  ...
}
```

### Error Response (4xx/5xx)
```json
{
  "error": "Error message",
  "validationErrors": [
    { "field": "name", "message": "Field required" }
  ]
}
```

---

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/inventory/categories` | Public | Get all active categories |
| POST | `/api/inventory/categories` | ADMIN, PHARMACIST | Create category |
| GET | `/api/inventory/categories/:id` | Public | Get single category |
| PUT | `/api/inventory/categories/:id` | ADMIN, PHARMACIST | Update category |
| DELETE | `/api/inventory/categories/:id` | ADMIN | Soft delete category |

**Examples**:

```bash
# Get all categories
curl https://localhost:3000/api/inventory/categories

# Create category
curl -X POST https://localhost:3000/api/inventory/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Category",
    "icon": "🌿",
    "sort_order": 11
  }'

# Update category
curl -X PUT https://localhost:3000/api/inventory/categories/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "is_active": false
  }'

# Delete category
curl -X DELETE https://localhost:3000/api/inventory/categories/abc-123
```

---

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/inventory/products` | Public | Get all products |
| POST | `/api/inventory/products` | ADMIN, PHARMACIST | Create product |
| GET | `/api/inventory/products/:id` | Public | Get single product |
| PUT | `/api/inventory/products/:id` | ADMIN, PHARMACIST | Update product |
| DELETE | `/api/inventory/products/:id` | ADMIN | Soft delete product |
| GET | `/api/inventory/products/:id/suppliers` | Public | Get suppliers for product |
| POST | `/api/inventory/products/:id/suppliers` | ADMIN, PHARMACIST | Link supplier |
| DELETE | `/api/inventory/products/:id/suppliers` | ADMIN, PHARMACIST | Unlink supplier |

**Query Parameters**:
- `category_id`: Filter by category

**Examples**:

```bash
# Get all products in a category
curl 'https://localhost:3000/api/inventory/products?category_id=oils-cat-id'

# Create product
curl -X POST https://localhost:3000/api/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "OIL-0001",
    "name": "Dhanwantharam Tailam",
    "category_id": "oils-id",
    "unit": "ml",
    "purchase_price": 500,
    "sale_price": 800,
    "mrp": 999,
    "gst_percent": 5
  }'

# Link supplier to product
curl -X POST https://localhost:3000/api/inventory/products/prod-id/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "supplier-id",
    "is_preferred": true
  }'
```

---

### Suppliers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/inventory/suppliers` | Public | Get all suppliers |
| POST | `/api/inventory/suppliers` | ADMIN, PHARMACIST | Create supplier |
| GET | `/api/inventory/suppliers/:id` | Public | Get single supplier |
| PUT | `/api/inventory/suppliers/:id` | ADMIN, PHARMACIST | Update supplier |
| DELETE | `/api/inventory/suppliers/:id` | ADMIN | Soft delete supplier |

**Query Parameters**:
- `active_only`: Set to `true` to get only active suppliers

**Examples**:

```bash
# Get all active suppliers
curl 'https://localhost:3000/api/inventory/suppliers?active_only=true'

# Create supplier
curl -X POST https://localhost:3000/api/inventory/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_name": "Arya Vaidya Pharmacy",
    "contact_person": "Mr. Kumar",
    "mobile": "9876543210",
    "email": "contact@example.com",
    "gstin": "36AABCU9603R1Z5",
    "address": "123 Market St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }'

# Update supplier
curl -X PUT https://localhost:3000/api/inventory/suppliers/supplier-id \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

---

## TypeScript Types

All types are defined in `/lib/inventory/types.ts`:

### Input Types

```typescript
interface CreateCategoryInput {
  name: string
  description?: string
  icon?: string
  sort_order?: number
}

interface CreateProductInput {
  sku: string
  name: string
  description?: string
  category_id: string
  unit: string
  purchase_price: number
  sale_price: number
  mrp: number
  gst_percent: number
  hsn_code?: string
  reorder_level?: number
  reorder_quantity?: number
  notes?: string
}

interface CreateSupplierInput {
  supplier_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  notes?: string
}
```

---

## Error Handling

The API layer uses unified error handling via `handleApiError`:

```typescript
// Validation errors (400)
throw new ValidationException([
  { field: 'email', message: 'Invalid email format' },
  { field: 'mobile', message: 'Mobile must be 10 digits' },
])

// API errors (any status)
throw new ApiError(404, 'Product not found')
throw new ApiError(409, 'Duplicate SKU')

// Generic errors (500)
throw new Error('Database connection failed')
```

All errors are caught and returned as standardized JSON responses with appropriate HTTP status codes.

---

## Testing Checklist

### Categories
- [ ] GET /categories returns all active categories
- [ ] POST /categories creates new category with auto-slug
- [ ] GET /categories/:id returns specific category
- [ ] PUT /categories/:id updates category
- [ ] DELETE /categories/:id soft-deletes category
- [ ] Duplicate slug prevents creation
- [ ] Invalid data returns 400

### Products
- [ ] GET /products returns all products
- [ ] POST /products creates product with validation
- [ ] SKU uniqueness enforced
- [ ] Prices validation (non-negative)
- [ ] GST validation (0-100)
- [ ] GET /products/:id returns product details
- [ ] PUT /products/:id updates product
- [ ] DELETE /products/:id soft-deletes
- [ ] Link/unlink suppliers works

### Suppliers
- [ ] GET /suppliers returns active suppliers
- [ ] POST /suppliers creates supplier with validation
- [ ] Email validation works
- [ ] Mobile validation works (10 digits)
- [ ] GSTIN validation works
- [ ] GET /suppliers/:id returns supplier
- [ ] PUT /suppliers/:id updates supplier
- [ ] DELETE /suppliers/:id soft-deletes

### General
- [ ] RLS policies enforce auth
- [ ] Error responses are consistent
- [ ] Timestamps update correctly
- [ ] Soft deletes work (is_deleted = true)
- [ ] Database integrity maintained

---

## Next Steps

Phase 2 builds on Phase 1:

- **Purchase Orders**: Use categories, products, suppliers
- **Goods Receipt Notes**: Create batches
- **Stock Transactions**: Begin tracking inventory movements
- **Stock Ledger**: Calculate running balances

**Phase 1 must be complete and production-tested before Phase 2 begins.**

---

## Debugging

### Enable Supabase Logs

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename LIKE 'inventory_%' OR tablename = 'suppliers';

-- Check triggers
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Test Service Layer Directly

```typescript
// In a test file or browser console
import { CategoryService, ProductService, SupplierService } from '@/lib/inventory'

// Test service directly
await CategoryService.getCategories()
await ProductService.getProducts()
await SupplierService.getActiveSuppliers()
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Authentication required" | Ensure user is logged in, check auth token |
| "Permission denied" | Check user role in `profiles` table, verify RLS policies |
| "Unique constraint violation" | SKU already exists, use different SKU |
| "Foreign key constraint" | Category/Supplier doesn't exist or is deleted |
| "Invalid email/mobile" | Check validation rules (regex patterns) |

---

## Performance Notes

- **Indexes** are created on: slug, category, status, name (full-text search)
- **Select queries** use `.select()` not `.select('*')` for explicit column selection
- **Soft deletes** filter with `is_deleted = false` in all queries
- **Cascading deletes**: product_suppliers cascade when product/supplier deleted

---

## Security

- **RLS enabled** on all tables (policies defined in migration)
- **Soft deletes only** — data never permanently removed
- **Input validation** in service layer before DB operations
- **SQL injection prevention** via Supabase parameterized queries
- **Role-based access** — ADMIN, PHARMACIST, DOCTOR, RECEPTIONIST

---

## Monitoring

Track these metrics:

- API response times (should be <200ms)
- Error rates (aim for <1%)
- Database query performance
- RLS policy effectiveness

Enable Application Performance Monitoring (APM) in Vercel for production.
