# Costing Module — Master Overview

> **Module:** Costing  
> **Status:** Implementation Guide (Documentation Only)  
> **Relation:** Purchasing Module → Costing Module  
> **Project:** LOOK@ME Garment Management System

---

## Table of Contents

| # | Guide File | Purpose |
|---|-----------|---------|
| 01 | [01-data-model.md](./01-data-model.md) | Mongoose schema, interfaces, indexes, auto-calculated fields |
| 02 | [02-api-routes.md](./02-api-routes.md) | REST API endpoints (GET / POST / PUT / DELETE), query params, response shapes |
| 03 | [03-sidebar-navigation.md](./03-sidebar-navigation.md) | Sidebar integration to activate the "Costing" link and add sub-nav |
| 04 | [04-costing-page.md](./04-costing-page.md) | Main list page — table, stats strip, pagination, row click detail modal |
| 05 | [05-costing-form.md](./05-costing-form.md) | Add / Edit costing form — multi-step wizard with purchasing description dropdown |
| 06 | [06-purchasing-description-dropdown.md](./06-purchasing-description-dropdown.md) | Dropdown that fetches unique purchasing descriptions (NOT categories) |
| 07 | [07-advanced-filtering.md](./07-advanced-filtering.md) | Full advanced filter drawer + primary filter bar with date range, search, etc. |
| 08 | [08-detail-modal.md](./08-detail-modal.md) | View-only detail modal for a single costing record |
| 09 | [09-design-theme-reference.md](./09-design-theme-reference.md) | Exact CSS variables, colours, fonts, animations, component styles to reuse |
| 10 | [10-file-structure.md](./10-file-structure.md) | Complete file tree of all new files and modified files |
| 11 | [11-testing-guide.md](./11-testing-guide.md) | Unit tests, integration tests, E2E tests for the costing module |

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        LOOK@ME System                        │
├────────────────┬─────────────────┬───────────────────────────┤
│   Purchasing   │    Costing      │    Future Modules         │
│   Module       │    Module       │    (Orders, Shops, etc.)  │
├────────────────┼─────────────────┤                           │
│ PurchaseRecord │ CostingRecord   │                           │
│ Category       │   ↓ references  │                           │
│ Supplier       │   description   │                           │
│                │   from Purchase │                           │
└────────────────┴─────────────────┴───────────────────────────┘
```

### How Costing Relates to Purchasing

The Costing module does **NOT** use `Category` directly. Instead, it pulls the **description** field from existing `PurchaseRecord` documents and presents them in a dropdown for the user to select.

**Key rule:** The user picks a `description` from purchasing records — e.g. "Fabric for cotton", "Cotton slab", "FABRIC * 100" — as the basis for the costing line item. This links costing to purchasing conceptually via the description text.

### Spreadsheet → Database Field Mapping

From the uploaded Excel "Costing" sheet:

| Excel Column | Database Field | Type | Notes |
|-------------|---------------|------|-------|
| A – DESIGN NO | `designNo` | `String` | Unique identifier, e.g. "1001" |
| B – DESCRIPTION | `description` | `String` | **Dropdown from purchasing descriptions** |
| C – SIZE | `size` | `String` | Enum: S, M, L, XL, 2XL, FREE |
| D – FABRIC NAME | `fabricName` | `String` | e.g. "VISCOSE LYCRA", "CM 40" |
| E – FABRIC PRICE | `fabricPrice` | `Number` | Price per unit of fabric |
| F – FABRIC CONSUMPTION | `fabricConsumption` | `Number` | Quantity consumed (e.g. 16", 42") |
| G – PRINT/BELT | `printBelt` | `Number` | Cost for printing/belt |
| H – THREAD/LABELS/POLLY BAGS | `threadLabelsPollyBags` | `Number` | Combined packaging cost |
| I – FUSING/ELASTIC/BUTTON/ZIP | `fusingElasticButtonZip` | `Number` | Trims and accessories cost |
| J – STANDARD MINUTES VALUE | `standardMinutesValue` | `Number` | Standard minutes for production |
| N – FABRIC COST | `fabricCost` | `Number` | **Auto-calculated**: fabricPrice × fabricConsumption |
| O – SEWING COST | `sewingCost` | `Number` | Sewing labour cost |
| P – ACCESSORIES COST | `accessoriesCost` | `Number` | Total accessories cost |
| Q – TOTAL COST | `totalCost` | `Number` | **Auto-calculated**: sum of all cost components |
| R – SELLING PRICE | `sellingPrice` | `Number` | User-set selling price |
| S – GROSS PROFIT | `grossProfit` | `Number` | **Auto-calculated**: sellingPrice - totalCost |
| T – PROFIT PERCENTAGE | `profitPercentage` | `Number` | **Auto-calculated**: (grossProfit / sellingPrice) × 100 |

---

## Design Principles

1. **Match the Purchasing module exactly** — same design tokens, same fonts (Outfit), same green primary colour (#16a34a)
2. **Use existing UI components** — `Button`, `Modal`, `Drawer`, `Toaster`
3. **TanStack Table** for the data grid (already a dependency)
4. **react-hook-form + zod** for form validation (already a dependency)
5. **axios** for API calls (already a dependency)
6. **No new npm dependencies required**
7. **Purchasing description dropdown** — NOT category dropdown

---

## Prerequisites Before Implementation

- [ ] The Purchasing module must be working with data (descriptions exist in PurchaseRecord collection)
- [ ] MongoDB connection via `lib/mongoose.ts` is working
- [ ] Next.js app router is configured correctly
- [ ] Tailwind CSS v4 with `@theme` config is in place

---

> **Next:** Start with [01-data-model.md](./01-data-model.md) to define the Mongoose schema.
