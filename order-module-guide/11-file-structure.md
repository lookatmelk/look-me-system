# 11 — File Structure

> Complete list of all files to create and modify for the Orders module.

---

## New Files to Create

```
src/
├── models/
│   └── OrderRecord.ts                              [NEW] Mongoose schema with ShopAllocation sub-doc
│
├── app/
│   ├── api/
│   │   └── orders/
│   │       ├── route.ts                             [NEW] GET (list + filter) + POST (create)
│   │       ├── [id]/
│   │       │   └── route.ts                         [NEW] GET + PUT + DELETE single record
│   │       ├── designs/
│   │       │   └── route.ts                         [NEW] GET design numbers from CostingRecord
│   │       └── stats/
│   │           └── route.ts                         [NEW] GET aggregated stats
│   │
│   └── admin/
│       └── orders/
│           ├── page.tsx                             [NEW] Main orders page with table
│           ├── add/
│           │   └── page.tsx                         [NEW] Add order page wrapper
│           └── [id]/
│               └── edit/
│                   └── page.tsx                     [NEW] Edit order page wrapper
│
├── components/
│   └── orders/
│       ├── OrderForm.tsx                            [NEW] Shared form component (3-step wizard)
│       └── OrderDetailModal.tsx                     [NEW] View-only detail modal
```

---

## Existing Files to Modify

```
src/
├── components/
│   └── Sidebar.tsx                                  [MODIFY] Move "Orders" from inactiveTabs to navigation
│
├── components/
│   └── TopHeader.tsx                                [MODIFY] Add "orders" to breadcrumb crumbMap
```

---

## Files That Do NOT Need Changes

```
src/
├── app/
│   ├── layout.tsx                                   ✓ No changes (fonts already configured)
│   ├── globals.css                                  ✓ No changes (all tokens already defined)
│   └── admin/
│       └── layout.tsx                               ✓ No changes (renders {children} for all /admin/*)
│
├── components/
│   └── ui/
│       ├── Button.tsx                               ✓ Reuse as-is
│       ├── Modal.tsx                                ✓ Reuse as-is
│       ├── ConfirmModal.tsx                         ✓ Reuse as-is (for delete confirmation)
│       ├── Drawer.tsx                               ✓ Available but filter drawer is inline
│       └── Toaster.tsx                              ✓ Reuse as-is
│
├── lib/
│   └── mongoose.ts                                  ✓ Reuse as-is
│
├── middleware.ts                                     ✓ Already protects /admin/* routes
│
├── models/
│   ├── CostingRecord.ts                             ✓ Queried for designs (not modified)
│   ├── PurchaseRecord.ts                            ✓ Has linkedOrderId field (not modified)
│   ├── Category.ts                                  ✓ Not used by Orders module
│   └── Supplier.ts                                  ✓ Not used by Orders module
```

---

## Total Count

| Type | Count |
|------|-------|
| New files | **10** |
| Modified files | **2** |
| Unchanged (reused) | **12+** |

---

## File Sizes (Estimated)

| File | Est. Lines | Notes |
|------|-----------|-------|
| `models/OrderRecord.ts` | ~120 | Schema + ShopAllocation sub-doc + pre-save hook |
| `api/orders/route.ts` | ~160 | GET with 9+ filters + POST with costing snapshot |
| `api/orders/[id]/route.ts` | ~100 | GET + PUT + DELETE |
| `api/orders/designs/route.ts` | ~25 | CostingRecord query |
| `api/orders/stats/route.ts` | ~50 | Aggregation pipeline |
| `admin/orders/page.tsx` | ~700-900 | Main page with table, filters, modals |
| `admin/orders/add/page.tsx` | ~80 | Wrapper for OrderForm |
| `admin/orders/[id]/edit/page.tsx` | ~100 | Wrapper with data fetching + OrderForm |
| `components/orders/OrderForm.tsx` | ~500 | 3-step form with ShopAllocationSection |
| `components/orders/OrderDetailModal.tsx` | ~250 | Read-only modal with sections |

---

## Dependency Check

All required packages are **already installed**:

| Package | Version | Used For |
|---------|---------|----------|
| `@tanstack/react-table` | `^8.21.3` | Data table |
| `react-hook-form` | `^7.72.0` | Form state management |
| `@hookform/resolvers` | `^5.2.2` | Zod integration |
| `zod` | `^4.3.6` | Schema validation |
| `axios` | `^1.13.6` | API calls |
| `lucide-react` | `^1.6.0` | Icons |
| `clsx` | `^2.1.1` | Conditional classes |
| `date-fns` | `^4.1.0` | Date formatting |
| `mongoose` | `^9.3.2` | Database ODM |
| `tailwindcss` | `^4` | Styling |

**No new npm packages needed.**

---

## Implementation Order

1. `src/models/OrderRecord.ts` — Define the data model first
2. `src/app/api/orders/designs/route.ts` — Designs dropdown endpoint
3. `src/app/api/orders/stats/route.ts` — Stats aggregation endpoint
4. `src/app/api/orders/route.ts` — List + Create endpoints
5. `src/app/api/orders/[id]/route.ts` — Single record CRUD
6. `src/components/Sidebar.tsx` — Activate the nav link
7. `src/components/TopHeader.tsx` — Add breadcrumb entry
8. `src/components/orders/OrderDetailModal.tsx` — Detail modal (simpler, build first)
9. `src/components/orders/OrderForm.tsx` — Add/Edit form with shop allocations
10. `src/app/admin/orders/add/page.tsx` — Add page wrapper
11. `src/app/admin/orders/[id]/edit/page.tsx` — Edit page wrapper
12. `src/app/admin/orders/page.tsx` — Main page (assembles everything)

This order ensures dependencies are met at each step.

---

## Test Files to Create

```
__tests__/
└── orders/
    ├── OrderRecord.test.ts                          [NEW] Model unit tests
    ├── orders-api.test.ts                           [NEW] API integration tests
    └── orders-designs.test.ts                       [NEW] Designs endpoint tests

e2e/
└── orders.spec.ts                                    [NEW] Playwright E2E tests
```

---

> **Next:** [12-validation-guide.md](./12-validation-guide.md)
