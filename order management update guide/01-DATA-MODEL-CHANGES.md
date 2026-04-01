# Guide 01 — Data Model Changes

## File to Modify

`src/models/OrderRecord.ts`

---

## Objective

Add a `sampleNo` field to the `OrderRecord` schema so that orders can track both a **design number** and a **sample number**.

---

## Current State

The `OrderRecord` model currently has these identity/info fields:

```typescript
export interface IOrderRecord extends Document {
  designNo: string;
  costingId: mongoose.Types.ObjectId;
  description: string;
  // ... shopAllocations, totals, costing snapshot, etc.
}
```

There is **no `sampleNo`** field.

---

## Changes Required

### 1. Add `sampleNo` to the Interface

Add `sampleNo` as an **optional** string field to the `IOrderRecord` interface, right after `designNo`:

```typescript
export interface IOrderRecord extends Document {
  designNo: string;
  sampleNo?: string;          // ← NEW: Optional sample number
  costingId: mongoose.Types.ObjectId;
  description: string;
  // ... rest unchanged
}
```

### 2. Add `sampleNo` to the Schema

Add the field to `OrderRecordSchema`, right after the `designNo` field definition:

```typescript
sampleNo: {
  type: String,
  trim: true,
  default: '',
  maxLength: [50, 'Sample number cannot exceed 50 characters'],
},
```

**Properties**:
- **Not required** — it is optional. Default is empty string `''`.
- **Trimmed** — whitespace is stripped.
- **Max length** — 50 characters (reasonable limit for a sample identifier).
- **Not unique** — multiple orders may reference the same sample number.

### 3. Add Index for `sampleNo`

Add an index for efficient querying by sample number:

```typescript
OrderRecordSchema.index({ sampleNo: 1 });
```

Place this alongside the existing indexes (after `OrderRecordSchema.index({ designNo: 1 });`).

---

## Complete Diff Reference

### In the interface (`IOrderRecord`):

```diff
 export interface IOrderRecord extends Document {
   designNo: string;
+  sampleNo?: string;
   costingId: mongoose.Types.ObjectId;
   description: string;
```

### In the schema (`OrderRecordSchema`):

```diff
     designNo: {
       type: String,
       required: [true, 'Design number is required'],
       trim: true,
     },
+    sampleNo: {
+      type: String,
+      trim: true,
+      default: '',
+      maxLength: [50, 'Sample number cannot exceed 50 characters'],
+    },
     costingId: {
       type: Schema.Types.ObjectId,
       ref: 'CostingRecord',
```

### In the indexes:

```diff
 OrderRecordSchema.index({ designNo: 1 });
+OrderRecordSchema.index({ sampleNo: 1 });
 OrderRecordSchema.index({ costingId: 1 });
```

---

## What NOT to Change

- **Do NOT change `shopAllocations`** — the shop allocation schema remains the same.
- **Do NOT change `IShopAllocation`** — the shop allocation interface is unchanged.
- **Do NOT change the pre-save hook** — the auto-calculation logic for `designTotal`, `projectedRevenue`, and `projectedProfit` is unchanged.
- **Do NOT change the sizes validator** in `ShopAllocationSchema` — it stays as-is.
- **Do NOT remove any existing fields** — all other fields remain intact.

---

## Verification

After making this change:
1. The model should compile without TypeScript errors.
2. Creating an OrderRecord without `sampleNo` should succeed (defaults to `''`).
3. Creating an OrderRecord with `sampleNo: 'SAMPLE-001'` should persist correctly.
4. Querying by `sampleNo` should work via the index.
