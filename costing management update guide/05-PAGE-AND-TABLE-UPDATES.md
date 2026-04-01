# Guide 05 — Page and Table Updates

## Files to Modify

1. `src/app/admin/costing/page.tsx` — List page with data table, filters, stats
2. `src/app/admin/costing/add/page.tsx` — Add costing page
3. `src/app/admin/costing/[id]/edit/page.tsx` — Edit costing page

---

## 1. Costing List Page (`page.tsx`)

### 1.1 Remove Purchasing Description Dependencies

#### Remove State Variables
```typescript
// DELETE these:
const [purchasingDescriptionFilter, setPurchasingDescriptionFilter] = useState('');
const [purchasingDescriptions, setPurchasingDescriptions] = useState<any[]>([]);
```

#### Remove `fetchDescriptions` Function
```typescript
// DELETE this entire function:
const fetchDescriptions = async () => { ... };
```

#### Remove `fetchDescriptions` useEffect
```typescript
// DELETE this:
useEffect(() => {
  fetchDescriptions();
}, []);
```

#### Update `activeFilterCount` (remove purchasingDescriptionFilter)
```typescript
// BEFORE:
if (purchasingDescriptionFilter) count++;

// AFTER: Remove this line
```

#### Update `resetAllFilters` (remove purchasingDescriptionFilter)
```typescript
// BEFORE:
setPurchasingDescriptionFilter('');

// AFTER: Remove this line
```

#### Update `fetchRecords` (remove purchasingDescription param)
```typescript
// DELETE this line:
if (purchasingDescriptionFilter) params.append('purchasingDescription', purchasingDescriptionFilter);
```

#### Update `useEffect` dependency array for `fetchRecords`
```typescript
// BEFORE:
useEffect(() => {
  fetchRecords();
}, [sizeFilter, purchasingDescriptionFilter, ...]);

// AFTER: Remove purchasingDescriptionFilter from the dependency array
```

### 1.2 Update Table Columns

#### Remove These Columns
```typescript
// DELETE the purchasingDescription column:
columnHelper.accessor('purchasingDescription', { ... })

// DELETE the fabric column:
columnHelper.accessor('fabric', { ... })

// DELETE the fabricPrice column:
columnHelper.accessor('fabricPrice', { ... })
```

#### Update the `size` Column to `sizes`
**Before:**
```typescript
columnHelper.accessor('size', {
  header: () => <span ...>Size</span>,
  cell: info => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
      {info.getValue()}
    </span>
  ),
})
```

**After:**
```typescript
columnHelper.accessor('sizes', {
  header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sizes</span>,
  cell: info => {
    const sizes = info.getValue() || [];
    return (
      <div className="flex flex-wrap gap-1">
        {sizes.slice(0, 3).map((s: string) => (
          <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
            {s}
          </span>
        ))}
        {sizes.length > 3 && (
          <span className="text-[11px] text-slate-400 font-medium">+{sizes.length - 3}</span>
        )}
      </div>
    );
  },
})
```

#### Add a `specialCost` Column (Optional)
Consider adding to show the new category total, or keep just `totalCost`:
```typescript
columnHelper.accessor('specialCost', {
  header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Special Cost</span>,
  cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
})
```

### 1.3 Update Filter Drawer

#### Remove Purchasing Description Filter Section
Delete the entire `<div className="space-y-2">` block containing:
- Label: "Purchasing Description"  
- `<select>` dropdown that maps `purchasingDescriptions`

#### Update Size Filter
The size filter currently filters on a single enum value. Since `sizes` is now an array, the filter can remain as-is (the API handles it with `query.sizes = size` which matches arrays containing the value).

### 1.4 Recommended Final Column Order

```
Design No | Description | Sizes | Total Cost | Selling Price | Gross Profit | Profit % | Actions
```

---

## 2. Add Costing Page (`add/page.tsx`)

### Remove Purchasing Dependencies

#### Remove State
```typescript
// DELETE:
const [descriptions, setDescriptions] = useState<{ description: string; fabric: string }[]>([]);
```

#### Remove `init` Fetch for Descriptions
```typescript
// DELETE these lines from the useEffect:
const res = await axios.get('/api/costing/descriptions');
if (res.data.success) {
  setDescriptions(res.data.data);
}
```

The `loading` state can remain for general initialization, but it should just set `loading` to `false` immediately (or remove the loading state entirely if there's nothing else to fetch).

**Simplify the init:**
```typescript
// No async init needed anymore — just render the form immediately
// Remove the loading state and the loading spinner conditional
```

#### Update Page Header Text
```typescript
// BEFORE:
<p className="mt-0.5 text-sm text-slate-500 font-medium">
  Create a new costing structure linked to your purchasing data.
</p>

// AFTER:
<p className="mt-0.5 text-sm text-slate-500 font-medium">
  Create a new design costing structure.
</p>
```

#### Update CostingForm Props
```tsx
// BEFORE:
<CostingForm
  onSubmit={handleSubmit}
  onCancel={() => router.push('/admin/costing')}
  isLoading={submitting}
  purchasingDescriptions={descriptions}  // REMOVE THIS PROP
/>

// AFTER:
<CostingForm
  onSubmit={handleSubmit}
  onCancel={() => router.push('/admin/costing')}
  isLoading={submitting}
/>
```

---

## 3. Edit Costing Page (`[id]/edit/page.tsx`)

### Remove Purchasing Dependencies

#### Remove State
```typescript
// DELETE:
const [descriptions, setDescriptions] = useState<{ description: string; fabric: string }[]>([]);
```

#### Simplify the `init` Fetch
Remove the descriptions fetch from `Promise.all`:

```typescript
// BEFORE:
const [descRes, dataRes] = await Promise.all([
  axios.get('/api/costing/descriptions'),
  axios.get(`/api/costing/${id}`)
]);
if (descRes.data.success) {
  setDescriptions(descRes.data.data);
}

// AFTER:
const dataRes = await axios.get(`/api/costing/${id}`);
```

#### Update CostingForm Props
```tsx
// BEFORE:
<CostingForm
  initialData={initialData}
  onSubmit={handleSubmit}
  onCancel={() => router.push('/admin/costing')}
  isLoading={submitting}
  purchasingDescriptions={descriptions}  // REMOVE THIS PROP
/>

// AFTER:
<CostingForm
  initialData={initialData}
  onSubmit={handleSubmit}
  onCancel={() => router.push('/admin/costing')}
  isLoading={submitting}
/>
```

---

## Summary of All Removals

| File | What to Remove |
|------|----------------|
| `page.tsx` | `purchasingDescriptionFilter` state, `purchasingDescriptions` state, `fetchDescriptions()`, purchasing description filter in drawer, `purchasingDescription`/`fabric`/`fabricPrice` table columns |
| `add/page.tsx` | `descriptions` state, `/api/costing/descriptions` fetch, `purchasingDescriptions` prop on CostingForm |
| `[id]/edit/page.tsx` | `descriptions` state, `/api/costing/descriptions` fetch from Promise.all, `purchasingDescriptions` prop on CostingForm |
