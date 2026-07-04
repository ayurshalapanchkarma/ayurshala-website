# AYURSHALA INVENTORY v2 — EXECUTION GUIDE
## Phase 2 Verification Package

---

## Files in This Package

| File | Purpose | Run Order |
|------|---------|-----------|
| `inv2_001_schema.sql` | Drop old tables. Create all 20 tables. | 1 |
| `inv2_002_indexes.sql` | 67 indexes for performance. | 2 |
| `inv2_003_triggers.sql` | Immutability guards, batch qty cache, PO auto-status. | 3 |
| `inv2_004a_functions_utility.sql` | Sequence generators, stock calculation, rebuild. | 4 |
| `inv2_004b_functions_grn_adjustment.sql` | `fn_post_grn` (transactional), `fn_post_stock_adjustment`. | 5 |
| `inv2_004c_functions_views.sql` | RLS helper + 4 dashboard/report views. | 6 |
| `inv2_004d_rls_policies.sql` | 58 Row-Level Security policies. | 7 |
| `inv2_005_seed_master_data.sql` | Categories, units, tax, warehouse, settings. | 8 |
| `inv2_998_test_data.sql` | Realistic test data (DEV ONLY). | 9 |
| `inv2_997_smoke_tests.sql` | GRN transaction, rollback, immutability, rebuild tests. | 10 |
| `inv2_996_performance.sql` | EXPLAIN ANALYZE for all key queries. | 11 |
| `inv2_999_verify.sql` | Full PASS/FAIL verification of schema. | Run anytime after step 8 |

---

## How to Run in Supabase SQL Editor

### Step-by-step

1. Open your Supabase project at https://supabase.com/dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of each file **in order** into the editor
5. Click **Run** (or Cmd+Enter)
6. Confirm no red errors appear before proceeding to the next file

### One file at a time — do not batch

Each file wraps its statements in `BEGIN; ... COMMIT;`.
If Supabase SQL Editor shows an error, the transaction rolls back automatically.
**Do not manually fix errors** — report the exact error text.

---

## Expected Output Per File

### inv2_001_schema.sql
```
DROP TABLE
DROP TABLE
... (20 DROP TABLE lines for old tables — NOTICE if they don't exist is OK)
CREATE TABLE
CREATE TABLE
... (20 CREATE TABLE lines)
```
No errors. DROPs on non-existent tables produce: `NOTICE: table "X" does not exist, skipping`  
This is expected — not a failure.

### inv2_002_indexes.sql
```
CREATE INDEX
CREATE INDEX
... (67 lines)
```

### inv2_003_triggers.sql
```
CREATE FUNCTION
DO
CREATE FUNCTION
CREATE TRIGGER
... 
```

### inv2_004a_functions_utility.sql through inv2_004d_rls_policies.sql
```
CREATE FUNCTION (or CREATE OR REPLACE FUNCTION)
...
```

### inv2_005_seed_master_data.sql
```
INSERT 26  (settings)
INSERT 19  (units)
INSERT 16  (categories)
INSERT 5   (tax master)
INSERT 1   (warehouse)
INSERT 8   (warehouse locations)
```

---

## Running inv2_999_verify.sql (Verification)

This is your primary pass/fail gate. Run it after all 8 migration files.

**What to look for:**

Every result row should show `✅ PASS`.

The final summary row should read:
```
✅ ALL CRITICAL CHECKS PASSED — Phase 2 schema is valid
```

**If any row shows `❌ FAIL`:**

Note the table/function/trigger name. Check whether the corresponding
migration file ran without error. Re-run that specific migration file.

---

## Running Test Data (inv2_998_test_data.sql)

This inserts realistic Ayurvedic clinic data:
- 4 manufacturers (Kottakkal, Dabur, Himalaya, Baidyanath)
- 3 suppliers with banking details and credit limits
- 6 products (oils, churna, tablets, consumables)
- 2 purchase orders (PO-TEST-001, PO-TEST-002) — status: approved
- 2 GRNs (GRN-TEST-001, GRN-TEST-002) — status: **draft**, ready to post

**Expected output:**
```
INSERT 4   -- manufacturers
INSERT 3   -- suppliers
(DO block output — no row count)
(DO block output — no row count)
(DO block output — no row count)
```

Followed by a verification table showing:
```
entity           | count
-----------------+-------
Manufacturers    | 4
Suppliers        | 3
Products         | 6
Purchase Orders  | 2
PO Items         | 4
GRNs (draft)     | 2
GRN Items        | 4
```

---

## Running Smoke Tests (inv2_997_smoke_tests.sql)

Run each section separately. Do not run all at once.

### Section A: GRN Post Transaction

Run sections A1 through A11 in sequence.

**Critical result to confirm — Step A3:**
```json
{
  "success": true,
  "grn_number": "GRN-TEST-001",
  "items_processed": 3,
  "movements_created": 3
}
```

**Critical result — Step A4 (GRN status):**
```
grn_number    | status | status_check
--------------+--------+--------------
GRN-TEST-001  | posted | ✅ PASS
```

**Critical result — Step A5 (batches created):**
```
event            | batch_number       | product_name           | available_quantity
-----------------+--------------------+------------------------+-------------------
✅ Batch created | BATCH-DT-2026-01  | Dhanwantharam Tailam   | 11
✅ Batch created | BATCH-TC-2026-03  | Triphala Churna        | 22
✅ Batch created | BATCH-KB-2024-06  | Ksheerabala Tailam     | 5
```
(available_quantity = received_qty + free_qty)

**Critical result — Step A6 (stock movements):**
```
movement_type | product_name         | quantity | before_stock | after_stock
--------------+----------------------+----------+--------------+------------
PURCHASE      | Dhanwantharam Tailam | 11       | 0            | 11
PURCHASE      | Triphala Churna      | 22       | 0            | 22
PURCHASE      | Ksheerabala Tailam   | 5        | 0            | 5
```

**Critical result — Step A9 (cache vs source of truth):**
```
product_name         | cached_qty | calculated_from_movements | consistency_check
---------------------+------------+--------------------------+---------------------------
Dhanwantharam Tailam | 11         | 11                       | ✅ MATCH — cache is accurate
Triphala Churna      | 22         | 22                       | ✅ MATCH — cache is accurate
Ksheerabala Tailam   | 5          | 5                        | ✅ MATCH — cache is accurate
```

### Section B: Rollback Test

**Critical result — B4 and B5:**
```
check_name                  | rollback_check
----------------------------+----------------------------
Batches after rollback test | ✅ PASS — batch count unchanged
```
```
check_name               | rollback_check
-------------------------+-------------------------------------------
Bad GRN existence        | ✅ PASS — GRN-ROLLBACK-TEST does not exist
```

### Section C: Immutability Guard

**Critical result:**
```
NOTICE: ✅ PASS — UPDATE blocked: inv_stock_movements is an immutable ledger...
NOTICE: ✅ PASS — DELETE blocked: inv_stock_movements is an immutable ledger...
NOTICE: ✅ PASS — Editing posted GRN blocked: GRN GRN-TEST-001 is already posted...
```

### Section D: Rebuild Test

**Critical result after D3:**
```
batch_number     | rebuilt_cache | from_movements | rebuild_check
-----------------+---------------+----------------+-----------------------------------
BATCH-DT-2026-01 | 11            | 11             | ✅ PASS — cache matches movements
```

### Section E: Expiry Alert View

**Critical result:**
```
batch_number     | days_to_expiry | expiry_status | available_quantity
-----------------+----------------+---------------+-------------------
BATCH-KB-2024-06 | ~21            | WARNING       | 5
```

---

## Running Performance Tests (inv2_996_performance.sql)

Run each EXPLAIN ANALYZE individually.

**What to confirm for each query:**

| Query | Expected plan node | Index name |
|-------|-------------------|------------|
| Product by code | Index Scan | `idx_inv_prod_code` |
| Product by barcode | Index Scan | `idx_inv_prod_barcode` |
| Batch by expiry | Bitmap Index Scan | `idx_inv_batch_expiry` |
| Batch by number | Index Scan | `idx_inv_batch_number` |
| Movements by product+date | Index Scan | `idx_inv_mov_prod_date` |
| FTS product search | Bitmap Index Scan | `idx_inv_prod_fts` |
| PO by supplier | Index Scan | `idx_inv_po_supplier` |

**Red flag:** If you see `Seq Scan` on `inv_products` or `inv_stock_movements`
with a large `rows=` estimate, the index may not have been created.
Re-run `inv2_002_indexes.sql` and check for errors.

With the current small dataset, the planner may choose Seq Scan because it's
faster for tiny tables. This is normal and expected — index usage becomes
significant at >1000 rows. The EXPLAIN output will show the index is *available*
in the plan even if not chosen at small scale.

---

## Rollback Instructions (if a migration fails)

If any migration file fails partway through:

1. The `BEGIN/COMMIT` wrapping means changes are automatically rolled back.
2. Fix the reported error in the SQL file.
3. Re-run that file only — not the entire sequence.
4. If the schema is in an inconsistent state, run `inv2_001_schema.sql` again
   (it drops and recreates everything cleanly).

**Manual rollback of the entire inventory schema:**
```sql
DROP TABLE IF EXISTS inv_audit_log                CASCADE;
DROP TABLE IF EXISTS inv_stock_adjustment_items   CASCADE;
DROP TABLE IF EXISTS inv_stock_adjustments        CASCADE;
DROP TABLE IF EXISTS inv_stock_movements          CASCADE;
DROP TABLE IF EXISTS inv_product_batches          CASCADE;
DROP TABLE IF EXISTS inv_goods_receipt_items      CASCADE;
DROP TABLE IF EXISTS inv_goods_receipts           CASCADE;
DROP TABLE IF EXISTS inv_purchase_order_items     CASCADE;
DROP TABLE IF EXISTS inv_purchase_orders          CASCADE;
DROP TABLE IF EXISTS inv_product_documents        CASCADE;
DROP TABLE IF EXISTS inv_product_images           CASCADE;
DROP TABLE IF EXISTS inv_products                 CASCADE;
DROP TABLE IF EXISTS inv_warehouse_locations      CASCADE;
DROP TABLE IF EXISTS inv_warehouses               CASCADE;
DROP TABLE IF EXISTS inv_suppliers                CASCADE;
DROP TABLE IF EXISTS inv_manufacturers            CASCADE;
DROP TABLE IF EXISTS inv_tax_master               CASCADE;
DROP TABLE IF EXISTS inv_units                    CASCADE;
DROP TABLE IF EXISTS inv_categories               CASCADE;
DROP TABLE IF EXISTS inv_settings                 CASCADE;
DROP VIEW  IF EXISTS v_current_stock              CASCADE;
DROP VIEW  IF EXISTS v_expiring_batches           CASCADE;
DROP VIEW  IF EXISTS v_inventory_valuation        CASCADE;
DROP VIEW  IF EXISTS v_dashboard_summary          CASCADE;
```

---

## Phase 2 Completion Checklist

Run each item. Tick it off before approving Phase 3.

### Schema
- [ ] `inv2_001_schema.sql` executed with zero errors
- [ ] `inv2_002_indexes.sql` executed with zero errors
- [ ] `inv2_003_triggers.sql` executed with zero errors
- [ ] `inv2_004a_functions_utility.sql` executed with zero errors
- [ ] `inv2_004b_functions_grn_adjustment.sql` executed with zero errors
- [ ] `inv2_004c_functions_views.sql` executed with zero errors
- [ ] `inv2_004d_rls_policies.sql` executed with zero errors
- [ ] `inv2_005_seed_master_data.sql` executed with zero errors

### Verification (inv2_999_verify.sql)
- [ ] All 20 tables: ✅ PASS
- [ ] All critical columns: ✅ PASS
- [ ] FK count >= 25: ✅ PASS
- [ ] Index count >= 50: ✅ PASS
- [ ] All 8 trigger functions: ✅ PASS
- [ ] All 14 triggers attached: ✅ PASS
- [ ] All 11 business functions: ✅ PASS
- [ ] All 4 views: ✅ PASS
- [ ] RLS enabled on all tables: ✅ PASS
- [ ] Policy count >= 45: ✅ PASS
- [ ] Seed data (units, categories, settings): ✅ PASS
- [ ] Sequence functions generate correct format: ✅ PASS
- [ ] Final summary: ✅ ALL CRITICAL CHECKS PASSED

### Transaction Testing (inv2_997_smoke_tests.sql)
- [ ] GRN post returns `"success": true` with 3 items_processed
- [ ] 3 batches created with correct available_quantity
- [ ] 3 stock movements created (type=PURCHASE, before=0, after>0)
- [ ] PO item received_quantity updated by trigger
- [ ] PO status changed to partially_received/received by trigger
- [ ] cache (available_quantity) matches fn_get_product_stock() exactly
- [ ] Dashboard summary reflects the GRN

### Rollback Testing
- [ ] Bad GRN post raises exception
- [ ] Batch count unchanged after failed post
- [ ] Movement count unchanged after failed post
- [ ] GRN-ROLLBACK-TEST does not exist in database

### Immutability
- [ ] UPDATE on inv_stock_movements raises exception
- [ ] DELETE on inv_stock_movements raises exception
- [ ] UPDATE on posted GRN raises exception

### Rebuild Test
- [ ] fn_rebuild_all_batch_quantities() returns batch count
- [ ] After rebuild, available_quantity matches movements exactly

### Expiry View
- [ ] BATCH-KB-2024-06 (near-expiry) appears in v_expiring_batches

### Performance
- [ ] EXPLAIN ANALYZE on v_current_stock shows index usage
- [ ] EXPLAIN ANALYZE on v_expiring_batches shows idx_inv_batch_expiry
- [ ] EXPLAIN ANALYZE on product_code lookup shows idx_inv_prod_code
- [ ] EXPLAIN ANALYZE on barcode lookup shows idx_inv_prod_barcode

---

## Known Limitations at Phase 2

1. **No production build verification yet** — Phase 2 is database-only.
   The Next.js build is not affected by schema changes until Phase 3 (API layer).

2. **Auth UUIDs in test data** — Smoke tests use `00000000-0000-0000-0000-000000000001`
   as a placeholder user UUID. In production, `fn_post_grn()` will receive `auth.uid()`
   from the API layer. This does not affect schema correctness.

3. **RLS bypass in SQL Editor** — When you run SQL directly in the Supabase SQL
   Editor as the `postgres` superuser, RLS policies are bypassed. RLS will be
   fully tested in Phase 3 when API routes use the anon/service role keys.

4. **EXPLAIN ANALYZE with small dataset** — With fewer than 100 rows, the Postgres
   planner will often choose Seq Scan over Index Scan because it's faster for
   tiny tables. This is correct behaviour. Index usage is validated by confirming
   the index exists in the query plan, not necessarily that it was chosen.

---

## Approval Gate

Once all items in the checklist above are ticked off:
- Paste the final summary row from inv2_999_verify.sql here
- Confirm the GRN post result JSON
- Confirm the rollback test PASS

**Only then does Phase 3 (API Layer) begin.**
