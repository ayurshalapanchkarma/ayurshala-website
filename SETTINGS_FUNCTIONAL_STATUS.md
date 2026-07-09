# Inventory Settings - Functional Status Report

## Commit
`99c81b8`

## Summary
**Total Settings: 23**
- Saved to DB: ✅ 23/23 (100%)
- Used by System: ❌ 0/23 (0%)
- **Status: 100% PLACEHOLDER**

---

## Complete Audit Table

| # | Setting Name | Category | Saved to DB | Used by System | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | Clinic Name | General | ✅ | ❌ | Placeholder | Should show in dashboard, reports |
| 2 | Default Warehouse | General | ✅ | ❌ | Placeholder | Should auto-fill in forms |
| 3 | Default Currency | General | ✅ | ❌ | Placeholder | Should format all currency displays |
| 4 | Timezone | General | ✅ | ❌ | Placeholder | Hardcoded to Asia/Kolkata everywhere |
| 5 | Date Format | General | ✅ | ❌ | Placeholder | Should apply to all date displays |
| 6 | Fiscal Year Start | General | ✅ | ❌ | Placeholder | Should affect financial reports |
| 7 | Allow Negative Stock | Stock | ✅ | ❌ | Placeholder | Should validate stock transactions |
| 8 | Auto Batch Generation | Stock | ✅ | ❌ | Placeholder | Feature not implemented |
| 9 | Low Stock Alert % | Stock | ✅ | ❌ | Placeholder | Should filter Low Stock report |
| 10 | Default Reorder Days | Stock | ✅ | ❌ | Placeholder | Should suggest PO quantities |
| 11 | Default Shelf Life Days | Stock | ✅ | ❌ | Placeholder | Should default when creating batches |
| 12 | PO Number Prefix | Purchase | ✅ | ❌ | Placeholder | Should generate PO-000001, etc. |
| 13 | Auto PO Numbering | Purchase | ✅ | ❌ | Placeholder | Should auto-assign PO numbers |
| 14 | PO Approval Required | Purchase | ✅ | ❌ | Placeholder | Workflow not implemented |
| 15 | Default Tax % | Purchase | ✅ | ❌ | Placeholder | Should default in PO creation |
| 16 | Default Payment Terms | Purchase | ✅ | ❌ | Placeholder | Should default in invoices |
| 17 | Expiry Warning Days | Batch | ✅ | ❌ | Placeholder | Should filter Expiry report |
| 18 | FIFO Batch Selection | Batch | ✅ | ❌ | Placeholder | Logic not implemented |
| 19 | FEFO Batch Selection | Batch | ✅ | ❌ | Placeholder | Logic not implemented |
| 20 | Barcode Generation | Batch | ✅ | ❌ | Placeholder | Feature not implemented |
| 21 | Email Expiry Alerts | Notifications | ✅ | ❌ | Placeholder | Scheduler not implemented |
| 22 | Email Low Stock Alerts | Notifications | ✅ | ❌ | Placeholder | Scheduler not implemented |
| 23 | Email Purchase Alerts | Notifications | ✅ | ❌ | Placeholder | Scheduler not implemented |

---

## Breakdown by Category

### General Settings (6 settings)
| Setting | DB | Used | Status |
|---|---|---|---|
| Clinic Name | ✅ | ❌ | Placeholder |
| Default Warehouse | ✅ | ❌ | Placeholder |
| Default Currency | ✅ | ❌ | Placeholder |
| Timezone | ✅ | ❌ | Placeholder |
| Date Format | ✅ | ❌ | Placeholder |
| Fiscal Year Start | ✅ | ❌ | Placeholder |

### Stock Settings (5 settings)
| Setting | DB | Used | Status |
|---|---|---|---|
| Allow Negative Stock | ✅ | ❌ | Placeholder |
| Auto Batch Generation | ✅ | ❌ | Placeholder |
| Low Stock Alert % | ✅ | ❌ | Placeholder |
| Default Reorder Days | ✅ | ❌ | Placeholder |
| Default Shelf Life Days | ✅ | ❌ | Placeholder |

### Purchase Settings (5 settings)
| Setting | DB | Used | Status |
|---|---|---|---|
| PO Number Prefix | ✅ | ❌ | Placeholder |
| Auto PO Numbering | ✅ | ❌ | Placeholder |
| PO Approval Required | ✅ | ❌ | Placeholder |
| Default Tax % | ✅ | ❌ | Placeholder |
| Default Payment Terms | ✅ | ❌ | Placeholder |

### Batch Settings (4 settings)
| Setting | DB | Used | Status |
|---|---|---|---|
| Expiry Warning Days | ✅ | ❌ | Placeholder |
| FIFO Batch Selection | ✅ | ❌ | Placeholder |
| FEFO Batch Selection | ✅ | ❌ | Placeholder |
| Barcode Generation | ✅ | ❌ | Placeholder |

### Notification Settings (3 settings)
| Setting | DB | Used | Status |
|---|---|---|---|
| Email Expiry Alerts | ✅ | ❌ | Placeholder |
| Email Low Stock Alerts | ✅ | ❌ | Placeholder |
| Email Purchase Alerts | ✅ | ❌ | Placeholder |

---

## Missing Essential Settings

Should be added to Settings page:

1. **Administrator Email** (Default: ayurshalapanchkarma@gmail.com)
   - Used for notification emails
   - Should be configurable
   
2. **Email Sending Schedule**
   - How often to send alerts?
   - Daily at what time?
   - Immediate or batched?
   
3. **Email Scheduler Type**
   - Vercel Cron
   - Supabase Edge Function
   - External service (SendGrid)

---

## UI Changes Implemented

✅ Replaced "Reload" button with "Cancel" button
✅ Cancel discards unsaved changes and reloads from DB
✅ No API call on Cancel (just local state reload)

---

## Recommendations

### Immediate Actions
1. Mark non-functional settings with "🔜 Coming Soon" badge
2. Disable input for placeholder settings (read-only)
3. Add help text explaining what each setting does
4. Document which settings are actually working

### Phase 1: Quick Wins (1-2 hours each)
- [ ] Use Clinic Name in dashboard header
- [ ] Use Default Warehouse in product forms
- [ ] Use Low Stock Alert % in reports filter
- [ ] Use Expiry Warning Days in expiry report
- [ ] Use PO Prefix in PO number generation

### Phase 2: Medium Effort (3-5 hours each)
- [ ] Implement Timezone usage (all timestamps, reports)
- [ ] Implement Date Format (all displays)
- [ ] Use Default Tax in PO creation
- [ ] Use Default Payment Terms in invoices

### Phase 3: Complex Features (8+ hours)
- [ ] Implement email notification scheduler
- [ ] Implement FIFO/FEFO batch selection logic
- [ ] Implement Auto Batch Generation on GRN
- [ ] Implement PO Approval Workflow
- [ ] Implement Barcode Generation

---

## Testing Verification

To verify settings are working:
1. Edit a setting
2. Click Save
3. Refresh page
4. Verify value persists from DB ✅
5. Verify system behavior changes ❓ (Currently NO)

---

## Status
**BLOCKING**: Settings page is 100% non-functional.
Users can edit settings but they have NO EFFECT on system.

**Recommended**: Disable all settings with "Coming Soon" badge
until actual implementation is done.
