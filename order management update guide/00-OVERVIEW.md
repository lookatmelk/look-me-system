# Order Management Update — Master Overview

## Purpose

This guide set provides step-by-step instructions for an AI Agent to refactor the **Orders** module of the LOOK@ME application. The costing module was recently restructured (see `costing management update guide/`), and the orders module must now be updated to align with those changes, eliminate conflicts, and implement new UX requirements.

These guides are ordered sequentially and must be executed in order.

---

## Background & Current State

The LOOK@ME application is a **Next.js** app (App Router) using **MongoDB/Mongoose**, **React Hook Form + Zod**, **TailwindCSS**, **Lucide icons**, **clsx**, and **axios**.

### Recent Costing Module Changes

The costing module was completely restructured:

1. **`CostingRecord` model** now has: `designNo` (unique), `description`, `sizes` (array of strings — manually entered, no longer an enum), and four line-item arrays: `sewingItems`, `fabricItems`, `accessoriesItems`, `specialItems`. Each line item has `type`, `description`, `unit`, `rate`, `consumption`, and auto-calculated `amount`.
2. **No more `size` (singular)** — replaced with `sizes` (array of strings).
3. **No more `fabric`, `fabricPrice`, `fabricConsumption`** — fabric is now one of many `fabricItems` line items.
4. **CostingForm** is now a single flat form (no stepper), with Enter-key field navigation.

### Current Order Module State

The order module currently:

1. **References `costingId`** — links to a CostingRecord for `designNo`, `description`, `sellingPrice`, `totalCost`, `profitPercentage`.
2. **Uses a 3-step stepper form** — Step 1: Design + metadata, Step 2: Shop allocations, Step 3: Review.
3. **Loads ALL shops at once** — fetches every active shop and renders a section for each, even if the user only needs to order for 1 shop.
4. **`DesignOption` interface references `size` (singular)** — now stale; costing uses `sizes` (array).
5. **Designs API `/api/orders/designs`** selects `size` from CostingRecord — this field no longer exists.
6. **No `sampleNo` field** — user has requested adding a `sampleNo` alongside `designNo`.

---

## What Needs to Change

### 1. Add `sampleNo` Field to OrderRecord
A new optional field `sampleNo` must be added to the order data model and all surfaces (form, table, detail modal, API).

### 2. Replace Stepper Form with Single Flat Form
The 3-step stepper must be replaced with a single, scrollable form — mirroring the pattern established by the costing form.

### 3. Enter Key Navigation
Pressing `Enter` on any field moves focus to the next field. Pressing `Enter` on the last field triggers the save button. Use the same `inputRefs` + `mergeRefs` pattern from `CostingForm.tsx`.

### 4. Selective Shop Display (Not All at Once)
Instead of rendering allocation sections for ALL active shops:
- Show a **shop selector** (searchable dropdown) at the top of the allocations section.
- The user selects a shop → a new allocation row appears for that shop.
- The user can add multiple allocations (same or different shops).
- Include an **"Add All Shops"** convenience button.
- Each allocation row shows: shop name, quantity input, sizes selector.

### 5. Align with Updated CostingRecord Fields
- Fix the `DesignOption` interface: replace `size: string` with `sizes: string[]`.
- Fix the designs API to select `sizes` instead of `size`.
- Update all populate calls that reference `size` to use `sizes`.
- Update the form's "Selected Design" preview to show `sizes` array as tags.

### 6. Update Orders Page Table
- Add `sampleNo` column to the orders table.
- Add `sampleNo` to the search regex.
- Update the filter drawer if needed.

### 7. Update OrderDetailModal
- Show `sampleNo` in the order detail modal.
- Fix any references to the old `size` field.

---

## Guide Files (Execute in Order)

| #  | File                                       | Description                                           |
|----|--------------------------------------------|-------------------------------------------------------|
| 01 | `01-DATA-MODEL-CHANGES.md`                 | Add `sampleNo` to OrderRecord schema                  |
| 02 | `02-API-ROUTE-CHANGES.md`                  | Fix designs API, update POST/PUT/GET routes            |
| 03 | `03-FORM-COMPONENT-REWRITE.md`             | Complete OrderForm.tsx rewrite (single form, shop selector, Enter nav) |
| 04 | `04-DETAIL-MODAL-UPDATE.md`                | Update OrderDetailModal for new fields                 |
| 05 | `05-PAGE-AND-TABLE-UPDATES.md`             | Orders list page, add page, edit page changes          |
| 06 | `06-ENTER-KEY-NAVIGATION.md`               | Enter-key field navigation (specific to order form)    |
| 07 | `07-VERIFICATION-CHECKLIST.md`             | Testing and verification steps                         |

---

## Key File Locations

```
src/
├── models/
│   ├── OrderRecord.ts              # Mongoose model        (MODIFY)
│   ├── CostingRecord.ts            # Already updated       (NO CHANGE)
│   └── Shop.ts                     # Shop model            (NO CHANGE)
├── app/
│   ├── api/orders/
│   │   ├── route.ts                # GET (list) + POST     (MODIFY)
│   │   ├── [id]/route.ts           # GET/PUT/DELETE by ID  (MODIFY)
│   │   ├── designs/route.ts        # Costing dropdown data (MODIFY)
│   │   └── stats/route.ts          # Aggregation stats     (MODIFY)
│   └── admin/orders/
│       ├── page.tsx                # List page with table  (MODIFY)
│       ├── add/page.tsx            # Add order page        (MODIFY)
│       └── [id]/edit/page.tsx      # Edit order page       (MODIFY)
├── components/
│   └── orders/
│       ├── OrderForm.tsx           # Form component        (REWRITE)
│       └── OrderDetailModal.tsx    # View detail modal     (MODIFY)
└── ...
```

---

## Important Constraints

1. **Technology**: Next.js App Router, React 19, Mongoose, react-hook-form, Zod, TailwindCSS, Lucide icons, clsx, axios.
2. **Styling**: Must maintain the existing design system (green brand color `#16a34a`, slate color palette, rounded-xl/2xl cards, font-mono for numbers). All inputs should have white background when focused. Input backgrounds should be `bg-slate-50` by default, `bg-white` on focus.
3. **The `costingId` relationship must be preserved** — OrderRecord still links to CostingRecord via `costingId`.
4. **Shop model is unchanged** — the `Shop` model/schema remain as-is.
5. **CostingRecord no longer has `size` (singular)** — it now has `sizes` (array). Any code referencing `size` from costing must be updated to `sizes`.
6. **The costing form pattern is the reference** — the OrderForm rewrite should follow the same single-form, flat-layout, enter-key-navigation pattern established in `CostingForm.tsx`.
7. **No changes to the Costing module** — the costing module has already been updated. Do NOT modify any costing files.
