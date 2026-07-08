# Inventory Module - Production Setup & Master Data

## Problem
The Add Product modal shows empty dropdowns for Categories, Manufacturers, Units, and Suppliers because the master data tables are empty in production Supabase.

## Root Cause
The schema has been created (`inv_categories`, `inv_units`, `inv_manufacturers`, `inv_suppliers` tables exist), but the seed data has not been populated.

## Solution
Run the seed migration script in Supabase SQL Editor.

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run the Master Data Seed
Copy the entire contents of `/migrations/inv2_seed_production.sql` and paste into the SQL editor.

**Path**: `migrations/inv2_seed_production.sql`

**Script Contents**:
- Creates 19 units (Bottle, Tablet, Capsule, Kg, L, ml, etc.)
- Creates 16 categories (Panchakarma Medicines, Oils, Churna, etc.)
- Creates 5 manufacturers (Himalaya, Baidyanath, Dabur, Arjun, Local Compounding)
- Creates 5 suppliers (various distributors)
- Creates 5 tax rates (GST 0%, 5%, 12%, 18%, 28%)
- Creates 1 default warehouse

### Step 3: Verify Data
After running the script, you should see output like:
```
table_name              row_count
Units                   19
Categories              16
Manufacturers           5
Suppliers               5
Tax Masters             5
Warehouses              1
```

### Step 4: Test in Application
1. Go to **Inventory > Products**
2. Click **Add Product** (or **New** button)
3. All four dropdowns should now populate:
   - ✓ Categories (16 items)
   - ✓ Units (19 items)
   - ✓ Manufacturers (5 items)
   - ✓ Suppliers (5 items)

## Expected Results

### Before Seed
```
Category dropdown:     [Select Category]
Unit dropdown:         [Select Unit]
Manufacturer dropdown: [Select Manufacturer]
Supplier dropdown:     [Select Supplier]
```

### After Seed
```
Category dropdown:     [Panchakarma Medicines, Ayurvedic Medicines, Oils, ...]
Unit dropdown:         [Bottle, Strip, Tablet, Capsule, Box, ...]
Manufacturer dropdown: [Himalaya Wellness, Baidyanath, Dabur India, ...]
Supplier dropdown:     [Himalaya Supply, Baidyanath Distributor, Dabur Stockist, ...]
```

## API Verification

If data still doesn't appear after seeding, verify the APIs:

### Check Categories API
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://YOUR_PROJECT.supabase.co/rest/v1/inv_categories?select=*&limit=5"
```

Expected response:
```json
[
  {
    "uuid": "...",
    "name": "Panchakarma Medicines",
    "description": "Medicines used specifically in Panchakarma procedures",
    "display_order": 1,
    "color": "#7C3AED",
    "icon": "🌿",
    "is_active": true,
    "is_deleted": false,
    "created_at": "...",
    "updated_at": "..."
  },
  ...
]
```

### Check Units API
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://YOUR_PROJECT.supabase.co/rest/v1/inv_units?select=*&limit=5"
```

Expected response:
```json
[
  {
    "uuid": "...",
    "name": "Bottle",
    "short_name": "Btl",
    "decimal_allowed": false,
    "is_active": true,
    "created_at": "...",
    "updated_at": "..."
  },
  ...
]
```

## Next Steps

1. **Create a Test Product**:
   - Go to Inventory > Products
   - Click Add Product
   - Fill in:
     - Product Name: "Ashwagandha Churna"
     - Category: "Churna (Powders)"
     - Unit: "Kilogram"
     - Manufacturer: "Himalaya Wellness"
     - Supplier: "Himalaya Supply"
   - Click Create
   - Verify the product appears in the list

2. **Create a Purchase Order**:
   - Go to Inventory > Purchase Orders
   - Click New Purchase Order
   - Supplier dropdown should populate
   - Add items from the products you created

3. **Create a GRN**:
   - Go to Inventory > GRN
   - Click New GRN
   - Verify all related dropdowns populate

## Troubleshooting

**Problem**: Dropdowns still show only placeholder text after seeding
- Verify the SQL script ran without errors
- Check Supabase SQL Editor console for any error messages
- Run verification query again to confirm row counts

**Problem**: "Connection refused" or API errors
- Verify environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Confirm Supabase project is active and accessible
- Check browser console (F12) for actual error messages

**Problem**: Data appears in API but not in UI
- Open browser console (F12) and check for JavaScript errors
- Verify the field names match what the UI expects:
  - Categories: `uuid`, `name`
  - Units: `uuid`, `name`
  - Manufacturers: `uuid`, `manufacturer_name`
  - Suppliers: `uuid`, `company_name`
- Check the `loadDropdowns()` function in products page

## Additional Notes

- The seed script is **idempotent** — it clears existing data first, so it's safe to run multiple times
- Seed data uses realistic values for an Ayurvedic clinic
- All master records are set to `is_active = true`
- You can customize the seed data by modifying the SQL file before running

## Files Included

- `migrations/inv2_seed_production.sql` — Seed script for all master data
- `INVENTORY_PRODUCTION_SETUP.md` — This file
