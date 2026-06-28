# Discharge Summaries Database Setup

The Discharge Summary module requires the `discharge_summaries` table in Supabase.

## To Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Copy the contents of `migrations/discharge_summaries_001.sql`
4. Paste into the SQL editor
5. Click "Run"

### Option 2: Using supabase-cli

```bash
supabase db push
```

## After Migration

The following operations should work:

- ✓ Save Discharge Summary (database insert)
- ✓ Refresh page (data persists)
- ✓ Download PDF

## Verification

In Supabase SQL Editor, run:

```sql
SELECT COUNT(*) FROM discharge_summaries;
```

Should return a row with count (initially 0).
