# 06 — Design Number Dropdown

> **Key integration point between Orders and Costing modules**  
> **API endpoint:** `/api/orders/designs`  
> **Consumer:** `OrderForm.tsx` (Step 1 — Design Selection)

---

## Overview

When creating an order, the user must **select a design** from the CostingRecord collection. This guide documents exactly how this dropdown works, including data fetching, auto-population of related fields, and edge cases.

This is the **Orders module equivalent** of the Costing module's "Purchasing Description Dropdown" (guide 06 in costing-module-guide).

---

## Data Flow

```
┌─────────────────┐     GET /api/orders/designs     ┌────────────────────┐
│                 │ ─────────────────────────────→  │                    │
│   OrderForm     │                                 │   CostingRecord    │
│   (Frontend)    │ ←───────────────────────────── │   (MongoDB)        │
│                 │    Array of design options       │                    │
└─────────────────┘                                 └────────────────────┘
         │
         │  User selects design "1001"
         ▼
┌─────────────────┐
│  Auto-fill:     │
│  - description  │
│  - sellingPrice │
│  - totalCost    │
│  - profitPct    │
│  - size         │
└─────────────────┘
```

---

## API Endpoint

**File:** `src/app/api/orders/designs/route.ts`

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET() {
  try {
    await dbConnect();

    const designs = await CostingRecord.find({})
      .select('designNo description sellingPrice totalCost profitPercentage size')
      .sort({ designNo: 1 });

    return NextResponse.json({
      success: true,
      data: designs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

**Response shape (array of design options):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "663xyz...",
      "designNo": "1001",
      "description": "LEGGING",
      "sellingPrice": 275.00,
      "totalCost": 219.00,
      "profitPercentage": 25.57,
      "size": "S"
    },
    {
      "_id": "663abc...",
      "designNo": "1002",
      "description": "SHORT FROCK",
      "sellingPrice": 750.00,
      "totalCost": 351.50,
      "profitPercentage": 35.99,
      "size": "M"
    }
  ]
}
```

---

## Frontend Integration

### Fetching Designs

```typescript
const [availableDesigns, setAvailableDesigns] = useState<DesignOption[]>([]);

useEffect(() => {
  const fetchDesigns = async () => {
    try {
      const res = await axios.get('/api/orders/designs');
      if (res.data.success) {
        setAvailableDesigns(res.data.data);
      }
    } catch {
      // Silent — dropdown will just be empty
    }
  };
  fetchDesigns();
}, []);
```

### Design Selection Handler

When the user selects a design, the form auto-fills the description and pricing:

```typescript
const [selectedDesign, setSelectedDesign] = useState<DesignOption | null>(null);

const handleDesignChange = (costingId: string) => {
  const design = availableDesigns.find(d => d._id === costingId);
  setSelectedDesign(design || null);
  
  if (design) {
    // These values are NOT form fields — they are display-only
    // The API will snapshot them from CostingRecord on POST
    console.log('Auto-filled:', {
      designNo: design.designNo,
      description: design.description,
      sellingPrice: design.sellingPrice,
      totalCost: design.totalCost,
    });
  }
};
```

### Dropdown Rendering

```tsx
<select
  {...register('costingId')}
  onChange={(e) => {
    register('costingId').onChange(e);
    handleDesignChange(e.target.value);
  }}
  className={`mt-1 block w-full rounded-md border ${
    errors.costingId ? 'border-red-500' : 'border-gray-300'
  } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
>
  <option value="">Select a design number...</option>
  {availableDesigns.map((design) => (
    <option key={design._id} value={design._id}>
      {design.designNo} — {design.description} (LKR {design.sellingPrice.toLocaleString()})
    </option>
  ))}
</select>
```

---

## Auto-Filled Design Info Card

When a design is selected, show a summary card:

```tsx
{selectedDesign && (
  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 space-y-2 animate-fade-in">
    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Selected Design</p>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Description</span>
        <span className="text-sm font-bold text-slate-900">{selectedDesign.description}</span>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Size</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
          {selectedDesign.size}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Selling Price</span>
        <span className="text-sm font-black text-green-700 font-mono">
          LKR {selectedDesign.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 font-medium block">Profit %</span>
        <span className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold',
          selectedDesign.profitPercentage >= 30 && 'bg-green-50 text-green-700',
          selectedDesign.profitPercentage >= 20 && selectedDesign.profitPercentage < 30 && 'bg-amber-50 text-amber-700',
          selectedDesign.profitPercentage < 20 && 'bg-red-50 text-red-700',
        )}>
          {selectedDesign.profitPercentage.toFixed(2)}%
        </span>
      </div>
    </div>
  </div>
)}
```

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| No costing records exist | Dropdown is empty, shows only placeholder "Select a design number..." |
| API call fails | Dropdown stays empty — no error toast (silent failure) |
| Design selected then deleted from CostingRecord | Order retains the snapshot data (sellingPrice, totalCost) — does not break |
| User changes selection | Previous auto-fill values are replaced with new design's values |
| Edit mode | Dropdown pre-selects the existing `costingId` and auto-fills from existing snapshot |

---

## Key Differences from Costing's Description Dropdown

| Aspect | Costing Module | Orders Module |
|--------|---------------|---------------|
| Dropdown content | Plain text descriptions from PurchaseRecord | Full design objects from CostingRecord |
| What's stored | `description` (string) | `costingId` (ObjectId) |
| Auto-fill | None — just the selected text | Multiple fields: description, sellingPrice, totalCost, profitPct |
| API endpoint | `/api/costing/descriptions` | `/api/orders/designs` |
| Return type | `string[]` | `{ _id, designNo, description, sellingPrice, totalCost, profitPercentage, size }[]` |

---

> **Next:** [07-advanced-filtering.md](./07-advanced-filtering.md)
