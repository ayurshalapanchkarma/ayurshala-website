# DASHBOARD DEBUGGING GUIDE

## Issue: Metrics Not Loading

### Symptoms
- Dashboard shows blank metric cards
- Export button returns `{"error":"Failed to export data", "details":null}`

### Root Causes to Check

#### 1. Environment Variables Missing
**Check**: Are these set in `.env.local` or deployment environment?
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**How to verify**:
- Check `.env.local` file
- Check deployment environment variables
- Metrics API will log: "URL: set" or "URL: NOT SET"

**Fix**:
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 2. Server Logs - Check Console Output
The metrics API now logs every step. Look for:

**Success logs**:
```
[Metrics API] Starting...
[Metrics API] Fetching product count...
[Metrics API] Product count: 42
[Metrics API] Fetching category count...
[Metrics API] Category count: 8
...
[Metrics API] Success, returning: {...}
```

**Error logs**:
```
[Metrics API] Fatal error: {error details}
[Metrics API] Error message: {specific error}
```

**Action**: Run `npm run dev` and check server console for these logs

#### 3. Database Queries
Each metric fetches from a specific table. The logs show:
- `[Metrics API] Fetching product count...` → Queries `inv_products` table
- `[Metrics API] Fetching category count...` → Queries `inv_categories` table
- `[Metrics API] Fetching supplier count...` → Queries `inv_suppliers` table
- etc.

**Possible errors**:
- Table doesn't exist
- Column doesn't exist (e.g., `is_active` vs `is_deleted`)
- Column type mismatch
- Database connection issues

#### 4. Frontend Console Errors
Open browser DevTools (F12) → Console tab
- Should NOT see "supabaseKey is required"
- Should see network request to `/api/inventory/dashboard/metrics`
- Response should be JSON with metrics

**Good response**:
```json
{
  "success": true,
  "metrics": {
    "products": 42,
    "categories": 8,
    "suppliers": 15,
    ...
  }
}
```

**Bad response**:
```json
{
  "error": "Something went wrong",
  "type": "Error"
}
```

---

## Issue: Export Gives Error Object

### Symptoms
Downloaded CSV file contains JSON error object:
```json
{"error":"Failed to export data", "details":null}
```

### Root Causes

#### 1. No Data in Database
The export API returns 400 error if no data exists:
```
[Export API] No data available for export type: products
```

**Fix**: Create test data or check if products exist in database

#### 2. Query Error
The export API queries fail, logs show:
```
[Export API] Fetching products data...
[Export API] Error: {detailed error}
```

**Common issues**:
- Wrong column names in SELECT
- `is_active` filter doesn't exist
- Foreign key relationship broken
- Bad LIMIT/OFFSET

#### 3. HTTP Status Not OK
Frontend export checks `if (!res.ok)` and tries to parse as JSON error

**Fix**: Check Network tab in browser
- Look at `/api/inventory/export?format=csv&type=products`
- Check Response tab
- Should be 200 with CSV data
- If 400/500, JSON error will be shown

---

## How to Debug

### Step 1: Start Dev Server with Logging
```bash
npm run dev
```
Watch server console for logs.

### Step 2: Test Metrics API Directly
```bash
curl http://localhost:3000/api/inventory/dashboard/metrics
```

Expected output (first 500 chars):
```json
{"success":true,"metrics":{"products":0,"categories":0,"suppliers":0,"stockValue":0,"lowStock":0,"expiringsoon":0,"pendingPos":0,"todaysGrn":0},...}
```

If you see error instead, check the error message in response.

### Step 3: Test Export API
```bash
curl http://localhost:3000/api/inventory/export?format=csv&type=products
```

Expected: CSV data starting with `product_name,sku,category,...`

If you see JSON error, the export API failed. Check server logs for `[Export API]` messages.

### Step 4: Browser DevTools
- F12 → Console → Check for errors
- Network tab → Look at requests
- Check HTTP status codes (200 for success, 4xx/5xx for errors)

---

## Common Fixes

### Fix 1: Environment Variables
```bash
# Verify .env.local exists and has all three keys
cat .env.local

# If missing, add them
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key" >> .env.local

# Restart dev server
# (Ctrl+C to stop, npm run dev to restart)
```

### Fix 2: Create Test Data
If database is empty, create test data:
```sql
-- Create a test product
INSERT INTO inv_products (product_name, sku, is_active)
VALUES ('Test Product', 'TEST001', true);

-- Create a test category  
INSERT INTO inv_categories (name, is_active)
VALUES ('Test Category', true);

-- Create a test supplier
INSERT INTO inv_suppliers (name, is_active)
VALUES ('Test Supplier', true);
```

### Fix 3: Verify Table Names
The code queries these exact table names:
- `inv_products` (not `products`)
- `inv_categories` (not `categories`)
- `inv_suppliers` (not `suppliers`)
- `inv_purchase_orders` (not `purchase_orders`)
- `inv_goods_receipts` (not `goods_receipts`)
- `inv_product_batches` (not `batches`)

If tables have different names, update the API queries.

---

## Server Log Output

### Metrics API Logs
```
[Metrics API] Starting...
[Metrics API] URL: set
[Metrics API] Key: set
[Metrics API] Fetching product count...
[Metrics API] Product count: 42
[Metrics API] Fetching category count...
[Metrics API] Category count: 8
[Metrics API] Fetching supplier count...
[Metrics API] Supplier count: 15
[Metrics API] Fetching stock data...
[Metrics API] Stock records: 42
[Metrics API] Stock value: 12500.50
[Metrics API] Fetching low stock count...
[Metrics API] Low stock count: 3
[Metrics API] Fetching expiring soon count...
[Metrics API] Expiring count: 2
[Metrics API] Fetching pending PO count...
[Metrics API] Pending PO count: 5
[Metrics API] Fetching today GRN count...
[Metrics API] Today GRN count: 2
[Metrics API] Success, returning: {...}
```

### Export API Logs
```
[Export API] format=csv, type=products
[Export API] Fetching products data...
[Export API] Found 42 products
[Export API] Data ready, format=csv, records=42
[Export API] CSV generated, size=2456 bytes
```

---

## Testing Checklist

- [ ] Environment variables set (NEXT_PUBLIC_SUPABASE_URL, etc.)
- [ ] Dev server running (`npm run dev`)
- [ ] Can curl metrics API and get JSON response
- [ ] Can curl export API and get CSV data
- [ ] Browser console has no errors
- [ ] Network tab shows 200 status for API calls
- [ ] Dashboard shows metric cards with numbers
- [ ] Export CSV downloads successfully
- [ ] Export Excel downloads successfully

---

**If still having issues**:
1. Check server console for exact error log message
2. Share that error message for specific diagnosis
3. Verify environment variables are correct
4. Check database has test data
5. Try curl commands to isolate client vs server issue
