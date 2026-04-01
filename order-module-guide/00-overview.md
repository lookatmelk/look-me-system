# Orders Module — Master Overview

> **Module:** Orders  
> **Status:** Implementation Guide (Documentation Only)  
> **Relations:** Costing Module → Orders Module ← Purchasing Module  
> **Project:** LOOK@ME Garment Management System

---

## Table of Contents

| # | Guide File | Purpose |
|---|-----------|---------|
| 00 | [00-overview.md](./00-overview.md) | This file — master overview, architecture, field mapping |
| 01 | [01-data-model.md](./01-data-model.md) | Mongoose schema, interfaces, indexes, auto-calculated fields, relations |
| 02 | [02-api-routes.md](./02-api-routes.md) | REST API endpoints (GET / POST / PUT / DELETE), query params, response shapes |
| 03 | [03-sidebar-navigation.md](./03-sidebar-navigation.md) | Sidebar integration to activate the "Orders" link |
| 04 | [04-orders-page.md](./04-orders-page.md) | Main list page — table, stats strip, pagination, row click detail modal |
| 05 | [05-order-form.md](./05-order-form.md) | Add / Edit order form — multi-step wizard with design number dropdown |
| 06 | [06-design-number-dropdown.md](./06-design-number-dropdown.md) | Dropdown that fetches design numbers from CostingRecord + auto-fills description |
| 07 | [07-advanced-filtering.md](./07-advanced-filtering.md) | Full advanced filter drawer + primary filter bar |
| 08 | [08-detail-modal.md](./08-detail-modal.md) | View-only detail modal for a single order record |
| 09 | [09-relations-guide.md](./09-relations-guide.md) | Cross-module relations: Orders ↔ Costing ↔ Purchasing |
| 10 | [10-design-theme-reference.md](./10-design-theme-reference.md) | Exact CSS variables, colours, fonts, animations, component styles to reuse |
| 11 | [11-file-structure.md](./11-file-structure.md) | Complete file tree of all new files and modified files |
| 12 | [12-validation-guide.md](./12-validation-guide.md) | Zod schemas, server-side validation, error handling |
| 13 | [13-testing-guide.md](./13-testing-guide.md) | Unit tests, integration tests, E2E tests for the orders module |

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          LOOK@ME System                               │
├─────────────────┬──────────────────┬──────────────────────────────────┤
│   Purchasing    │     Costing      │         Orders                   │
│   Module        │     Module       │         Module                   │
├─────────────────┼──────────────────┼──────────────────────────────────┤
│ PurchaseRecord  │ CostingRecord    │ OrderRecord                     │
│ Category        │   ↓ designNo     │   ↑ references CostingRecord    │
│ Supplier        │   ↓ description  │   ↑ via designNo (ObjectId ref) │
│                 │   ↓ sellingPrice  │   ↓ shop1Qty, shop2Qty, shop3Qty│
│                 │   ↓ totalCost    │   ↓ designTotal (auto-calc)     │
│                 │                  │   ↓ sizes per shop               │
└─────────────────┴──────────────────┴──────────────────────────────────┘
```

### How Orders Relates to Costing

The Orders module references the **CostingRecord** via `designNo`. When creating an order:

1. The user **selects a Design Number** (e.g., "1001") from a dropdown populated by CostingRecord documents
2. The **description** auto-fills from the corresponding CostingRecord (e.g., "LEGGING")
3. The user enters **quantities per shop** (Shop 1, Shop 2, Shop 3)
4. The user specifies **available sizes per shop** (e.g., "M L XL" for Shop 1)
5. The **design total** is auto-calculated: `shop1Qty + shop2Qty + shop3Qty`

### How Orders Relates to Purchasing

Orders link back to Purchasing **indirectly**:
- An order for design "1001" (LEGGING) uses fabric "VISCOSE LYCRA" → which was purchased via a PurchaseRecord
- The `sellingPrice` from CostingRecord × `designTotal` from OrderRecord gives the **projected revenue**
- Future: Purchase records can be linked to orders via `linkedOrderId` field (already exists on PurchaseRecord)

### Spreadsheet → Database Field Mapping

From the uploaded Excel "Orders" sheet:

| Excel Column | Database Field | Type | Notes |
|-------------|---------------|------|-------|
| A – DE-NO | `designNo` | `String` (or ObjectId ref) | References CostingRecord.designNo |
| B – DESCRIPTION | `description` | `String` | Auto-filled from CostingRecord |
| C – SHOP 1 (Row 1: Qty) | `shop1Qty` | `Number` | Quantity ordered for Shop 1 |
| C – SHOP 1 (Row 2: Sizes) | `shop1Sizes` | `String[]` | Available sizes, e.g. ["M", "L", "XL"] |
| D – SHOP 2 (Row 1: Qty) | `shop2Qty` | `Number` | Quantity ordered for Shop 2 |
| D – SHOP 2 (Row 2: Sizes) | `shop2Sizes` | `String[]` | Available sizes, e.g. ["L", "XL", "2XL"] |
| E – SHOP 3 (Row 1: Qty) | `shop3Qty` | `Number` | Quantity ordered for Shop 3 |
| E – SHOP 3 (Row 2: Sizes) | `shop3Sizes` | `String[]` | Available sizes for Shop 3 |
| F – DESIGN TOTAL | `designTotal` | `Number` | **Auto-calculated**: shop1Qty + shop2Qty + shop3Qty |

**Additional computed fields (not in spreadsheet but useful):**

| Field | Type | Notes |
|-------|------|-------|
| `costingId` | `ObjectId` | Reference to the CostingRecord document |
| `sellingPrice` | `Number` | Pulled from CostingRecord for display |
| `totalCost` | `Number` | Pulled from CostingRecord for display |
| `projectedRevenue` | `Number` | **Auto-calculated**: sellingPrice × designTotal |
| `projectedProfit` | `Number` | **Auto-calculated**: (sellingPrice - totalCost) × designTotal |
| `status` | `String` | PENDING / IN_PRODUCTION / DISPATCHED / DELIVERED / CANCELLED |
| `orderDate` | `Date` | When the order was placed |

---

## Design Principles

1. **Match the Purchasing & Costing modules exactly** — same design tokens, same fonts (Outfit), same green primary colour (#16a34a)
2. **Use existing UI components** — `Button`, `Modal`, `Drawer`, `Toaster`, `ConfirmModal`
3. **TanStack Table** for the data grid (already a dependency)
4. **react-hook-form + zod** for form validation (already a dependency)
5. **axios** for API calls (already a dependency)
6. **No new npm dependencies required**
7. **Design number dropdown** — populated from CostingRecord (NOT manually typed)
8. **Sizes as multi-select chips** — each shop independently selects applicable sizes

---

## Prerequisites Before Implementation

- [ ] The Costing module must be working with data (CostingRecord documents with designNo exist)
- [ ] MongoDB connection via `lib/mongoose.ts` is working
- [ ] Next.js app router is configured correctly
- [ ] Tailwind CSS v4 with `@theme` config is in place
- [ ] Existing UI components (`Button`, `Modal`, `Toaster`, `ConfirmModal`) are functional

---

> **Next:** Start with [01-data-model.md](./01-data-model.md) to define the Mongoose schema.
