# CRITICAL: Database Schema Setup

## Problem

```
Error: Could not find table public.inventory_products in schema cache.
```

**Root Cause**: The database migrations have NOT been applied to your Supabase database.

---

## Solution: Apply Migrations Manually

The application expects these tables to exist:
- `inventory_products`
- `inventory_categories`
- `inventory_suppliers`
- `inventory_manufacturers`
- `inventory_units`
- `inventory_batches`
- `inventory_stock_ledger`
- `inventory_stock_transactions`
- ... and many more

These tables are defined in migration files but must be created in your Supabase database.

---

## Step 1: Access Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select your project (Ayurshala)
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

---

## Step 2: Run Phase 1 Foundation (CRITICAL)

This creates the base products table.

1. Open: `migrations/inventory_001_phase1_foundation.sql`
2. Copy ALL contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for success message

---

## Step 3: Run Additional Phase 1 Migrations

These enhance the products table:

Run in this order:
1. `migrations/inventory_001a_phase1_units_manufacturers.sql`
2. `migrations/inventory_001b_phase1_audit_logging.sql`
3. `migrations/inventory_001c_phase1_product_enhancements.sql`

For each file:
- Open the file
- Copy ALL contents
- Paste in SQL Editor
- Click **Run**
- Verify success

---

## Step 4: Verify Tables Created

In SQL Editor, run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
AND table_name LIKE 'inventory_%'
ORDER BY table_name;
```

You should see:
```
inventory_batches
inventory_categories
inventory_manufacturers
inventory_products
inventory_stock_ledger
inventory_stock_transactions
inventory_suppliers
inventory_units
... and more
```

---

## Step 5: Test the API

1. Start dev server: `npm run dev`
2. Open: http://localhost:3000/api/inventory/products
3. Should see:
```json
{
  "success": true,
  "data": []
}
```

(Empty array is correct if no products created yet)

---

## Step 6: Test the UI

1. Go to: http://localhost:3000/dashboard/inventory/products
2. Should load without "Failed to load products" error
3. Empty state message: "No products - Create your first product"

---

## Advanced: Run All Phases

If Phase 1 works, run the remaining phases in order:

```
inventory_002_phase2_purchases.sql
inventory_003_phase3_stock_engine.sql
inventory_004_phase4_batch_expiry.sql
inventory_005_phase5_sales.sql
inventory_006_phase6_treatment_consumption.sql
inventory_007_phase7_oil_tracking.sql
inventory_008_phase8_adjustments.sql
inventory_009_phase9_reporting.sql
inventory_010_phase11_security.sql
```

---

## Troubleshooting

**Error: "Function does not exist"**
- Some migrations use Postgres functions
- Run all phases in order
- Don't skip migrations

**Error: "Column does not exist"**
- Check that all previous phases were applied
- Run migrations in the specified order

**Error: "Permission denied"**
- Verify Supabase user has table creation permissions
- Usually resolved by using admin key

**Products page still shows error**
- Clear browser cache: `Ctrl+Shift+Delete`
- Restart dev server: `npm run dev`
- Check Supabase SQL Editor for errors

---

## Table Schema

The `inventory_products` table has:

```
id              UUID PRIMARY KEY
sku             TEXT UNIQUE NOT NULL
name            TEXT NOT NULL
category_id     UUID REFERENCES inventory_categories
unit            TEXT
purchase_price  DECIMAL
sale_price      DECIMAL
mrp             DECIMAL
gst_percent     DECIMAL
reorder_level   INTEGER
is_deleted      BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
... and more fields
```

---

## Next Steps

After applying migrations:

1. Products API will work: `GET /api/inventory/products` → `200 OK`
2. Products page will load
3. Can create/edit/delete products
4. Can then implement Categories (Phase 16.2)

---

**IMPORTANT**: Do not modify ProductService code. The table name is correct. The problem is the database, not the application.
