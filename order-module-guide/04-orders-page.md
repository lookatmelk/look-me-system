# 04 — Orders Page (Main List)

> **File to create:** `src/app/admin/orders/page.tsx`

---

## Overview

The orders page is the **main entry point** for the orders module. It mirrors the purchasing and costing page structure:

1. Page header with title + "Add Order" button
2. Stats strip (Total Orders, Total Units, Projected Revenue, Pending Orders)
3. Primary filter bar (search + advanced filters button)
4. Data table with TanStack Table
5. Pagination footer
6. Row-click → opens detail modal

---

## Page Structure (JSX Skeleton)

```tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import {
  Plus, Search, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, Eye, Edit2, Trash2,
  FileText, Package, Store, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toaster, showToast } from '@/components/ui/Toaster';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

// Import the detail modal (guide 08)
// Import the filter drawer (guide 07)
```

---

## State Variables

```typescript
function OrdersPageContent() {
  const router = useRouter();

  // ─── Data ───
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Search & Sort ───
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // ─── Filters (for Advanced Filter Drawer) ───
  const [statusFilter, setStatusFilter] = useState('');
  const [designNoFilter, setDesignNoFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [minTotalFilter, setMinTotalFilter] = useState('');
  const [maxTotalFilter, setMaxTotalFilter] = useState('');
  const [minRevenueFilter, setMinRevenueFilter] = useState('');
  const [maxRevenueFilter, setMaxRevenueFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // ─── Dropdown Data ───
  const [availableDesigns, setAvailableDesigns] = useState<any[]>([]);

  // ─── UI State ───
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; designNo: string }>({
    open: false, id: '', designNo: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
}
```

---

## Stats Strip

Show 4 stat cards matching the costing page design:

```tsx
const totalOrders = data.length;
const totalUnits = useMemo(() => {
  return data.reduce((sum, r) => sum + (r.designTotal || 0), 0);
}, [data]);
const totalRevenue = useMemo(() => {
  return data.reduce((sum, r) => sum + (r.projectedRevenue || 0), 0);
}, [data]);
const pendingCount = useMemo(() => {
  return data.filter(r => r.status === 'PENDING').length;
}, [data]);
```

**Stats Cards (4 columns):**

| Card | Label | Value | Color |
|------|-------|-------|-------|
| 1 | Total Orders | `data.length` | `text-slate-900` / `bg-white` |
| 2 | Total Units | `totalUnits` | `text-blue-700` / `bg-blue-50` |
| 3 | Projected Revenue | `LKR {totalRevenue}` | `text-green-700` / `bg-green-50` |
| 4 | Pending Orders | `pendingCount` | `text-amber-700` / `bg-amber-50` |

**JSX:**
```tsx
{!loading && data.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
    {[
      { label: 'Total Orders', value: totalOrders, color: 'text-slate-900', bg: 'bg-white' },
      { label: 'Total Units', value: totalUnits.toLocaleString(), color: 'text-blue-700', bg: 'bg-blue-50' },
      { label: 'Projected Revenue', value: `LKR ${totalRevenue.toLocaleString()}`, color: 'text-green-700', bg: 'bg-green-50' },
      { label: 'Pending Orders', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50' },
    ].map(stat => (
      <div key={stat.label} className={clsx('rounded-xl px-4 py-3 border border-slate-100 shadow-sm', stat.bg)}>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
        <p className={clsx('text-lg font-black truncate', stat.color)}>{stat.value}</p>
      </div>
    ))}
  </div>
)}
```

---

## Table Columns

Define using `createColumnHelper`:

```typescript
const columnHelper = createColumnHelper<any>();

const columns = useMemo(() => [
  // 1. Design No (sortable)
  columnHelper.accessor('designNo', {
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
        Design No <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: info => <span className="font-black text-slate-900 text-sm">{info.getValue()}</span>,
  }),

  // 2. Description
  columnHelper.accessor('description', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</span>,
    cell: info => <span className="font-semibold text-slate-900 text-sm max-w-[160px] truncate block">{info.getValue()}</span>,
  }),

  // 3. Shop 1 Qty
  columnHelper.accessor('shop1.qty', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shop 1</span>,
    cell: info => {
      const qty = info.getValue() || 0;
      return (
        <span className={clsx(
          'font-semibold text-sm font-mono',
          qty > 0 ? 'text-blue-700' : 'text-slate-300'
        )}>
          {qty > 0 ? qty.toLocaleString() : '—'}
        </span>
      );
    },
  }),

  // 4. Shop 2 Qty
  columnHelper.accessor('shop2.qty', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shop 2</span>,
    cell: info => {
      const qty = info.getValue() || 0;
      return (
        <span className={clsx(
          'font-semibold text-sm font-mono',
          qty > 0 ? 'text-violet-700' : 'text-slate-300'
        )}>
          {qty > 0 ? qty.toLocaleString() : '—'}
        </span>
      );
    },
  }),

  // 5. Shop 3 Qty
  columnHelper.accessor('shop3.qty', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shop 3</span>,
    cell: info => {
      const qty = info.getValue() || 0;
      return (
        <span className={clsx(
          'font-semibold text-sm font-mono',
          qty > 0 ? 'text-emerald-700' : 'text-slate-300'
        )}>
          {qty > 0 ? qty.toLocaleString() : '—'}
        </span>
      );
    },
  }),

  // 6. Design Total (sortable, highlighted)
  columnHelper.accessor('designTotal', {
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
        Total <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: info => (
      <span className="font-black text-green-700 text-sm font-mono">
        {(info.getValue() || 0).toLocaleString()}
      </span>
    ),
  }),

  // 7. Projected Revenue
  columnHelper.accessor('projectedRevenue', {
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
        Revenue <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: info => (
      <span className="font-semibold text-slate-900 text-sm font-mono">
        {(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    ),
  }),

  // 8. Status Badge
  columnHelper.accessor('status', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</span>,
    cell: info => {
      const status = info.getValue();
      const statusStyles: Record<string, string> = {
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
        IN_PRODUCTION: 'bg-blue-50 text-blue-700 border-blue-200',
        DISPATCHED: 'bg-violet-50 text-violet-700 border-violet-200',
        DELIVERED: 'bg-green-50 text-green-700 border-green-200',
        CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
      };
      const displayLabels: Record<string, string> = {
        PENDING: 'Pending',
        IN_PRODUCTION: 'In Production',
        DISPATCHED: 'Dispatched',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
      };
      return (
        <span className={clsx(
          'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border',
          statusStyles[status] || 'bg-slate-100 text-slate-500'
        )}>
          {displayLabels[status] || status}
        </span>
      );
    },
  }),

  // 9. Actions
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: (props) => (
      <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedRecord(props.row.original); }}
          className="text-slate-400 hover:text-blue-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
          title="View details"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${props.row.original._id}/edit`); }}
          className="text-slate-400 hover:text-green-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirm({ open: true, id: props.row.original._id, designNo: props.row.original.designNo });
          }}
          className="text-slate-400 hover:text-red-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-red-300 hover:shadow-md transition-all"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
  }),
], []);
```

---

## Table Configuration

```typescript
const table = useReactTable({
  data,
  columns,
  state: { globalFilter, sorting },
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 15 } },
});
```

---

## Data Fetching

```typescript
const fetchRecords = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (designNoFilter) params.append('designNo', designNoFilter);
    if (shopFilter) params.append('shop', shopFilter);
    if (minTotalFilter) params.append('minTotal', minTotalFilter);
    if (maxTotalFilter) params.append('maxTotal', maxTotalFilter);
    if (minRevenueFilter) params.append('minRevenue', minRevenueFilter);
    if (maxRevenueFilter) params.append('maxRevenue', maxRevenueFilter);
    if (startDateFilter) params.append('startDate', startDateFilter);
    if (endDateFilter) params.append('endDate', endDateFilter);

    const res = await axios.get(`/api/orders?${params.toString()}`);
    if (res.data.success) setData(res.data.data);
  } catch { /* silent */ } finally {
    setLoading(false);
  }
};

// Fetch available designs for the filter dropdown
const fetchDesigns = async () => {
  try {
    const res = await axios.get('/api/orders/designs');
    if (res.data.success) setAvailableDesigns(res.data.data);
  } catch { /* silent */ }
};

useEffect(() => {
  fetchDesigns();
}, []);

useEffect(() => {
  fetchRecords();
}, [
  statusFilter, designNoFilter, shopFilter,
  minTotalFilter, maxTotalFilter,
  minRevenueFilter, maxRevenueFilter,
  startDateFilter, endDateFilter,
]);
```

---

## Delete Handler (with ConfirmModal)

```typescript
const handleDelete = async () => {
  if (!deleteConfirm.id) return;
  setIsDeleting(true);
  try {
    await axios.delete(`/api/orders/${deleteConfirm.id}`);
    showToast(`Order for design ${deleteConfirm.designNo} deleted`, 'success');
    fetchRecords();
  } catch {
    showToast('Failed to delete order', 'error');
  } finally {
    setIsDeleting(false);
    setDeleteConfirm({ open: false, id: '', designNo: '' });
  }
};
```

```tsx
{/* Confirm Delete Modal */}
<ConfirmModal
  isOpen={deleteConfirm.open}
  onClose={() => setDeleteConfirm({ open: false, id: '', designNo: '' })}
  onConfirm={handleDelete}
  title="Delete Order"
  message={`Are you sure you want to delete the order for design "${deleteConfirm.designNo}"? This action cannot be undone.`}
  confirmText="Delete"
  isLoading={isDeleting}
/>
```

---

## Row Styling

Match the costing and purchasing table row styling. For orders, color-code subtly by status:

```tsx
<tr
  key={row.id}
  onClick={() => setSelectedRecord(row.original)}
  className={clsx(
    'group border-b border-slate-50 last:border-0 transition-colors cursor-pointer',
    row.original.status === 'DELIVERED' && 'hover:bg-green-50/40',
    row.original.status === 'PENDING' && 'hover:bg-amber-50/40',
    row.original.status === 'IN_PRODUCTION' && 'hover:bg-blue-50/40',
    row.original.status === 'CANCELLED' && 'hover:bg-slate-50/60',
    row.original.status === 'DISPATCHED' && 'hover:bg-violet-50/40',
  )}
>
```

---

## Page Export

```tsx
export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersPageContent />
    </Suspense>
  );
}
```

---

## Key Design Notes

1. **Same card container**: `bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden`
2. **Same table header**: `border-b border-slate-100 bg-slate-50/60`
3. **Same loading spinner**: green border-t spinner
4. **Same empty state**: Search icon + "No records found" + clear filters button
5. **Same pagination**: "Showing X – Y of Z" with ChevronLeft/ChevronRight buttons
6. **Status badges** replace the profit percentage badges from costing — each status has its own color
7. **Shop quantities use distinct colors**: Shop 1 (blue), Shop 2 (violet), Shop 3 (emerald)
8. **Uses ConfirmModal** for delete confirmation (not browser `confirm()` dialog)

---

> **Next:** [05-order-form.md](./05-order-form.md)
