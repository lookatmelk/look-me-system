# Guide 05 — Page and Table Updates

## Files to Modify

1. `src/app/admin/orders/page.tsx` — Orders list page (table, filters, stats)
2. `src/app/admin/orders/add/page.tsx` — Add order page
3. `src/app/admin/orders/[id]/edit/page.tsx` — Edit order page

---

## Change 1: Orders List Page (`page.tsx`)

### 1a. Add `sampleNo` Column to Table

Add a new column after `designNo` in the columns definition:

```typescript
// After the designNo column accessor:
columnHelper.accessor('sampleNo', {
  header: () => (
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
      Sample No
    </span>
  ),
  cell: info => {
    const val = info.getValue();
    return val
      ? <span className="font-semibold text-slate-700 text-sm">{val}</span>
      : <span className="text-slate-300">—</span>;
  },
}),
```

Insert this right after the `designNo` column in the `columns` array.

### 1b. Update Column Order

The new column order should be:
1. Design No
2. **Sample No** (NEW)
3. Description
4. Shop Allocations
5. Design Total
6. Projected Revenue
7. Status
8. Actions

### 1c. Add `sampleNo` to the Search

The `globalFilter` in `@tanstack/react-table` already handles client-side searching across all columns. However, the API search (`fetchRecords`) only searches `designNo` and `description`. This was updated in Guide 02 to also search `sampleNo` on the server side.

No additional client-side changes needed.

### 1d. Update the DesignOption Interface (Page Level)

The page has its own local `DesignOption` interface used for filter dropdowns:

```typescript
interface DesignOption {
  _id: string;
  designNo: string;
  description: string;
}
```

This interface is **fine as-is** — it's only used for the filter dropdown labels, not for costing field references.

### 1e. Add `sampleNo` Filter to the Filter Drawer (Optional)

If desired, add a `sampleNo` text filter to the Advanced Filter Drawer:

```typescript
// State
const [sampleNoFilter, setSampleNoFilter] = useState('');

// In activeFilterCount
if (sampleNoFilter) count++;

// In resetAllFilters
setSampleNoFilter('');

// In fetchRecords params
if (sampleNoFilter) params.append('sampleNo', sampleNoFilter);

// In useEffect dependency array for fetchRecords
// Add sampleNoFilter to the dependency array
```

Add the UI in the filter drawer, after the Design Number filter:

```tsx
{/* Sample Number Filter */}
<div className="space-y-2">
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
    Sample Number
  </label>
  <input
    type="text"
    value={sampleNoFilter}
    onChange={(e) => setSampleNoFilter(e.target.value)}
    placeholder="Enter sample number..."
    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm"
  />
</div>
```

---

## Change 2: Add Order Page (`add/page.tsx`)

### 2a. Update `DesignOption` Import

The `DesignOption` interface is imported from `OrderForm.tsx`. Since we're updating the OrderForm to change `size: string` to `sizes: string[]`, the import will automatically get the new type.

No changes needed in the import itself — just ensure it still imports from `'@/components/orders/OrderForm'`.

### 2b. No Other Changes Needed

The Add Order page is a thin wrapper that:
1. Fetches designs
2. Renders `<OrderForm>`
3. Handles submit via `POST /api/orders`

Since the OrderForm rewrite handles all the structural changes, and the API changes handle the data model, the page component only needs to confirm:
- The `DesignOption` type is correct (it will be, via the import)
- The submit handler sends the data to the correct endpoint (unchanged)

The page file can remain **as-is** after the OrderForm is rewritten.

---

## Change 3: Edit Order Page (`[id]/edit/page.tsx`)

### 3a. Same as Add Page

The edit page is similarly a thin wrapper. It:
1. Fetches the existing order
2. Fetches available designs
3. Renders `<OrderForm initialData={orderData}>`
4. Handles submit via `PUT /api/orders/:id`

Since the OrderForm rewrite handles all internal changes, and the API route changes are in Guide 02, **no changes needed** to this page file.

However, verify that the `DesignOption` import still works after the OrderForm rewrite.

---

## Summary of Changes

| File | Changes |
|------|---------|
| `page.tsx` (orders list) | Add `sampleNo` column, optionally add `sampleNo` filter to drawer |
| `add/page.tsx` | No changes (inherits from OrderForm rewrite) |
| `[id]/edit/page.tsx` | No changes (inherits from OrderForm rewrite) |

---

## Verification

1. The orders table should show a "Sample No" column with data where available and `—` dashes where empty.
2. The table should still sort, filter, and paginate correctly.
3. The filter drawer (if updated) should allow filtering by sample number.
4. Adding a new order via the Add page should work with the new single-form layout.
5. Editing an existing order should pre-populate all fields including `sampleNo` and shop allocations.
