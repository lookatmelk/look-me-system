# Guide 04 — Detail Modal Update (CostingDetailModal.tsx)

## File to Modify

`src/components/costing/CostingDetailModal.tsx`

## Current State

The modal displays:
1. **Cost Summary Hero** — Total Cost, Selling Price, Profit (with percentage badge)
2. **Design Information** — `designNo`, `description`, `purchasingDescription`, `size`, `fabric`
3. **Cost Breakdown** — Flat list of `fabricPrice`, `fabricConsumption`, `fabricCost`, `printBelt`, `threadLabelsPollyBags`, `fusingElasticButtonZip`, `standardMinutesValue`, `sewingCost`, `accessoriesCost`, `totalCost`

## Required Changes

### 1. Update Design Information Section

**Remove:**
- `purchasingDescription` field (DetailField + import reference)
- `fabric` field (DetailField)

**Change:**
- `size` (single value) → `sizes` (array of tags)

**After:**
```
Design Information:
  Design No:     1009
  Description:   FRONT GATHARING LONG SLEEVE SHORT FROCK
  Sizes:         [S] [M] [L] [XL]    ← Display as tag chips
```

Render sizes as an array of chips/badges:
```tsx
<DetailField
  icon={<Ruler className="w-4 h-4" />}
  label="Sizes"
  value={
    <div className="flex flex-wrap gap-1.5">
      {(record.sizes || []).map((size: string) => (
        <span
          key={size}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
        >
          {size}
        </span>
      ))}
    </div>
  }
/>
```

### 2. Rewrite Cost Breakdown Section

Replace the flat list of cost rows with **category tables**.

#### Layout: 4 Category Sections

Each category gets its own sub-section with a mini table:

```
─── SEWING ────────────────────────────────────────────
Type           Description                Unit  Rate    CON    Amount
SEWING         CUTTING, SEWING, PACKING   SMV   10.00   25.00  250.00
                                          Subtotal:            250.00

─── FABRIC (incl. 5% wastage) ─────────────────────────
Type           Description                Unit  Rate    CON    Amount
FABRIC         VISCOSE PRINTED            YADS  300.00  1.00   315.00
LILING         LINING                     YADS  120.00  0.75    94.50
FUSING         DOT FUSING                 YADS   45.00  0.05     2.36
                                          Subtotal:            411.86

─── ACCESSORIES ───────────────────────────────────────
Type           Description                Unit  Rate    CON    Amount
THREADS        COTTON AND YARN            CONN  160.00  0.10    16.00
ELASTIC        1" ELASTIC                 ROLL  400.00  0.50   200.00
POLLY BAGS     11 X14 POLLY BAGS          NOS     9.50  1.00    14.96
...
                                          Subtotal:            360.96

─── SPECIAL ───────────────────────────────────────────
Type           Description                Unit  Rate    CON    Amount
EMB/PRINT      FRONT PRINT                NOS    60.00  1.00    60.00
                                          Subtotal:             60.00
```

#### Implementation Pattern

For each category, create a reusable section:

```tsx
function CategorySection({
  title,
  items,
  subtotal,
  note,
}: {
  title: string;
  items: any[];
  subtotal: number;
  note?: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {note && <span className="text-[10px] text-slate-400 font-medium">{note}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="text-left py-1 pr-3">Type</th>
              <th className="text-left py-1 pr-3">Description</th>
              <th className="text-left py-1 pr-3">Unit</th>
              <th className="text-right py-1 pr-3">Rate</th>
              <th className="text-right py-1 pr-3">CON</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} className="border-t border-slate-50">
                <td className="py-1.5 pr-3 font-semibold text-slate-700">{item.type}</td>
                <td className="py-1.5 pr-3 text-slate-600">{item.description || '—'}</td>
                <td className="py-1.5 pr-3 text-slate-500 font-mono text-xs">{item.unit}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-slate-700">
                  {item.rate?.toFixed(2)}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono text-slate-700">
                  {item.consumption?.toFixed(item.consumption < 1 ? 4 : 2)}
                </td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                  {item.amount?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td colSpan={5} className="py-2 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-3">
                Subtotal
              </td>
              <td className="py-2 text-right font-mono font-black text-slate-900">
                {subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
```

#### Render in the modal:

```tsx
{/* Cost Breakdown */}
<div className="px-6 py-5 border-b border-slate-100 space-y-6">
  <CategorySection
    title="Sewing"
    items={record.sewingItems}
    subtotal={record.sewingCost}
  />
  <CategorySection
    title="Fabric"
    items={record.fabricItems}
    subtotal={record.fabricCost}
    note="(incl. 5% wastage)"
  />
  <CategorySection
    title="Accessories"
    items={record.accessoriesItems}
    subtotal={record.accessoriesCost}
  />
  <CategorySection
    title="Special"
    items={record.specialItems}
    subtotal={record.specialCost}
  />
</div>
```

### 3. Update Cost Summary Hero

Add `specialCost` alongside or update the 3-column layout. The hero section currently shows:
- Total Cost
- Selling Price
- Profit + Margin%

This layout can remain, but ensure it uses the new `totalCost` which now includes `specialCost`.

### 4. Remove Unused Imports

Remove the `Scissors` import from lucide-react since the `fabric` field is no longer displayed:
```typescript
// Before:
import { Hash, Package, Ruler, Scissors } from "lucide-react";

// After:
import { Hash, Package, Ruler } from "lucide-react";
```

### 5. Keep CostRow for Grand Totals (Optional)

Optionally, below the 4 category tables, add a grand total section using the existing `CostRow` component:

```tsx
<div className="px-6 py-5 border-b border-slate-100">
  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Grand Total</p>
  <div className="space-y-2.5">
    <CostRow label="Sewing Cost" value={record.sewingCost} />
    <CostRow label="Fabric Cost" value={record.fabricCost} />
    <CostRow label="Accessories Cost" value={record.accessoriesCost} />
    <CostRow label="Special Cost" value={record.specialCost} />
    <div className="border-t border-slate-200 my-2" />
    <CostRow label="TOTAL COST" value={record.totalCost} highlight bold />
  </div>
</div>
```

---

## Full List of Changes

| Change Type | Detail |
|---|---|
| Remove | `purchasingDescription` DetailField |
| Remove | `fabric` DetailField |
| Remove | `Scissors` import |
| Change | `size` → `sizes` array display |
| Replace | Flat cost breakdown → 4 category tables |
| Add | `CategorySection` reusable sub-component |
| Add | `specialCost` to summary display |
| Keep | Cost Summary Hero (Total Cost, Selling Price, Profit) |
| Keep | `CostRow` helper component |
| Keep | `DetailField` helper component |
