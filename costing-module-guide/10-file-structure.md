# 10 — File Structure

> Complete list of all files to create and modify for the Costing module.

---

## New Files to Create

```
src/
├── models/
│   └── CostingRecord.ts                          [NEW] Mongoose schema
│
├── app/
│   ├── api/
│   │   └── costing/
│   │       ├── route.ts                           [NEW] GET (list) + POST (create)
│   │       ├── [id]/
│   │       │   └── route.ts                       [NEW] GET + PUT + DELETE single record
│   │       └── descriptions/
│   │           └── route.ts                       [NEW] GET unique purchasing descriptions
│   │
│   └── admin/
│       └── costing/
│           └── page.tsx                           [NEW] Main costing page with table
│
├── components/
│   └── costing/
│       ├── CostingFormModal.tsx                   [NEW] Add/Edit form (3-step wizard)
│       └── CostingDetailModal.tsx                 [NEW] View-only detail modal
```

---

## Existing Files to Modify

```
src/
├── components/
│   └── Sidebar.tsx                                [MODIFY] Activate Costing nav link
│
├── components/
│   └── TopHeader.tsx                              [MODIFY] Add "costing" to breadcrumb map
```

---

## Files That Do NOT Need Changes

```
src/
├── app/
│   ├── layout.tsx                                 ✓ No changes (fonts already configured)
│   ├── globals.css                                ✓ No changes (all tokens already defined)
│   └── admin/
│       └── layout.tsx                             ✓ No changes (renders {children} for all /admin/*)
│
├── components/
│   └── ui/
│       ├── Button.tsx                             ✓ Reuse as-is
│       ├── Modal.tsx                              ✓ Reuse as-is
│       ├── Drawer.tsx                             ✓ Available but filter drawer is inline
│       └── Toaster.tsx                            ✓ Reuse as-is
│
├── lib/
│   └── mongoose.ts                                ✓ Reuse as-is
│
├── middleware.ts                                   ✓ Already protects /admin/* routes
│
├── models/
│   ├── PurchaseRecord.ts                          ✓ Queried for descriptions (not modified)
│   ├── Category.ts                                ✓ Not used by Costing module
│   └── Supplier.ts                                ✓ Not used by Costing module
```

---

## Total Count

| Type | Count |
|------|-------|
| New files | **7** |
| Modified files | **2** |
| Unchanged (reused) | **11+** |

---

## File Sizes (Estimated)

| File | Est. Lines | Notes |
|------|-----------|-------|
| `models/CostingRecord.ts` | ~80 | Schema + pre-save hook |
| `api/costing/route.ts` | ~120 | GET with filters + POST |
| `api/costing/[id]/route.ts` | ~100 | GET + PUT + DELETE |
| `api/costing/descriptions/route.ts` | ~25 | Simple distinct query |
| `admin/costing/page.tsx` | ~600-800 | Main page with table, filters, modals |
| `components/costing/CostingFormModal.tsx` | ~350 | 3-step form |
| `components/costing/CostingDetailModal.tsx` | ~150 | Read-only modal |

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

1. `src/models/CostingRecord.ts` — Define the data model first
2. `src/app/api/costing/descriptions/route.ts` — Purchasing descriptions endpoint
3. `src/app/api/costing/route.ts` — List + Create endpoints
4. `src/app/api/costing/[id]/route.ts` — Single record CRUD
5. `src/components/Sidebar.tsx` — Activate the nav link
6. `src/components/TopHeader.tsx` — Add breadcrumb entry
7. `src/components/costing/CostingDetailModal.tsx` — Detail modal (simpler, build first)
8. `src/components/costing/CostingFormModal.tsx` — Add/Edit form
9. `src/app/admin/costing/page.tsx` — Main page (assembles everything)

This order ensures dependencies are met at each step.

---

> **Next:** [11-testing-guide.md](./11-testing-guide.md)
