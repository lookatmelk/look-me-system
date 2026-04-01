# Costing Management Update — Master Overview

## Purpose

This guide set provides step-by-step instructions for an AI Agent to refactor the **Costing (Design)** module of the LOOK@ME application. The guides are ordered sequentially and must be executed in order.

---

## Background & Current State

The LOOK@ME application is a **Next.js** app (App Router) using **MongoDB/Mongoose**, **React Hook Form + Zod**, and **TailwindCSS**. The Costing module currently:

1. **Has a dependency on Purchasing** — The costing form fetches `purchasingDescriptions` from `/api/costing/descriptions` (which queries PurchaseRecord) and auto-maps a `fabric` field from the selected purchasing description.
2. **Uses a 3-step stepper form** — Step 1: Design Details, Step 2: Cost Components, Step 3: Pricing Summary.
3. **Has a flat cost structure** — Single `fabric`, `fabricPrice`, `fabricConsumption`, plus fixed fields like `printBelt`, `threadLabelsPollyBags`, `fusingElasticButtonZip`, `sewingCost`, `accessoriesCost`.
4. **Stores a single `size` field** — An enum of `S | M | L | XL | 2XL | FREE`.

---

## What Needs to Change

### 1. Remove Costing ↔ Purchasing Relationship
A Design can be created **without any purchased items**. All references to purchasing descriptions must be removed.

### 2. Replace Stepper Form with Single Form
The 3-step stepper form must be replaced with a single, scrollable form.

### 3. Support Multiple Sizes Per Design
Instead of a single `size` enum, a design can have **multiple sizes** (manually added).

### 4. Support Multiple Line Items Per Category
Based on the costing spreadsheet structure, there are **4 categories**, each supporting **multiple line items**:

| Category    | Columns Per Entry                      | Amount Formula                                |
|-------------|----------------------------------------|-----------------------------------------------|
| **Sewing**      | Type, Description, Unit (SMV), Rate, CON | `Amount = Rate × CON`                     |
| **Fabric**      | Type, Description, Unit (YADS), Rate, CON | `Amount = (Rate × CON) + ((Rate × CON) / 100 × 5)` — includes 5% wastage |
| **Accessories** | Type, Description, Unit, Rate, CON       | `Amount = Rate × CON`                     |
| **Special**     | Type, Description, Unit, Rate, CON       | `Amount = Rate × CON`                     |

### 5. Auto-Calculated Summary
- **Sewing Cost** = sum of all Sewing line item amounts
- **Fabric Cost** = sum of all Fabric line item amounts (each with 5% wastage)
- **Accessories Cost** = sum of all Accessories line item amounts
- **Special Cost** = sum of all Special line item amounts
- **Total Cost** = Sewing Cost + Fabric Cost + Accessories Cost + Special Cost
- **Profit** = Selling Price − Total Cost
- **Margin %** = (Profit / Selling Price) × 100

### 6. Enter Key Navigation
The `Enter` key should move focus from the current field to the next field. On the last field, `Enter` triggers the save button.

---

## Guide Files (Execute in Order)

| #  | File                                        | Description                                    |
|----|---------------------------------------------|------------------------------------------------|
| 01 | `01-DATA-MODEL-CHANGES.md`                  | Mongoose schema restructure                    |
| 02 | `02-API-ROUTE-CHANGES.md`                   | API route updates (POST, PUT, GET, DELETE)      |
| 03 | `03-FORM-COMPONENT-REWRITE.md`              | Complete CostingForm.tsx rewrite               |
| 04 | `04-DETAIL-MODAL-UPDATE.md`                 | CostingDetailModal.tsx update                  |
| 05 | `05-PAGE-AND-TABLE-UPDATES.md`              | Costing list page, add page, edit page changes |
| 06 | `06-ENTER-KEY-NAVIGATION.md`               | Enter-key field navigation implementation      |
| 07 | `07-CLEANUP-AND-PURCHASING-REMOVAL.md`      | Remove all purchasing ↔ costing coupling       |
| 08 | `08-VERIFICATION-CHECKLIST.md`              | Testing and verification steps                 |

---

## Key File Locations

```
src/
├── models/
│   ├── CostingRecord.ts          # Mongoose model (MODIFY)
│   └── PurchaseRecord.ts         # Left untouched (no costing refs here)
├── app/
│   ├── api/costing/
│   │   ├── route.ts              # GET (list) + POST (create)   (MODIFY)
│   │   ├── [id]/route.ts         # GET/PUT/DELETE by ID          (MODIFY)
│   │   └── descriptions/route.ts # Purchasing bridge — DELETE
│   └── admin/costing/
│       ├── page.tsx              # List page with table           (MODIFY)
│       ├── add/page.tsx          # Add costing page               (MODIFY)
│       └── [id]/edit/page.tsx    # Edit costing page              (MODIFY)
├── components/
│   ├── costing/
│   │   ├── CostingForm.tsx       # Form component                 (REWRITE)
│   │   └── CostingDetailModal.tsx# View detail modal              (MODIFY)
│   └── ui/
│       ├── Button.tsx            # Reusable button (no change)
│       ├── Modal.tsx             # Reusable modal  (no change)
│       └── ...
└── ...
```

---

## Important Constraints

1. **Technology**: Next.js App Router, React 19, Mongoose, react-hook-form, Zod, TailwindCSS, Lucide icons, clsx, axios.
2. **Styling**: Must maintain the existing design system (green brand color `#16a34a`, slate color palette, rounded-xl/2xl cards, font-mono for numbers). All inputs should have white background when focused.
3. **The `designNo` field remains unique** — this is the primary identifier.
4. **Orders module references `costingId`** — the OrderRecord model has `costingId: ObjectId ref 'CostingRecord'`. Do NOT break this relationship. The costing record's `_id` remains a valid MongoDB ObjectId.
5. **No changes to the Purchasing module** — only remove the bridge (`/api/costing/descriptions`) and the purchasing-related fields from costing.
