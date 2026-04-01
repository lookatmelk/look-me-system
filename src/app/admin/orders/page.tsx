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
  Package, TrendingUp, AlertCircle, Store
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toaster, showToast } from '@/components/ui/Toaster';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DesignOption {
  _id: string;
  designNo: string;
  description: string;
}

const columnHelper = createColumnHelper<any>();

export default function OrdersPage() {
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
  const [sampleNoFilter, setSampleNoFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [minTotalFilter, setMinTotalFilter] = useState('');
  const [maxTotalFilter, setMaxTotalFilter] = useState('');
  const [minRevenueFilter, setMinRevenueFilter] = useState('');
  const [maxRevenueFilter, setMaxRevenueFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // ─── Dropdown Data ───
  const [availableDesigns, setAvailableDesigns] = useState<DesignOption[]>([]);
  const [allShops, setAllShops] = useState<any[]>([]);

  // ─── UI State ───
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; designNo: string }>({
    open: false, id: '', designNo: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Stats ───
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

  // ─── Active Filter Count ───
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (designNoFilter) count++;
    if (sampleNoFilter) count++;
    if (shopFilter) count++;
    if (minTotalFilter || maxTotalFilter) count++;
    if (minRevenueFilter || maxRevenueFilter) count++;
    if (startDateFilter || endDateFilter) count++;
    return count;
  }, [statusFilter, designNoFilter, sampleNoFilter, shopFilter, minTotalFilter, maxTotalFilter, minRevenueFilter, maxRevenueFilter, startDateFilter, endDateFilter]);

  // ─── Reset All Filters ───
  const resetAllFilters = () => {
    setStatusFilter('');
    setDesignNoFilter('');
    setSampleNoFilter('');
    setShopFilter('');
    setMinTotalFilter('');
    setMaxTotalFilter('');
    setMinRevenueFilter('');
    setMaxRevenueFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  // ─── Fetch Data ───
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (designNoFilter) params.append('designNo', designNoFilter);
      if (sampleNoFilter) params.append('sampleNo', sampleNoFilter);
      if (shopFilter) params.append('shopId', shopFilter);
      if (minTotalFilter) params.append('minTotal', minTotalFilter);
      if (maxTotalFilter) params.append('maxTotal', maxTotalFilter);
      if (minRevenueFilter) params.append('minRevenue', minRevenueFilter);
      if (maxRevenueFilter) params.append('maxRevenue', maxRevenueFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);

      const res = await axios.get(`/api/orders?${params.toString()}`);
      if (res.data.success) setData(res.data.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignsAndShops = async () => {
    try {
      const [designsRes, shopsRes] = await Promise.all([
        axios.get('/api/orders/designs'),
        axios.get('/api/shops')
      ]);
      if (designsRes.data.success) setAvailableDesigns(designsRes.data.data);
      if (shopsRes.data.success) setAllShops(shopsRes.data.data);
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    fetchDesignsAndShops();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [
    statusFilter, designNoFilter, sampleNoFilter, shopFilter,
    minTotalFilter, maxTotalFilter,
    minRevenueFilter, maxRevenueFilter,
    startDateFilter, endDateFilter,
  ]);

  // ─── Delete Handler ───
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/orders/${deleteConfirm.id}`);
      showToast('success', `Order for design ${deleteConfirm.designNo} deleted`);
      fetchRecords();
    } catch {
      showToast('error', 'Failed to delete order');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ open: false, id: '', designNo: '' });
    }
  };

  // ─── Table Columns ───
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

    // 1b. Sample No
    columnHelper.accessor('sampleNo', {
      header: () => (
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Sample No
        </span>
      ),
      cell: info => {
        const val = info.getValue();
        return val
          ? <span className="font-semibold text-slate-700 text-sm">{val}</span>
          : <span className="text-slate-300">—</span>;
      },
    }),

    // 2. Description
    columnHelper.accessor('description', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</span>,
      cell: info => <span className="font-semibold text-slate-900 text-sm max-w-[160px] truncate block">{info.getValue()}</span>,
    }),

    // 3. Shop Allocations (Dynamic)
    columnHelper.accessor('shopAllocations', {
      header: () => (
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Store className="h-3 w-3" /> Allocations
        </span>
      ),
      cell: info => {
        const allocations = info.getValue() || [];
        const activeAllocs = allocations.filter((a: any) => a.qty > 0);
        if (activeAllocs.length === 0) return <span className="text-slate-300">—</span>;

        return (
          <div className="flex flex-wrap gap-1.5 min-w-[150px]">
            {activeAllocs.map((a: any, index: number) => {
              const shopColor = a.shopId?.color || 'slate';
              const shopName = a.shopName || a.shopId?.name || `Shop`;
              return (
                <span 
                  key={a.shopId?._id || a.shopId || index} 
                  className={clsx(
                    `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-sm`,
                    `bg-${shopColor}-50 text-${shopColor}-700 border-${shopColor}-200`
                  )}
                  title={`${shopName}: ${a.qty} units`}
                >
                  {shopName.split(' ')[0]}: <span className="ml-1 font-mono">{a.qty}</span>
                </span>
              );
            })}
          </div>
        );
      },
    }),

    // 4. Design Total (sortable, highlighted)
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

    // 5. Projected Revenue
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

    // 6. Status Badge
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

    // 7. Actions
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
  ], [router]);

  // ─── Table Configuration ───
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

  return (
    <div className="px-6 py-5 animate-fade-in">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h1>
        <Link href="/admin/orders/add">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
        </Link>
      </div>

      {/* Stats Strip */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-fade-in-up">
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

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Primary Filter Bar */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-100 bg-slate-50/60">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-5 py-3 text-left">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="border-2 border-slate-200 border-t-green-500 rounded-full w-8 h-8 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-10 w-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">No records found</p>
                      {(globalFilter || activeFilterCount > 0) && (
                        <button
                          onClick={() => { setGlobalFilter(''); resetAllFilters(); }}
                          className="text-sm text-green-600 hover:text-green-700 font-semibold"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
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
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-5 py-3 whitespace-nowrap text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getRowModel().rows.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing {table.getPaginationRowModel().rows.length > 0
                ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} – ${Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}`
                : '0'} of {table.getFilteredRowModel().rows.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Drawer */}
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
            {/* Header */}
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Status Filter */}
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

              {/* Design Number Filter */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Design Number</label>
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

              {/* Sample Number Filter */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sample Number
                </label>
                <input
                  type="text"
                  value={sampleNoFilter}
                  onChange={(e) => setSampleNoFilter(e.target.value)}
                  placeholder="Enter sample number..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-3 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm"
                />
              </div>

              {/* Shop Filter */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Shop Allocation</label>
                <div className="relative">
                  <select
                    value={shopFilter}
                    onChange={(e) => setShopFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
                  >
                    <option value="">All Shops</option>
                    {allShops.map(shop => (
                      <option key={shop._id} value={shop._id}>
                        {shop.name}
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

              {/* Design Total Range */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Design Total Range</label>
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

              {/* Projected Revenue Range */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Projected Revenue (LKR)</label>
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

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Order Date Range</label>
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

            {/* Footer */}
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

      {/* Detail Modal */}
      {selectedRecord && (
        <OrderDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

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
    </div>
  );
}
