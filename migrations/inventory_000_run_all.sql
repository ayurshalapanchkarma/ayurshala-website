-- ============================================================
-- AYURSHALA INVENTORY SYSTEM — MASTER MIGRATION
-- Run this single file in Supabase SQL Editor to set up
-- the complete inventory system across all phases.
--
-- Order:
--   Phase 1  — Categories, Products, Suppliers
--   Phase 2  — Purchases, GRN, Batches
--   Phase 3  — Stock Engine (Transactions, Ledger)
--   Phase 4  — FIFO + Expiry Management
--   Phase 5  — Sales & Dispensing
--   Phase 6  — Treatment Consumption (Panchakarma)
--   Phase 7  — Oil Analytics
--   Phase 8  — Adjustments, Damage Register, Audit Logs
--   Phase 9  — Reports & Dashboard Views
--   Phase 10 — Security, Roles, Future-Ready Schema
-- ============================================================

\i 'inventory_001_phase1_foundation.sql'
\i 'inventory_002_phase2_purchases.sql'
\i 'inventory_003_phase3_stock_engine.sql'
\i 'inventory_004_phase4_batch_expiry.sql'
\i 'inventory_005_phase5_sales.sql'
\i 'inventory_006_phase6_treatment_consumption.sql'
\i 'inventory_007_phase7_oil_tracking.sql'
\i 'inventory_008_phase8_adjustments.sql'
\i 'inventory_009_phase9_reporting.sql'
\i 'inventory_010_phase11_security.sql'

-- NOTE: For Supabase SQL Editor, paste each file's contents directly.
-- The \i command works only with psql CLI.
