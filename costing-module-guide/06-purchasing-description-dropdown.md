# 06 — Purchasing Description Dropdown

> **This is the most critical integration point** between the Purchasing and Costing modules.

---

## Concept

The user does **NOT** select a purchasing "category" for costing. Instead, they select from a list of unique **description** values that exist in the `PurchaseRecord` collection. This provides a direct, human-friendly link between what was purchased and what is being costed.

**Example dropdown options** (from the existing purchasing data):
- "Fabric for cotton"
- "Cotton slab"
- "FABRIC * 100"
- "SLAB LINNEN FABRIC"
- "VISCOSE LYCRA"

---

## Data Flow

```
┌────────────────────────┐
│  PurchaseRecord Model  │
│  (MongoDB Collection)  │
│                        │
│  description: String   │ ──► PurchaseRecord.distinct('description')
│  e.g. "Fabric for cotton" │
└────────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  GET /api/costing/descriptions │
│                                │
│  Returns: ["Cotton slab",     │
│    "FABRIC * 100",            │
│    "Fabric for cotton"]       │
└────────────────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  CostingFormModal.tsx          │
│                                │
│  <select>                      │
│    <option>Cotton slab</option>│
│    <option>FABRIC * 100       │
│    ...                        │
│  </select>                     │
└────────────────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  CostingRecord Model           │
│                                │
│  description: "Fabric for cotton" │  ← Stored as plain text
└────────────────────────────────┘
```

---

## Backend Endpoint

**File:** `src/app/api/costing/descriptions/route.ts`

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';

export async function GET() {
  try {
    await dbConnect();

    // Get unique descriptions from PurchaseRecord collection
    const descriptions: string[] = await PurchaseRecord.distinct('description');

    // Clean, filter, and sort
    const sorted = descriptions
      .filter((d) => d && d.trim() !== '')     // Remove empty strings
      .map((d) => d.trim())                     // Trim whitespace
      .sort((a, b) => a.localeCompare(b));      // Alphabetical sort

    return NextResponse.json({
      success: true,
      data: sorted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

---

## Frontend: Fetching Descriptions

**In the costing page component:**

```typescript
const [purchasingDescriptions, setPurchasingDescriptions] = useState<string[]>([]);

useEffect(() => {
  const fetchDescriptions = async () => {
    try {
      const res = await axios.get('/api/costing/descriptions');
      if (res.data.success) {
        setPurchasingDescriptions(res.data.data);
      }
    } catch {
      // Silently fail — dropdown will just be empty
    }
  };
  fetchDescriptions();
}, []);
```

---

## Frontend: Dropdown Component

**In `CostingFormModal.tsx`, Step 1:**

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Description <span className="text-red-500">*</span>
    <span className="text-xs text-slate-400 ml-1 font-normal">(from purchasing records)</span>
  </label>
  <div className="relative">
    <select
      {...register('description')}
      className={`mt-1 block w-full rounded-md border ${
        errors.description ? 'border-red-500' : 'border-gray-300'
      } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white appearance-none`}
    >
      <option value="">Select a purchasing description...</option>
      {purchasingDescriptions.map((desc) => (
        <option key={desc} value={desc}>
          {desc}
        </option>
      ))}
    </select>
    {/* Custom chevron icon */}
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
  {errors.description && (
    <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
  )}
</div>
```

---

## Also Used in: Advanced Filters

The same purchasing descriptions list is also used in the **Advanced Filter Drawer** (guide 07) to filter costing records by their linked purchasing description:

```tsx
{/* Description Filter — in the Advanced Filter Drawer */}
<div className="space-y-2">
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
    Purchasing Description
  </label>
  <div className="relative">
    <select
      value={descriptionFilter}
      onChange={(e) => setDescriptionFilter(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
    >
      <option value="">All Descriptions</option>
      {purchasingDescriptions.map((desc) => (
        <option key={desc} value={desc}>{desc}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</div>
```

---

## Why NOT Purchasing Category?

The user explicitly specified: **"use only for user to show purchasing description, not use purchasing category."**

Reasons:
1. **Descriptions are more specific** — they tell the user exactly what was purchased ("Cotton slab" vs just "Fabric")
2. **Direct user understanding** — no need to remember category-to-item mappings
3. **Simpler data model** — no ObjectId reference needed, just string storage
4. **Flexible** — new descriptions appear automatically as purchase records are added

---

## Edge Cases to Handle

1. **No purchasing records exist yet** → The dropdown will be empty with only the placeholder "Select a purchasing description..."
2. **Description deleted from all purchase records** → The costing record retains its description string; it just won't appear in future dropdowns
3. **Very long descriptions** → The select element will truncate with CSS; the full text is stored in MongoDB
4. **Special characters in descriptions** → HTML entities are handled by React's JSX escaping automatically

---

> **Next:** [07-advanced-filtering.md](./07-advanced-filtering.md)
