# Guide 07 — Cleanup and Purchasing Removal

## Purpose

This guide documents every touchpoint where the Costing module references Purchasing data, and provides the exact cleanup actions.

---

## 1. Delete: API Bridge Endpoint

### Delete entire directory:
```
src/app/api/costing/descriptions/
```

This directory contains `route.ts` which:
- Imports `PurchaseRecord` and `Category` models
- Fetches all purchase records and maps `description → fabric` via category names
- Returns sorted array of `{ description, fabric }` objects

**Action**: Delete the entire directory `src/app/api/costing/descriptions/`

---

## 2. Model: CostingRecord.ts

### Remove Fields (done in Guide 01)
- `purchasingDescription` (schema field + interface property)
- `fabric` (schema field + interface property)

### Remove Indexes
```typescript
// DELETE:
CostingRecordSchema.index({ purchasingDescription: 1 });
```

---

## 3. Component: CostingForm.tsx

### Remove (done in Guide 03)
- `purchasingDescriptions` prop from the interface
- `watchPurchasingDescription` watch
- The `useEffect` that auto-maps `fabric` from `purchasingDescription`
- The `purchasingDescription` select dropdown (entire `<div className="sm:col-span-2">` block)
- The `fabric` read-only input (entire `<div className="sm:col-span-2">` block with the CheckCircle2 indicator)
- The step 1 validation including `"purchasingDescription"` and `"fabric"` in the `trigger()` call

### Remove from Zod Schema
```typescript
// DELETE these from costingSchema:
purchasingDescription: z.string().min(1, "Purchasing description is required"),
fabric: z.string().min(1, "Fabric is automatically mapped but cannot be empty"),
```

### Remove from Default Values
```typescript
// DELETE:
purchasingDescription: "",
fabric: "",
```

---

## 4. Component: CostingDetailModal.tsx

### Remove (done in Guide 04)
- The `purchasingDescription` DetailField
- The `fabric` DetailField
- `Scissors` import from lucide-react (it was the icon for the fabric field)

---

## 5. Page: Costing List Page (page.tsx)

### Remove (done in Guide 05)
- `purchasingDescriptions` state variable
- `purchasingDescriptionFilter` state variable  
- `fetchDescriptions()` function
- `useEffect` that calls `fetchDescriptions()`
- `purchasingDescription` table column
- `fabric` table column
- `fabricPrice` table column
- Purchasing Description filter section in the filter drawer
- `purchasingDescriptionFilter` from `activeFilterCount` calculation
- `purchasingDescriptionFilter` from `resetAllFilters()` function
- `purchasingDescriptionFilter` from `fetchRecords()` params
- `purchasingDescriptionFilter` from the `useEffect` dependency array

---

## 6. Page: Add Costing Page (add/page.tsx)

### Remove (done in Guide 05)
- `descriptions` state variable
- The `axios.get('/api/costing/descriptions')` call in the `init` useEffect
- `purchasingDescriptions={descriptions}` prop on `<CostingForm>`
- The header text "linked to your purchasing data"

---

## 7. Page: Edit Costing Page ([id]/edit/page.tsx)

### Remove (done in Guide 05)
- `descriptions` state variable
- `axios.get('/api/costing/descriptions')` from `Promise.all`
- The `descRes` destructuring and its `if` block
- `purchasingDescriptions={descriptions}` prop on `<CostingForm>`

---

## 8. API Route: Costing GET (route.ts)

### Remove (done in Guide 02)
- `purchasingDescription` from `$or` search array
- `fabric` from `$or` search array
- `purchasingDescription` exact filter logic

---

## 9. Tests (if any exist)

### File: `__tests__/models/CostingRecord.test.ts`

Check this file for tests referencing:
- `purchasingDescription`
- `fabric`
- `fabricPrice`
- `fabricConsumption`
- `printBelt`
- `threadLabelsPollyBags`
- `fusingElasticButtonZip`
- `standardMinutesValue`

Update or remove these tests to match the new schema.

---

## Verification: Search for Remaining References

After all cleanup, run these grep commands to confirm no orphaned references remain:

```bash
# Search for purchasingDescription references
grep -r "purchasingDescription" src/ --include="*.ts" --include="*.tsx"

# Search for the descriptions API endpoint
grep -r "costing/descriptions" src/ --include="*.ts" --include="*.tsx"

# Search for the old fabric field (not fabricItems)
grep -r "\"fabric\"" src/ --include="*.ts" --include="*.tsx"

# Search for old flat fields
grep -r "printBelt\|threadLabelsPollyBags\|fusingElasticButtonZip\|standardMinutesValue" src/ --include="*.ts" --include="*.tsx"
```

All of these should return **zero results** (except possibly comments explaining the migration).

---

## What Should NOT Be Changed

1. **PurchaseRecord model** (`src/models/PurchaseRecord.ts`) — no changes needed. It operates independently.
2. **PurchasingFormModal** (`src/components/purchasing/PurchasingFormModal.tsx`) — no changes needed.
3. **Purchasing API routes** (`src/app/api/purchasing/`) — no changes needed.
4. **Purchasing admin pages** (`src/app/admin/purchasing/`) — no changes needed.
5. **OrderRecord model** — it references `costingId` which remains a valid ObjectId. However, the order form may need to handle the fact that `size` is now `sizes` array. That's out of scope for this guide set.
