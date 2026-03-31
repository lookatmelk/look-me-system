# 04 — Costing Page (Main List)

> **File to create:** `src/app/admin/costing/page.tsx`

---

## Overview

The costing page is the **main entry point** for the costing module. It mirrors the purchasing page structure exactly:

1. Page header with title + "Add Costing" button
2. Stats strip (Total Records, Avg Profit %, Highest Cost, Lowest Cost)
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toaster, showToast } from '@/components/ui/Toaster';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

// Import the detail modal (guide 08)
// Import the filter drawer (guide 07)
// Import the form modal (guide 05)
```

---

## State Variables

```typescript
function CostingPageContent() {
  const router = useRouter();

  // ─── Data ───
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Search & Sort ───
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // ─── Filters (for Advanced Filter Drawer) ───
  const [sizeFilter, setSizeFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [minProfitFilter, setMinProfitFilter] = useState('');
  const [maxProfitFilter, setMaxProfitFilter] = useState('');
  const [minCostFilter, setMinCostFilter] = useState('');
  const [maxCostFilter, setMaxCostFilter] = useState('');
  const [minSellingPriceFilter, setMinSellingPriceFilter] = useState('');
  const [maxSellingPriceFilter, setMaxSellingPriceFilter] = useState('');

  // ─── Dropdowns ───
  const [purchasingDescriptions, setPurchasingDescriptions] = useState<string[]>([]);

  // ─── UI State ───
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
}
```

---

## Stats Strip

Match the purchasing page stats strip design. Show 4 stat cards:

```tsx
const totalRecords = data.length;
const avgProfitPct = useMemo(() => {
  if (data.length === 0) return 0;
  const sum = data.reduce((s, r) => s + (r.profitPercentage || 0), 0);
  return Number((sum / data.length).toFixed(2));
}, [data]);
const highestCost = useMemo(() => {
  return data.reduce((max, r) => Math.max(max, r.totalCost || 0), 0);
}, [data]);
const lowestCost = useMemo(() => {
  if (data.length === 0) return 0;
  return data.reduce((min, r) => Math.min(min, r.totalCost || Infinity), Infinity);
}, [data]);
```

**Stats Cards (4 columns):**

| Card | Label | Value | Color |
|------|-------|-------|-------|
| 1 | Total Records | `data.length` | `text-slate-900` / `bg-white` |
| 2 | Avg Profit % | `avgProfitPct%` | `text-green-700` / `bg-green-50` |
| 3 | Highest Cost | `LKR {highestCost}` | `text-violet-700` / `bg-violet-50` |
| 4 | Lowest Cost | `LKR {lowestCost}` | `text-amber-700` / `bg-amber-50` |

**JSX:**
```tsx
{!loading && data.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
    {[
      { label: 'Total Records', value: totalRecords, color: 'text-slate-900', bg: 'bg-white' },
      { label: 'Avg Profit %', value: `${avgProfitPct}%`, color: 'text-green-700', bg: 'bg-green-50' },
      { label: 'Highest Cost', value: `LKR ${highestCost.toLocaleString()}`, color: 'text-violet-700', bg: 'bg-violet-50' },
      { label: 'Lowest Cost', value: `LKR ${lowestCost.toLocaleString()}`, color: 'text-amber-700', bg: 'bg-amber-50' },
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

  // 3. Size
  columnHelper.accessor('size', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Size</span>,
    cell: info => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
        {info.getValue()}
      </span>
    ),
  }),

  // 4. Fabric Name
  columnHelper.accessor('fabricName', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fabric</span>,
    cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()}</span>,
  }),

  // 5. Fabric Price
  columnHelper.accessor('fabricPrice', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fabric Price</span>,
    cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
  }),

  // 6. Total Cost (sortable, highlight)
  columnHelper.accessor('totalCost', {
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
        Total Cost <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: info => (
      <span className="font-black text-red-700 text-sm">
        {info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    ),
  }),

  // 7. Selling Price (sortable)
  columnHelper.accessor('sellingPrice', {
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
        Selling Price <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: info => (
      <span className="font-black text-green-700 text-sm">
        {info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    ),
  }),

  // 8. Gross Profit
  columnHelper.accessor('grossProfit', {
    header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Profit</span>,
    cell: info => {
      const val = info.getValue();
      return (
        <span className={clsx('font-semibold text-sm', val >= 0 ? 'text-green-700' : 'text-red-600')}>
          {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      );
    },
  }),

  // 9. Profit % (sortable, color-coded)
  columnHelper.accessor('profitPercentage', {
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
        Profit % <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: info => {
      const pct = info.getValue();
      return (
        <span className={clsx(
          'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide',
          pct >= 30 && 'bg-green-50 text-green-700 border border-green-200',
          pct >= 20 && pct < 30 && 'bg-amber-50 text-amber-700 border border-amber-200',
          pct < 20 && 'bg-red-50 text-red-700 border border-red-200',
        )}>
          {pct.toFixed(2)}%
        </span>
      );
    },
    enableGlobalFilter: false,
  }),

  // 10. Actions
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
          onClick={(e) => { e.stopPropagation(); setEditingRecord(props.row.original); setIsFormModalOpen(true); }}
          className="text-slate-400 hover:text-green-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(props.row.original._id, props.row.original.designNo); }}
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
    if (sizeFilter) params.append('size', sizeFilter);
    if (descriptionFilter) params.append('description', descriptionFilter);
    if (minProfitFilter) params.append('minProfit', minProfitFilter);
    if (maxProfitFilter) params.append('maxProfit', maxProfitFilter);
    if (minCostFilter) params.append('minTotalCost', minCostFilter);
    if (maxCostFilter) params.append('maxTotalCost', maxCostFilter);
    if (minSellingPriceFilter) params.append('minSellingPrice', minSellingPriceFilter);
    if (maxSellingPriceFilter) params.append('maxSellingPrice', maxSellingPriceFilter);

    const res = await axios.get(`/api/costing?${params.toString()}`);
    if (res.data.success) setData(res.data.data);
  } catch { /* silent */ } finally {
    setLoading(false);
  }
};

// Fetch purchasing descriptions for the filter dropdown
const fetchDescriptions = async () => {
  try {
    const res = await axios.get('/api/costing/descriptions');
    if (res.data.success) setPurchasingDescriptions(res.data.data);
  } catch { /* silent */ }
};

useEffect(() => {
  fetchDescriptions();
}, []);

useEffect(() => {
  fetchRecords();
}, [sizeFilter, descriptionFilter, minProfitFilter, maxProfitFilter, minCostFilter, maxCostFilter, minSellingPriceFilter, maxSellingPriceFilter]);
```

---

## Row Styling

Match the purchasing table row styling. For costing, color-code by profit percentage:

```tsx
<tr
  key={row.id}
  onClick={() => setSelectedRecord(row.original)}
  className={clsx(
    'group border-b border-slate-50 last:border-0 transition-colors cursor-pointer',
    row.original.profitPercentage >= 30 && 'hover:bg-green-50/40',
    row.original.profitPercentage >= 20 && row.original.profitPercentage < 30 && 'hover:bg-amber-50/40',
    row.original.profitPercentage < 20 && 'hover:bg-red-50/40',
  )}
>
```

---

## Page Export

```tsx
export default function CostingPage() {
  return (
    <Suspense>
      <CostingPageContent />
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
6. **Profit percentage color coding** replaces the status badges from purchasing

---

> **Next:** [05-costing-form.md](./05-costing-form.md)
