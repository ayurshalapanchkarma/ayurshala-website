# Inventory UI Standardization - Implementation Plan

## Status: IN PROGRESS

Components created:
- ✅ `/components/inventory/InventoryActionButton.tsx` - Reusable action button
- ✅ `/components/inventory/DeleteConfirmationDialog.tsx` - Enhanced (generic) confirmation modal

Pages needing fixes:

### Part 1: Replace window.confirm() dialogs

#### Pages with confirm() calls:
1. **purchase-orders/page.tsx** (3 occurrences)
   - Line 190: `handleDelete()` - `if (!confirm('Are you sure?'))`
   - Line 217: `handleSubmit()` - `if (!confirm('Submit this PO for approval?'))`
   - Line 241: `handleApprove()` - `if (!confirm('Approve this PO?'))`

2. **grns/page.tsx** (1 occurrence)
   - Line 222: `handleDelete()` - `if (!confirm('Are you sure?'))`

3. **adjustments/page.tsx** (1 occurrence)
   - Line 357: `handleDeleteAdjustment()` - `if (!confirm('Are you sure you want to delete this adjustment?'))`

#### Pages with state management (already better):
- products/page.tsx - Already uses `setDeleteConfirm()`
- categories/page.tsx - Already uses `setShowDeleteConfirm()`
- suppliers/page.tsx - Already uses `setDeleteConfirm()`
- manufacturers/page.tsx - Already uses `setDeleteConfirm()`
- warehouses/page.tsx - Already uses `setDeleteConfirm()`
- settings/taxes/page.tsx - Already uses `setDeleteConfirm()`

### Part 2: Button Standardization

Need to audit all pages for:
- Non-standardized button colors
- Missing icon button styling (h-9 w-9)
- Inline Tailwind button classes

Pages to check:
- All Operations pages (purchase-orders, grns, batches, adjustments)
- All Masters pages (products, categories, suppliers, manufacturers, warehouses)
- Settings pages

## Implementation Steps

1. **Add DeleteConfirmationDialog state** to pages with confirm()
2. **Replace confirm() calls** with dialog state management
3. **Audit all buttons** and replace with InventoryActionButton
4. **Verify theme support** in light and dark modes
5. **Test all pages** for consistency
6. **Build verification**

## Files to Modify

### Priority 1: Remove confirm() dialogs
- `/app/admin/inventory/purchase-orders/page.tsx`
- `/app/admin/inventory/grns/page.tsx`
- `/app/admin/inventory/adjustments/page.tsx`

### Priority 2: Button standardization
- All operation pages
- All master pages
- Settings pages

## Expected Outcome

✅ No window.confirm() dialogs in entire Inventory module
✅ All buttons use InventoryActionButton component
✅ Consistent styling across light and dark themes
✅ Professional, polished user experience
✅ Zero TypeScript errors
✅ Production build passes

---

**Note**: Due to the large scope of this task, changes will be applied in multiple commits/steps to ensure quality.
