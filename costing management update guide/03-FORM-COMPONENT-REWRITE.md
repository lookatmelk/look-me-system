# Guide 03 — Form Component Rewrite (CostingForm.tsx)

## File to Rewrite

`src/components/costing/CostingForm.tsx`

## Current State

- Uses a **3-step stepper** form (Step 1: Design Details, Step 2: Cost Components, Step 3: Pricing Summary)
- Requires `purchasingDescriptions` prop for the purchasing dropdown
- Uses `react-hook-form` with `zodResolver` and `zod` schema
- Has flat fields: `fabricPrice`, `fabricConsumption`, `printBelt`, `threadLabelsPollyBags`, etc.

## New Requirements

1. **Single scrollable form** — no stepper, all fields visible at once
2. **No purchasing relationship** — remove `purchasingDescriptions` prop, the purchasing description dropdown, and the fabric auto-mapping
3. **Multiple sizes** — instead of a single `size` dropdown, allow user to add multiple size tags
4. **Dynamic line item rows** — 4 sections (Sewing, Fabric, Accessories, Special) each with "Add Row" / "Remove Row" functionality
5. **Real-time amount calculation** per row and per category total
6. **Live summary card** at the bottom showing all category totals, total cost, selling price, profit, margin %
7. **Enter key navigation** (covered in Guide 06, but the form must use `ref` array for fields)

---

## Complete Rewrite Specification

### Props Interface

```typescript
interface CostingFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  // REMOVED: purchasingDescriptions prop
}
```

### State Management

Use `react-hook-form` with `useFieldArray` for dynamic rows. The form needs these field arrays:
- `sewingItems` 
- `fabricItems`
- `accessoriesItems`
- `specialItems`
- `sizes`

### Zod Schema

```typescript
const costLineItemSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  description: z.string().default(''),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  consumption: z.number().min(0, 'Consumption cannot be negative'),
});

const costingSchema = z.object({
  designNo: z.string().min(1, 'Design number is required'),
  description: z.string().min(1, 'Design description is required'),
  sizes: z.array(z.string().min(1)).min(1, 'At least one size is required'),
  sewingItems: z.array(costLineItemSchema).default([]),
  fabricItems: z.array(costLineItemSchema).default([]),
  accessoriesItems: z.array(costLineItemSchema).default([]),
  specialItems: z.array(costLineItemSchema).default([]),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
});
```

### Default Values

```typescript
const emptyLineItem = {
  type: '',
  description: '',
  unit: '',
  rate: 0,
  consumption: 0,
};

const defaultValues = {
  designNo: '',
  description: '',
  sizes: [],
  sewingItems: [{ ...emptyLineItem, unit: 'SMV' }],      // Start with 1 row
  fabricItems: [{ ...emptyLineItem, unit: 'YADS' }],      // Start with 1 row
  accessoriesItems: [{ ...emptyLineItem, unit: 'NOS' }],  // Start with 1 row
  specialItems: [{ ...emptyLineItem, unit: 'NOS' }],      // Start with 1 row
  sellingPrice: 0,
};
```

---

## Form Layout Specification

### Section 1: Design Information

A card section containing:

| Field         | Type     | Span     | Notes                             |
|---------------|----------|----------|-----------------------------------|
| Design No     | text     | half     | Required, unique identifier       |
| Sizes         | tag input| half     | User types a size and presses Enter or a comma to add it as a tag. Tags can be removed with × button. |
| Description   | text     | full     | Design description (free text)    |

#### Sizes Input Behavior

The sizes field should work as a **tag input**:
1. User types a size string (e.g., "M") into a text input
2. Pressing `Enter` or `,` adds it as a tag/chip below the input
3. Each tag has an `×` button to remove it
4. The underlying form state stores an array: `["S", "M", "L"]`
5. Display tags as styled chips (e.g., `bg-slate-100 text-slate-700 rounded-full px-2.5 py-0.5`)
6. Duplicate sizes should not be allowed — silently ignore duplicates

---

### Section 2: Sewing Items

A card section with a header "Sewing" and an "Add Row" button.

Each row is a horizontal group of fields:

| Field       | Type   | Width | Placeholder          |
|-------------|--------|-------|----------------------|
| Type        | text   | ~18%  | e.g. "SEWING"        |
| Description | text   | ~28%  | e.g. "CUTTING, SEWING, PACKING" |
| Unit        | text   | ~10%  | e.g. "SMV"           |
| Rate        | number | ~15%  | 0.00                 |
| CON         | number | ~15%  | 0.00                 |
| Amount      | display| ~14%  | Auto-calculated, read-only |
| ×           | button | icon  | Remove row           |

**Amount formula**: `Rate × CON`

**Display**: Show calculated amount for each row in green monospace text. Show a row total below the section:
```
SEWING COST: 250.00
```

---

### Section 3: Fabric Items

Same layout as Sewing Items, with header "Fabric" and "Add Row" button.

**Amount formula**: `(Rate × CON) + ((Rate × CON) / 100 × 5)` — includes 5% wastage

**Important**: This is the ONLY category with the 5% wastage formula. All other categories use simple `Rate × CON`.

**Display**: Show a note like "(incl. 5% wastage)" next to the section header. Show category total:
```
FABRIC COST: 411.86
```

---

### Section 4: Accessories Items

Same layout as Sewing Items, with header "Accessories" and "Add Row" button.

**Amount formula**: `Rate × CON`

Category total:
```
ACCESSORIES COST: 360.96
```

---

### Section 5: Special Items

Same layout as Sewing Items, with header "Special" and "Add Row" button.

**Amount formula**: `Rate × CON`

Category total:
```
SPECIAL COST: 60.00
```

---

### Section 6: Pricing & Summary

A two-column layout:

**Left column** — Input field:
| Field         | Type   | Notes                    |
|---------------|--------|--------------------------|
| Selling Price | number | Required, large font     |

**Right column** — Dynamic Summary Card (Read-only display):

```
SUMMARY
──────────────────────────
Sewing Cost        250.00
Fabric Cost        411.86
Accessories Cost   360.96
Special Cost        60.00
──────────────────────────
TOTAL COST       1,082.82
SELLING PRICE    1,200.00
──────────────────────────
PROFIT             117.18
MARGIN %           9.77%
```

Color-code the margin percentage:
- ≥ 30%: Green badge
- ≥ 20% and < 30%: Amber badge
- < 20%: Red badge

---

### Section 7: Action Footer

A sticky/fixed footer at the bottom of the form with:
- **Cancel** button (outline style, calls `onCancel`)
- **Save / Create Record** button (primary green gradient, calls `handleSubmit`)

---

## Real-Time Calculation Logic

All calculations must update in real-time as the user types. Use `watch()` from react-hook-form to observe all line item values.

```typescript
// Watch all line items
const sewingItems = watch('sewingItems');
const fabricItems = watch('fabricItems');
const accessoriesItems = watch('accessoriesItems');
const specialItems = watch('specialItems');
const sellingPrice = watch('sellingPrice');

// Calculate amounts
const calcSewingAmount = (item) => Number((item.rate * item.consumption).toFixed(2));
const calcFabricAmount = (item) => {
  const base = item.rate * item.consumption;
  return Number((base + (base / 100) * 5).toFixed(2));
};
const calcAccessoriesAmount = (item) => Number((item.rate * item.consumption).toFixed(2));
const calcSpecialAmount = (item) => Number((item.rate * item.consumption).toFixed(2));

// Category totals
const sewingCost = (sewingItems || []).reduce((s, i) => s + calcSewingAmount(i), 0);
const fabricCost = (fabricItems || []).reduce((s, i) => s + calcFabricAmount(i), 0);
const accessoriesCost = (accessoriesItems || []).reduce((s, i) => s + calcAccessoriesAmount(i), 0);
const specialCost = (specialItems || []).reduce((s, i) => s + calcSpecialAmount(i), 0);

// Grand total
const totalCost = Number((sewingCost + fabricCost + accessoriesCost + specialCost).toFixed(2));
const grossProfit = Number(((sellingPrice || 0) - totalCost).toFixed(2));
const profitPct = (sellingPrice || 0) > 0
  ? Number(((grossProfit / sellingPrice) * 100).toFixed(2))
  : 0;
```

---

## Styling Requirements

- Use same `inputClass` function pattern from current codebase for consistency
- All input background: `bg-slate-50` default, `bg-white` on focus
- Number inputs: `text-right font-mono`
- Section cards: `bg-white rounded-2xl shadow-sm border border-slate-100 p-6`
- Section headers: `text-sm font-black text-slate-700 uppercase tracking-wider`
- "Add Row" button: Small outline button with `+` icon
- "Remove Row" button: Small red icon button (trash or × icon)
- Amount display (read-only): `text-green-700 font-mono font-bold`
- Category total rows: `bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between`
- Use `animate-in fade-in` for section transitions (already exists in global CSS as `animate-fade-in`)

---

## useFieldArray Usage

For each category section, use `useFieldArray` from react-hook-form:

```typescript
const { fields: sewingFields, append: appendSewing, remove: removeSewing } = useFieldArray({
  control,
  name: 'sewingItems',
});

const { fields: fabricFields, append: appendFabric, remove: removeFabric } = useFieldArray({
  control,
  name: 'fabricItems',
});

const { fields: accessoriesFields, append: appendAccessories, remove: removeAccessories } = useFieldArray({
  control,
  name: 'accessoriesItems',
});

const { fields: specialFields, append: appendSpecial, remove: removeSpecial } = useFieldArray({
  control,
  name: 'specialItems',
});
```

Each row maps to a `fields` entry and renders the input fields using `register(`sewingItems.${index}.type`)` etc.

---

## Form Submission

On submit, collect the form data and pass it to the `onSubmit` prop. The `amount` fields are NOT stored in form state — they are calculated on the server side. Only send: `type`, `description`, `unit`, `rate`, `consumption` for each line item.

```typescript
const handleFormSubmit = async (data: CostingFormValues) => {
  // The onSubmit prop handles the API call
  await onSubmit(data);
};
```

---

## Important Implementation Notes

1. Do NOT use `useRef` for tracking individual field references in THIS guide. That is handled in Guide 06 (Enter Key Navigation).
2. The form should prevent the default browser form submission on Enter key — handled in the `onKeyDown` handler on the `<form>` element.
3. When `initialData` is provided (edit mode), populate all fields including the line item arrays.
4. At minimum, each category section should start with 1 empty row (even if the user hasn't added any items).
5. The "Remove Row" button should be hidden if there's only 1 row in a category section (minimum 1 row per category).
