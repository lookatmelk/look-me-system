"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
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
import { Suspense } from 'react';

import CostingDetailModal from '@/components/costing/CostingDetailModal';

function CostingPageContent() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [sizeFilter, setSizeFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [minProfitFilter, setMinProfitFilter] = useState('');
  const [maxProfitFilter, setMaxProfitFilter] = useState('');
  const [minCostFilter, setMinCostFilter] = useState('');
  const [maxCostFilter, setMaxCostFilter] = useState('');
  const [minSellingPriceFilter, setMinSellingPriceFilter] = useState('');
  const [maxSellingPriceFilter, setMaxSellingPriceFilter] = useState('');

  const [purchasingDescriptions, setPurchasingDescriptions] = useState<any[]>([]);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sizeFilter) count++;
    if (descriptionFilter) count++;
    if (minProfitFilter || maxProfitFilter) count++;
    if (minCostFilter || maxCostFilter) count++;
    if (minSellingPriceFilter || maxSellingPriceFilter) count++;
    return count;
  }, [sizeFilter, descriptionFilter, minProfitFilter, maxProfitFilter, minCostFilter, maxCostFilter, minSellingPriceFilter, maxSellingPriceFilter]);

  const resetAllFilters = () => {
    setSizeFilter('');
    setDescriptionFilter('');
    setMinProfitFilter('');
    setMaxProfitFilter('');
    setMinCostFilter('');
    setMaxCostFilter('');
    setMinSellingPriceFilter('');
    setMaxSellingPriceFilter('');
  };

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
    } catch {
      showToast('error', "Failed to load costing records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDescriptions = async () => {
    try {
      const res = await axios.get('/api/costing/descriptions');
      if (res.data.success) setPurchasingDescriptions(res.data.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchDescriptions();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [sizeFilter, descriptionFilter, minProfitFilter, maxProfitFilter, minCostFilter, maxCostFilter, minSellingPriceFilter, maxSellingPriceFilter]);

  const handleDelete = async (id: string, designNo: string) => {
    if (confirm(`Are you sure you want to delete costing record ${designNo}?`)) {
      try {
        const res = await axios.delete(`/api/costing/${id}`);
        if (res.data.success) {
          showToast('success', "Record deleted successfully");
          fetchRecords();
        }
      } catch (error: any) {
        showToast('error', error.response?.data?.error || "Failed to delete record");
      }
    }
  };

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(() => [
    columnHelper.accessor('designNo', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Design No <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-black text-slate-900 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</span>,
      cell: info => <span className="font-semibold text-slate-900 text-sm max-w-[160px] truncate block">{info.getValue()}</span>,
    }),
    columnHelper.accessor('size', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Size</span>,
      cell: info => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('fabric', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fabric</span>,
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('fabricPrice', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fabric Price</span>,
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('totalCost', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Total Cost <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => (
        <span className="font-black text-red-700 text-sm">
          {info.getValue()?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor('sellingPrice', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Selling Price <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => (
        <span className="font-black text-green-700 text-sm">
          {info.getValue()?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor('grossProfit', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Profit</span>,
      cell: info => {
        const val = info.getValue() || 0;
        return (
          <span className={clsx('font-semibold text-sm', val >= 0 ? 'text-green-700' : 'text-red-600')}>
            {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      },
    }),
    columnHelper.accessor('profitPercentage', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Profit % <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => {
        const pct = info.getValue() || 0;
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
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (props) => (
        <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedRecord(props.row.original); }}
            className="text-slate-400 hover:text-blue-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/admin/costing/${props.row.original._id}/edit`); }}
            className="text-slate-400 hover:text-green-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(props.row.original._id, props.row.original.designNo); }}
            className="text-slate-400 hover:text-red-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    }),
  ], [router]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Costing</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage item costings and configurations.</p>
        </div>
        <Button
          onClick={() => router.push('/admin/costing/add')}
          className="gap-2 shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Costing
        </Button>
      </div>

      {/* Stats Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
          {[
            { label: 'Total Records', value: totalRecords, color: 'text-slate-900', bg: 'bg-white' },
            { label: 'Avg Profit %', value: `${avgProfitPct}%`, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Highest Cost', value: `LKR ${highestCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Lowest Cost', value: `LKR ${lowestCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-amber-700', bg: 'bg-amber-50' },
          ].map(stat => (
            <div key={stat.label} className={clsx('rounded-xl px-4 py-3 border border-slate-100 shadow-sm', stat.bg)}>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
              <p className={clsx('text-lg font-black truncate', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table & Filtering */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative z-0">
        
        {/* Primary Filter Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all outline-none"
              placeholder="Search design no, description, fabric..."
            />
          </div>

          <button
            id="open-costing-filters-btn"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={clsx(
              'relative flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap cursor-pointer',
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

          {(globalFilter || activeFilterCount > 0) && (
            <button
              onClick={() => { setGlobalFilter(''); resetAllFilters(); }}
              className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-100 bg-slate-50/60">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-5 py-3 whitespace-nowrap align-middle">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-3">
                      <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Loading records...</p>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-4">
                      <Search className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">No costing records found</p>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                      {globalFilter || activeFilterCount > 0
                        ? "We couldn't find any records matching your current filter criteria."
                        : "There are no costing records in the database yet."}
                    </p>
                    {(globalFilter || activeFilterCount > 0) && (
                      <Button onClick={() => { setGlobalFilter(''); resetAllFilters(); }} variant="outline" className="text-slate-600">
                        Clear all filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRecord(row.original)}
                    className={clsx(
                      'group transition-colors cursor-pointer',
                      row.original.profitPercentage >= 30 ? 'hover:bg-green-50/40' :
                      row.original.profitPercentage >= 20 ? 'hover:bg-amber-50/40' :
                      'hover:bg-red-50/40'
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-5 py-3 whitespace-nowrap align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="font-bold text-slate-700">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of <span className="font-bold text-slate-700">{table.getFilteredRowModel().rows.length}</span> records
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Advanced Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label="Advanced filters">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="relative z-10 flex flex-col h-full w-full max-w-sm bg-white shadow-2xl animate-slide-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Advanced Filters</h2>
                <p className="text-xs text-slate-400 mt-0.5">Refine costing records</p>
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Close filters"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Size</label>
                <div className="relative">
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm outline-none cursor-pointer"
                  >
                    <option value="">All Sizes</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="FREE">FREE</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Purchasing Description
                </label>
                <div className="relative">
                  <select
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm outline-none cursor-pointer"
                  >
                    <option value="">All Descriptions</option>
                    {purchasingDescriptions.map((desc) => (
                      <option key={desc.description} value={desc.description}>{desc.description}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Profit Percentage Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium mb-1 block">Min %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={minProfitFilter}
                      onChange={(e) => setMinProfitFilter(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium mb-1 block">Max %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={maxProfitFilter}
                      onChange={(e) => setMaxProfitFilter(e.target.value)}
                      placeholder="100"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Cost Range (LKR)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium mb-1 block">Min</label>
                    <input
                      type="number"
                      step="0.01"
                      value={minCostFilter}
                      onChange={(e) => setMinCostFilter(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium mb-1 block">Max</label>
                    <input
                      type="number"
                      step="0.01"
                      value={maxCostFilter}
                      onChange={(e) => setMaxCostFilter(e.target.value)}
                      placeholder="∞"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Selling Price Range (LKR)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium mb-1 block">Min</label>
                    <input
                      type="number"
                      step="0.01"
                      value={minSellingPriceFilter}
                      onChange={(e) => setMinSellingPriceFilter(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-medium mb-1 block">Max</label>
                    <input
                      type="number"
                      step="0.01"
                      value={maxSellingPriceFilter}
                      onChange={(e) => setMaxSellingPriceFilter(e.target.value)}
                      placeholder="∞"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm text-right font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-3">
              <button
                onClick={resetAllFilters}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(22,163,74,0.28)] cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <CostingDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
      
      <Toaster />
    </div>
  );
}

export default function CostingPage() {
  return (
    <Suspense>
      <CostingPageContent />
    </Suspense>
  );
}
