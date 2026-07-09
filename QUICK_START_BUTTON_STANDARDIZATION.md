# Quick Start: Button Standardization & Confirm Dialog Removal

## 🎯 What Was Done (Phase 1)

✅ Created `InventoryActionButton.tsx` - Reusable button component with variants
✅ Enhanced `DeleteConfirmationDialog.tsx` - Generic confirmation modal
✅ Migrated `purchase-orders/page.tsx` - Removed 3x confirm() calls
✅ Zero TypeScript errors
✅ Build passes (208/208 pages)

---

## 🔄 What Needs to be Done (Phase 2)

### Quick Tasks (< 30 mins each)

#### Task 1: Migrate GRNs Page
**File**: `/app/admin/inventory/grns/page.tsx`

**Changes**:
1. Add import: `import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog'`
2. Add state: `const [deleteConfirmGRN, setDeleteConfirmGRN] = useState<GRN | null>(null)`
3. Update `handleDelete()` function - remove the `if (!confirm('Are you sure?')) return` line
4. Find delete button and change: `onClick={() => handleDelete(grn.uuid)}` → `onClick={() => setDeleteConfirmGRN(grn)}`
5. Add at end of component:
```tsx
<DeleteConfirmationDialog
  isOpen={!!deleteConfirmGRN}
  itemName={deleteConfirmGRN?.grn_number}
  title="Cancel GRN?"
  message="Are you sure you want to cancel this GRN? This action cannot be undone."
  confirmText="Cancel GRN"
  onConfirm={() => deleteConfirmGRN && handleDelete(deleteConfirmGRN.uuid)}
  onCancel={() => setDeleteConfirmGRN(null)}
/>
```

#### Task 2: Migrate Adjustments Page
**File**: `/app/admin/inventory/adjustments/page.tsx`

**Changes**:
1. Add import: `import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog'`
2. Add state: `const [deleteConfirmAdj, setDeleteConfirmAdj] = useState<StockAdjustment | null>(null)`
3. Update `handleDeleteAdjustment()` - remove confirm line
4. Find delete button and change: `onClick={() => handleDeleteAdjustment(adj.uuid)}` → `onClick={() => setDeleteConfirmAdj(adj)}`
5. Add dialog at end

---

## 🎨 Button Standardization (Phase 3+)

### Import InventoryActionButton
```tsx
import InventoryActionButton from '@/components/inventory/InventoryActionButton'
```

### Replace inline buttons

**Before**:
```tsx
<button
  onClick={onClick}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
>
  Create
</button>
```

**After**:
```tsx
<InventoryActionButton
  variant="primary"
  onClick={onClick}
>
  Create
</InventoryActionButton>
```

### Icon buttons

**Before**:
```tsx
<button onClick={handleDelete} className="text-red-600 hover:text-red-800">
  <Trash2 size={18} />
</button>
```

**After**:
```tsx
<InventoryActionButton
  variant="delete"
  icon={<Trash2 size={20} />}
  onClick={() => setDeleteConfirm(item)}
/>
```

---

## ✅ Acceptance Criteria

As of Phase 1:

| Criterion | Status |
|-----------|--------|
| No black/inconsistent buttons | 🟡 50% |
| All pages use InventoryActionButton | 🟡 5% |
| Light theme consistent | 🟡 20% |
| Dark theme consistent | 🟡 20% |
| No browser confirmation dialogs | 🟡 75% |
| Custom confirmation modal | ✅ 100% |
| Works responsively | ✅ 100% |
| Zero TypeScript errors | ✅ 100% |
| Production build passes | ✅ 100% |

---

## 🚀 How to Deploy

1. **Complete Phase 2**: Migrate remaining pages with confirm()
2. **Test**: Verify all dialogs work in light & dark modes
3. **Build**: `npm run build` - should pass with 0 errors
4. **Deploy**: All changes are UI-only, safe to deploy

---

## 📚 Component Reference

### InventoryActionButton

```tsx
<InventoryActionButton
  variant="primary" | "secondary" | "preview" | "edit" | "delete" | "ghost"
  onClick={() => {}}
  disabled={false}
  icon={<IconComponent />}
  title="Hover text"
  size="sm" | "md" | "lg"
  fullWidth={false}
>
  Optional button text
</InventoryActionButton>
```

### DeleteConfirmationDialog

```tsx
<DeleteConfirmationDialog
  isOpen={boolean}
  itemName="Item to delete"
  title="Custom title"
  message="Custom message"
  confirmText="Confirm"
  onConfirm={async () => {}}
  onCancel={() => {}}
  error={errorMessage}
  disableConfirm={false}
/>
```

---

## 📍 Files to Modify

### Must modify (removes confirm dialogs):
1. ✅ `/app/admin/inventory/purchase-orders/page.tsx` - DONE
2. ⏳ `/app/admin/inventory/grns/page.tsx`
3. ⏳ `/app/admin/inventory/adjustments/page.tsx`

### Should refactor (button standardization):
- ⏳ All Operations pages
- ⏳ All Masters pages
- ⏳ Settings pages

### Already good (use state management):
- ✅ Products
- ✅ Categories
- ✅ Suppliers
- ✅ Manufacturers
- ✅ Warehouses
- ✅ Tax Master

---

## 🧪 Testing

For each page:
1. Click delete → Dialog appears ✓
2. Click cancel → Dialog closes ✓
3. Click confirm → API executes, toast shows ✓
4. Test in light mode ✓
5. Test in dark mode ✓
6. Press ESC → Dialog closes ✓
7. Click outside → Dialog closes ✓

---

## ⚡ Quick Reference

**Confirm dialog location**: Line ~222 in GRNs, ~357 in Adjustments
**Delete button location**: Search `handleDelete` in each file
**Button component**: Ready to use at `/components/inventory/InventoryActionButton.tsx`
**Dialog component**: Ready to use at `/components/inventory/DeleteConfirmationDialog.tsx`

---

## 💾 Build Command

```bash
npm run build
```

Expected: `✓ Compiled successfully` + `208/208 pages`

---

**Status**: Phase 1 Complete, Phase 2 Ready to Start
**Effort**: ~30 mins per page for migrations
**Impact**: Professional UI, no browser dialogs, consistent buttons
