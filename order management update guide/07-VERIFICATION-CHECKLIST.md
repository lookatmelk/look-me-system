# Guide 07 — Verification Checklist

## Purpose

This checklist provides step-by-step verification instructions for an AI Agent (or developer) to confirm that all order management updates were applied correctly.

---

## Pre-Flight Checks

### 1. TypeScript Compilation

Run the following and confirm **zero errors**:

```bash
npx tsc --noEmit
```

If there are type errors, they must be resolved before proceeding.

### 2. Build Check

Run the production build and confirm no failures:

```bash
npm run build
```

---

## Data Model Verification

### 3. OrderRecord Schema

Open `src/models/OrderRecord.ts` and verify:

- [ ] `IOrderRecord` interface has `sampleNo?: string`
- [ ] `OrderRecordSchema` has `sampleNo` field with `type: String`, `trim: true`, `default: ''`, `maxLength: 50`
- [ ] There is an index: `OrderRecordSchema.index({ sampleNo: 1 })`
- [ ] All existing fields are unchanged (designNo, costingId, description, shopAllocations, etc.)
- [ ] The pre-save hook for auto-calculations is unchanged

---

## API Verification

### 4. Designs API (`/api/orders/designs`)

- [ ] `.select()` uses `sizes` (NOT `size`)
- [ ] Returns array of objects with `sizes: string[]` (NOT `size: string`)

### 5. Orders GET (`/api/orders`)

- [ ] Search `$or` includes `{ sampleNo: regex }`
- [ ] Supports `sampleNo` exact filter via query param
- [ ] `.populate('costingId', ...)` uses `sizes` (NOT `size`)
- [ ] `.populate('costingId', ...)` does NOT reference `fabric` or `fabricPrice`

### 6. Orders POST (`/api/orders`)

- [ ] Accepts `sampleNo` in the request body
- [ ] Includes `sampleNo` in the saved payload
- [ ] `.populate('costingId', ...)` uses `sizes` (NOT `size`)

### 7. Orders GET by ID (`/api/orders/:id`)

- [ ] `.populate('costingId', ...)` uses `sizes` (NOT `size`)
- [ ] Does NOT reference `fabric` or `fabricPrice`

### 8. Orders PUT (`/api/orders/:id`)

- [ ] Accepts `sampleNo` updates
- [ ] `.populate('costingId', ...)` uses `sizes` (NOT `size`)

---

## Form Component Verification

### 9. OrderForm Architecture

Open `src/components/orders/OrderForm.tsx` and verify:

- [ ] **No stepper** — there is no `step` state, no stepper header, no "Next Step"/"Back" buttons
- [ ] **Single form** — all sections are visible at once in a single scrollable layout
- [ ] **Sections**: Design & Order Details → Shop Allocations → Summary → Footer

### 10. DesignOption Interface

- [ ] `DesignOption` has `sizes: string[]` (NOT `size: string`)
- [ ] The design preview card shows sizes as tag chips (not a single size string)

### 11. sampleNo Field

- [ ] There is a `sampleNo` text input in the form
- [ ] It is placed alongside or near the `designNo` dropdown
- [ ] It is optional (no required asterisk)
- [ ] It is included in the Zod schema

### 12. Selective Shop Display

- [ ] Shops are NOT all loaded into the form at once
- [ ] There is a dropdown to select and add individual shops
- [ ] There is an "Add All Shops" button
- [ ] Each added shop has a remove (×) button
- [ ] Only added shops show allocation rows (quantity + sizes)
- [ ] The dropdown shows only shops not yet added

### 13. Enter Key Navigation

- [ ] Pressing Enter on Design No moves to Sample No
- [ ] Pressing Enter on Sample No moves to Order Date
- [ ] Pressing Enter on Order Date moves to Status
- [ ] Notes textarea is SKIPPED (Enter creates newlines in textarea)
- [ ] Pressing Enter on Status moves to first shop allocation quantity
- [ ] Pressing Enter on each quantity moves to the next quantity
- [ ] Pressing Enter on the last quantity triggers the save button
- [ ] Adding a new shop allocation includes its quantity in the Enter chain
- [ ] Removing a shop allocation adjusts the Enter chain correctly

### 14. Summary Section

- [ ] Design Total updates live as quantities change
- [ ] Projected Revenue calculates as `sellingPrice × designTotal`
- [ ] Projected Profit calculates as `(sellingPrice - totalCost) × designTotal`
- [ ] Profit Margin badge uses color coding (green ≥30, amber ≥20, red <20)

### 15. Form Submission

- [ ] Only shop allocations with `qty > 0` are submitted
- [ ] The `sampleNo` field value is included in the submitted data
- [ ] Validation errors display correctly for missing required fields
- [ ] Validation catches: no design selected, no allocations with qty > 0, allocations with qty > 0 but no sizes

---

## Detail Modal Verification

### 16. OrderDetailModal

Open `src/components/orders/OrderDetailModal.tsx` and verify:

- [ ] Modal title includes sample number (if present): `"Order — Design #123 / Sample #S001"`
- [ ] The Order Information grid includes a "Sample No" field
- [ ] Missing sample number shows `—` dash
- [ ] All other sections render correctly

---

## Orders Page Verification

### 17. Orders Table

Open `src/app/admin/orders/page.tsx` and verify:

- [ ] Table has a "Sample No" column after "Design No"
- [ ] Empty sample numbers show `—`
- [ ] Search still works (searches designNo, description, and sampleNo)

### 18. Filter Drawer (if updated)

- [ ] Sample No filter input exists in the drawer (if implemented)
- [ ] Filtering by sample number works correctly
- [ ] Active filter count includes sample number filter

---

## Functional Testing

### 19. Create a New Order

1. Navigate to `/admin/orders/add`
2. Verify the single-form layout (no stepper)
3. Select a design from the dropdown
4. Verify the design preview shows `sizes` as tags
5. Enter a sample number
6. Set the order date and status
7. Use the shop selector to add 1 or 2 shops
8. Enter quantities for each shop
9. Select sizes for each shop
10. Verify the summary section updates live
11. Press Enter through the form fields — verify correct navigation
12. Submit the form
13. Verify the order appears in the orders table with the sample number

### 20. Edit an Existing Order

1. Navigate to an existing order's edit page
2. Verify all fields are pre-populated correctly
3. Verify existing shop allocations are loaded
4. Verify the shop selector shows only unallocated shops
5. Modify the sample number
6. Add or remove a shop allocation
7. Submit changes
8. Verify updates are reflected in the table and detail modal

### 21. View Order Detail

1. Click on an order in the table
2. Verify the detail modal shows the sample number
3. Verify all shop allocations are displayed correctly
4. Verify costing information is correct

### 22. Delete an Order

1. Click the delete button on an order
2. Confirm deletion via the modal
3. Verify the order is removed from the table

---

## Regression Checks

### 23. Costing Module Unaffected

- [ ] Costing records can still be created and edited
- [ ] The CostingForm still works correctly
- [ ] No costing files were modified

### 24. Shop Module Unaffected

- [ ] Shops can still be managed
- [ ] Shop data renders correctly in order forms and modals

### 25. No Console Errors

- [ ] Open browser dev tools
- [ ] Navigate through orders pages
- [ ] Verify no JavaScript errors or warnings related to:
  - Missing `size` field (should be `sizes`)
  - Missing `fabric` or `fabricPrice` fields
  - Invalid populate paths

---

## Common Failure Points

1. **Stale `size` reference**: Any code still using `design.size` instead of `design.sizes` will fail silently (returning `undefined`).
2. **Populate field mismatches**: If a populate path references `size` or `fabric`, Mongoose will silently ignore it — the data just won't be there.
3. **Shop allocation validation**: The form validation must ensure that shops with qty > 0 have at least one size selected.
4. **Enter-key on textarea**: If the Notes textarea is accidentally included in the Enter navigation, it will skip instead of creating newlines.
5. **Dynamic ref array**: If `refIndex` is not properly reset on each render, the Enter navigation will break as shops are added/removed.
