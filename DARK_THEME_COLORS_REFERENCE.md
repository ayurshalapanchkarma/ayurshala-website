# Dark Theme Color Reference - Operations Pages

## Status Badge Colors

### Applied to: Purchase Orders, GRNs, Stock Adjustments

| Status | Light Mode | Dark Mode |
|--------|-----------|-----------|
| Draft | `bg-slate-100 text-slate-700` | `dark:bg-slate-700 dark:text-slate-100` |
| Pending/Posted | `bg-yellow-100 text-yellow-800` / `bg-blue-100 text-blue-700` | `dark:bg-yellow-900/40 dark:text-yellow-300` / `dark:bg-blue-900/40 dark:text-blue-300` |
| Approved/Received | `bg-green-100 text-green-800` / `bg-purple-100 text-purple-800` | `dark:bg-green-900/40 dark:text-green-300` / `dark:bg-purple-900/40 dark:text-purple-300` |
| Cancelled | `bg-red-100 text-red-700` | `dark:bg-red-900/40 dark:text-red-300` |

---

## Action Icon Button Styling

### Applied to: Purchase Orders, GRNs, Stock Adjustments

```tailwind
h-9 w-9 
rounded-lg 
border border-slate-700 
bg-slate-800 
hover:bg-slate-700 
transition 
flex items-center justify-center 
dark:border-slate-600 
dark:bg-slate-800
```

### Icon Colors

| Action | Icon | Color | Hover |
|--------|------|-------|-------|
| Preview | Eye | `text-sky-400` | `hover:text-sky-300` |
| Edit | Pencil/Edit2 | `text-amber-400` | `hover:text-amber-300` |
| Delete/Cancel | Trash2 | `text-red-500` | `hover:text-red-400` |
| Approve | CheckCircle | `text-green-500` | `hover:text-green-400` |

### Icon Size
- 20px (updated from 18px for better visibility)

---

## Filter Control Styling

### Applied to: All 4 Operations Pages

**Search Input:**
```tailwind
w-full pl-10 pr-4 py-2 
border border-gray-300 
dark:border-slate-700 
rounded-lg 
focus:outline-none focus:ring-2 focus:ring-blue-500 
dark:bg-slate-800 
dark:text-white 
placeholder-gray-500 
dark:placeholder-slate-400
```

**Dropdown Select:**
```tailwind
px-4 py-2 
border border-gray-300 
dark:border-slate-700 
rounded-lg 
focus:outline-none focus:ring-2 focus:ring-blue-500 
dark:bg-slate-800 
dark:text-white
```

---

## Summary of Key Changes

1. **Background Colors** - Darker slate tones for better contrast
2. **Text Colors** - Lighter text (slate-100, yellow-300, green-300, red-300)
3. **Button Backgrounds** - Consistent slate-800 with slate-700 hover
4. **Icon Sizing** - Increased from 18px to 20px for visibility
5. **Border Colors** - Consistent slate-700 (light) / slate-600 (dark)

---

## Testing in Dark Mode

To verify these changes:

1. Toggle dark mode in your browser/system
2. Navigate to:
   - `/admin/inventory/purchase-orders`
   - `/admin/inventory/grns`
   - `/admin/inventory/batches`
   - `/admin/inventory/adjustments`

3. Check:
   - Status badges are easily readable
   - Action buttons have clear icons
   - Filter inputs are accessible
   - Hover states are visible
   - All pages look consistent

---

## Backward Compatibility

- Light mode styling unchanged
- All changes use Tailwind `dark:` prefix
- No conflicting styles
- Production-ready
