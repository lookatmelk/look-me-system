# 07 — Advanced Filtering

> **Implementation location:** Within `src/app/admin/orders/page.tsx` (inline drawer, matching the purchasing and costing page patterns)

---

## Overview

The orders module has two filtering layers, exactly like the purchasing and costing pages:

1. **Primary Filter Bar** — always visible above the table
2. **Advanced Filter Drawer** — off-canvas slide-in panel from the right

---

## 1. Primary Filter Bar

Sits inside the table card, between the header and the data rows.

```tsx
{/* ── PRIMARY FILTER BAR ── */}
<div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">

  {/* Search */}
  <div className="relative flex-1 min-w-[180px] max-w-xs">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Search className="h-4 w-4 text-slate-400" />
    </div>
    <input
      type="text"
      value={globalFilter ?? ''}
      onChange={(e) => setGlobalFilter(e.target.value)}
      className="block w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all"
      placeholder="Search design no, description..."
    />
  </div>

  {/* Filters Button with Badge */}
  <button
    id="open-orders-filters-btn"
    onClick={() => setIsFilterDrawerOpen(true)}
    className={clsx(
      'relative flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap',
      activeFilterCount > 0
        ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
    )}
    aria-label="Open advanced filters"
  >
    <Filter className="h-3.5 w-3.5" />
    Filters
    {activeFilterCount > 0 && (
      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-bold px-1 shadow">
        {activeFilterCount}
      </span>
    )}
  </button>

  {/* Quick Clear All */}
  {(globalFilter || activeFilterCount > 0) && (
    <button
      onClick={() => { setGlobalFilter(''); resetAllFilters(); }}
      className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors whitespace-nowrap"
    >
      Clear all
    </button>
  )}
</div>
```

---

## 2. Active Filter Count

```typescript
const activeFilterCount = useMemo(() => {
  let count = 0;
  if (statusFilter) count++;
  if (designNoFilter) count++;
  if (shopFilter) count++;
  if (minTotalFilter || maxTotalFilter) count++;
  if (minRevenueFilter || maxRevenueFilter) count++;
  if (startDateFilter || endDateFilter) count++;
  return count;
}, [statusFilter, designNoFilter, shopFilter, minTotalFilter, maxTotalFilter, minRevenueFilter, maxRevenueFilter, startDateFilter, endDateFilter]);
```

---

## 3. Reset All Filters

```typescript
const resetAllFilters = () => {
  setStatusFilter('');
  setDesignNoFilter('');
  setShopFilter('');
  setMinTotalFilter('');
  setMaxTotalFilter('');
  setMinRevenueFilter('');
  setMaxRevenueFilter('');
  setStartDateFilter('');
  setEndDateFilter('');
};
```

---

## 4. Advanced Filter Drawer

Full implementation matching the costing page drawer design:

```tsx
{isFilterDrawerOpen && (
  <div
    className="fixed inset-0 z-50 flex justify-end"
    role="dialog"
    aria-modal="true"
    aria-label="Advanced filters"
  >
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => setIsFilterDrawerOpen(false)}
    />

    {/* Panel */}
    <div className="relative z-10 flex flex-col h-full w-full max-w-sm bg-white shadow-2xl">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Advanced Filters</h2>
          <p className="text-xs text-slate-400 mt-0.5">Refine order records</p>
        </div>
        <button
          onClick={() => setIsFilterDrawerOpen(false)}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Close filters"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ─── Scrollable Body ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* ── Status Filter ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Order Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Design Number Filter ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Design Number
          </label>
          <div className="relative">
            <select
              value={designNoFilter}
              onChange={(e) => setDesignNoFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
            >
              <option value="">All Designs</option>
              {availableDesigns.map((design) => (
                <option key={design._id} value={design.designNo}>
                  {design.designNo} — {design.description}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Shop Filter ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Shop Allocation
          </label>
          <div className="relative">
            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
            >
              <option value="">All Shops</option>
              <option value="shop1">Shop 1 (has orders)</option>
              <option value="shop2">Shop 2 (has orders)</option>
              <option value="shop3">Shop 3 (has orders)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Design Total Range ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Design Total Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-medium mb-1 block">Min</label>
              <input
                type="number"
                step="1"
                value={minTotalFilter}
                onChange={(e) => setMinTotalFilter(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium mb-1 block">Max</label>
              <input
                type="number"
                step="1"
                value={maxTotalFilter}
                onChange={(e) => setMaxTotalFilter(e.target.value)}
                placeholder="∞"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Projected Revenue Range ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Projected Revenue Range (LKR)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-medium mb-1 block">Min</label>
              <input
                type="number"
                step="0.01"
                value={minRevenueFilter}
                onChange={(e) => setMinRevenueFilter(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium mb-1 block">Max</label>
              <input
                type="number"
                step="0.01"
                value={maxRevenueFilter}
                onChange={(e) => setMaxRevenueFilter(e.target.value)}
                placeholder="∞"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Date Range Filter ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Order Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-medium mb-1 block">From</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium mb-1 block">To</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ─── Drawer Footer ─── */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-3">
        <button
          onClick={resetAllFilters}
          className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all"
        >
          Reset All
        </button>
        <button
          onClick={() => setIsFilterDrawerOpen(false)}
          className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Filter → API Query Mapping

| Filter State | API Query Parameter | Notes |
|-------------|-------------------|-------|
| `statusFilter` | `?status=PENDING` | Exact match |
| `designNoFilter` | `?designNo=1001` | Exact match |
| `shopFilter` | `?shop=shop1` | Filter by shop with qty > 0 |
| `minTotalFilter` | `?minTotal=100` | Range filter |
| `maxTotalFilter` | `?maxTotal=500` | Range filter |
| `minRevenueFilter` | `?minRevenue=10000` | Range filter |
| `maxRevenueFilter` | `?maxRevenue=100000` | Range filter |
| `startDateFilter` | `?startDate=2026-01-01` | Date range start |
| `endDateFilter` | `?endDate=2026-03-31` | Date range end |
| `globalFilter` | Client-side (TanStack Table) | Filters across all columns |

---

## Reactive Filtering

Filters trigger a re-fetch when any filter state changes:

```typescript
useEffect(() => {
  fetchRecords();
}, [
  statusFilter,
  designNoFilter,
  shopFilter,
  minTotalFilter,
  maxTotalFilter,
  minRevenueFilter,
  maxRevenueFilter,
  startDateFilter,
  endDateFilter,
]);
```

The `globalFilter` (search bar) is handled **client-side** by TanStack Table's `getFilteredRowModel()` — no API call needed.

---

## Styling Consistency Checklist

- [x] Drawer uses `max-w-sm` (same as purchasing and costing)
- [x] Backdrop: `bg-black/30 backdrop-blur-sm`
- [x] Header: bold title + subtitle + X close button
- [x] Labels: `text-[11px] font-bold text-slate-500 uppercase tracking-wider`
- [x] Selects: `rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8`
- [x] Inputs: `rounded-xl border border-slate-200 bg-white py-2 px-3`
- [x] Footer: `bg-slate-50/60` with Reset + Apply buttons
- [x] Green focus ring: `focus:ring-1 focus:ring-green-500 focus:border-green-500`
- [x] Filter badge: `bg-green-600 text-white` badge on the Filters button

---

> **Next:** [08-detail-modal.md](./08-detail-modal.md)
