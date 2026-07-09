# Inventory Settings Audit Report

## Current Status

All settings are saved to `inv_settings` database table.
**However, NONE are being used by the system at runtime.**

Settings persistence is complete. Settings consumption is missing.

## Settings Audit Table

| Setting | DB Save | Used by System | Status | Implementation Required |
|---------|---------|---|---|---|
| **GENERAL** |
| Clinic Name | ✅ | ❌ | Placeholder | Dashboard, Reports, Invoices |
| Default Warehouse | ✅ | ❌ | Placeholder | Auto-fill in Products, PO, GRN, Stock Adj |
| Default Currency | ✅ | ❌ | Placeholder | All currency displays, calculations |
| Timezone | ✅ | ❌ | Placeholder | Timestamps, Reports, Date displays |
| Date Format | ✅ | ❌ | Placeholder | All date displays, Reports, Invoices |
| Fiscal Year Start | ✅ | ❌ | Placeholder | Financial Reports, Numbering |
| **STOCK** |
| Allow Negative Stock | ✅ | ❌ | Placeholder | Stock transaction validation |
| Auto Batch Generation | ✅ | ❌ | Placeholder | GRN processing |
| Low Stock Alert % | ✅ | ❌ | Placeholder | Low Stock Report filter |
| Default Reorder Days | ✅ | ❌ | Placeholder | PO suggestions |
| Default Shelf Life Days | ✅ | ❌ | Placeholder | Batch creation defaults |
| **PURCHASE** |
| PO Number Prefix | ✅ | ❌ | Placeholder | PO number generation |
| Auto PO Numbering | ✅ | ❌ | Placeholder | PO creation |
| PO Approval Required | ✅ | ❌ | Placeholder | PO workflow (not implemented) |
| Default Tax % | ✅ | ❌ | Placeholder | PO/Purchase calculations |
| Default Payment Terms | ✅ | ❌ | Placeholder | PO creation, Invoice generation |
| **BATCH** |
| Expiry Warning Days | ✅ | ❌ | Placeholder | Expiry Report filter |
| FIFO Batch Selection | ✅ | ❌ | Placeholder | Stock issuance logic |
| FEFO Batch Selection | ✅ | ❌ | Placeholder | Stock issuance logic |
| Barcode Generation | ✅ | ❌ | Placeholder | Batch creation |
| **NOTIFICATIONS** |
| Email Expiry Alerts | ✅ | ❌ | Placeholder | Email scheduler (not implemented) |
| Email Low Stock Alerts | ✅ | ❌ | Placeholder | Email scheduler (not implemented) |
| Email Purchase Alerts | ✅ | ❌ | Placeholder | Email scheduler (not implemented) |

## Missing Settings

Should add:
- Administrator Email (default: ayurshalapanchkarma@gmail.com)
- Email Sending Schedule (daily, hourly, instant)
- Email Scheduler Implementation

## Architecture Gap

**What's Built:**
- ✅ Settings API (`/api/inventory/settings/general`) 
- ✅ Settings UI (Frontend form)
- ✅ Database storage (`inv_settings` table)
- ✅ Load/Save/Update operations

**What's Missing:**
- ❌ Any code that reads settings at runtime
- ❌ Business logic integration
- ❌ Scheduled jobs
- ❌ Form auto-fill logic
- ❌ Validation rules that use settings
- ❌ Notification scheduler
- ❌ Timezone/locale providers

## Severity Assessment

**🔴 HIGH** (Blocks workflows):
- Default Warehouse (forms, transactions)
- Timezone (timestamps, reports)
- PO Prefix (numbering)
- Email Notifications (critical missing feature)

**🟡 MEDIUM** (Improves UX):
- Date Format (display formatting)
- FIFO/FEFO (stock selection)
- Batch Auto-Generation (workflow efficiency)

**🟢 LOW** (Nice to have):
- Clinic Name display
- Currency formatting
- Barcode generation

### Phase 1: UI Refinement (No Functional Changes)
- [ ] Change Reload → Cancel button
- [ ] Cancel should discard unsaved changes
- [ ] Add proper button styling
- [ ] Mark "Coming Soon" on non-functional settings

### Phase 2: Mark Non-Functional Settings  
Settings to disable with "Coming Soon":
- Timezone (uses system default)
- Date Format (uses system default)
- Fiscal Year Start (uses default)
- PO Approval Required (no approval workflow)
- Auto Batch Generation (feature not implemented)
- FIFO/FEFO Batch Selection (logic not implemented)
- Barcode Generation (feature not implemented)
- All Notification email settings (scheduler not implemented)

### Phase 3: Implement Missing Features
1. Use Default Warehouse in transactions
2. Use Date Format in all displays
3. Use Low Stock % in reports
4. Use PO prefix in numbering
5. Implement email notifications

---

## Notification System Analysis

**Current Status**: NOT IMPLEMENTED

### Questions:
1. **Are email switches connected?** → NO (Placeholder)
2. **What scheduler?** → None exists
3. **Send frequency?** → Not defined
4. **Recipient email?** → Not defined
5. **Send immediately or batched?** → Not defined

### To Implement Properly:

Need to decide:
- [ ] Use Vercel Cron (free tier limited)
- [ ] Use Supabase Edge Function + Cron
- [ ] Use external service (SendGrid, etc.)
- [ ] Email recipient strategy
- [ ] Send frequency (daily 8 AM, weekly, etc.)

---

## Timezone Implementation Notes

Currently using hardcoded 'Asia/Kolkata' in:
- Dashboard metrics
- Stock Ledger date filters
- Report date displays

Should use `settings.timezone` instead.

---

## Status
**BLOCKING ISSUE**: Settings page appears functional but is 100% placeholder.
Users can edit but changes have NO EFFECT on system behavior.

**Recommendation**: Disable non-functional settings with "Coming Soon" badge.
Implement functionality in phases.
