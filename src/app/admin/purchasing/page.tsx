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
  SortingState
} from '@tanstack/react-table';
import { Edit2, Trash2, Search, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toaster, showToast } from '@/components/ui/Toaster';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const columnHelper = createColumnHelper<any>();

function PurchasingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      showToast('success', 'Purchase record saved successfully.');
      router.replace('/admin/purchasing');
    }
  }, [searchParams, router]);

  useEffect(() => {
    Promise.all([axios.get('/api/suppliers'), axios.get('/api/categories')]).then(([s, c]) => {
      setSuppliers(s.data.data || []);
      setCategories(c.data.data || []);
    }).catch(() => {});
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (supplierFilter) params.append('supplierId', supplierFilter);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      const res = await axios.get(`/api/purchasing?${params.toString()}`);
      if (res.data.success) setData(res.data.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [statusFilter, supplierFilter, categoryFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete purchase record for "${name}"?`)) return;
    try {
      await axios.delete(`/api/purchasing/${id}`);
      showToast('success', 'Purchase record deleted.');
      fetchRecords();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to delete record.');
    }
  };

  // Computed stats
  const totalAmount = useMemo(() => data.reduce((s, r) => s + (r.amount || 0), 0), [data]);
  const pendingCount = useMemo(() => data.filter(r => r.status === 'PENDING').length, [data]);
  const doneCount = useMemo(() => data.filter(r => r.status === 'DONE').length, [data]);

  const columns = useMemo(() => [
    columnHelper.accessor('buyDate', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Buy Date <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <div className="font-semibold text-slate-800 text-xs">{format(new Date(info.getValue()), 'dd-MMM-yy')}</div>,
      sortingFn: 'datetime',
    }),
    columnHelper.accessor(row => row.supplierId?.name || 'Unknown', {
      id: 'supplier',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Supplier <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</span>,
      cell: info => <span className="text-slate-600 text-sm max-w-[180px] truncate block">{info.getValue()}</span>,
    }),
    columnHelper.accessor(row => row.categoryId?.name || 'Unknown', {
      id: 'category',
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</span>,
      cell: info => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('units', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Units</span>,
      cell: info => <span className="text-slate-500 text-xs font-mono bg-slate-50 px-1.5 py-0.5 rounded">{info.getValue()}</span>,
    }),
    columnHelper.accessor('qty', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty</span>,
      cell: info => <span className="font-mono text-slate-800 text-sm">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor('rate', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rate</span>,
      cell: info => <span className="font-mono text-slate-800 text-sm">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Amount <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-mono font-bold text-slate-900 text-sm">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('paymentMode', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment</span>,
      cell: info => <span className="text-slate-500 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</span>,
      cell: info => {
        const s = info.getValue();
        return (
          <span className={clsx(
            'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide',
            s === 'DONE'      && 'bg-green-50 text-green-700 border border-green-200',
            s === 'PENDING'   && 'bg-amber-50 text-amber-700 border border-amber-200',
            s === 'CANCELLED' && 'bg-slate-100 text-slate-500 border border-slate-200',
            s === 'RETURNED'  && 'bg-red-50 text-red-700 border border-red-200',
          )}>
            {s}
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
            onClick={() => router.push(`/admin/purchasing/${props.row.original._id}/edit`)}
            className="text-slate-400 hover:text-green-600 focus:outline-none bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(props.row.original._id, props.row.original.description)}
            className="text-slate-400 hover:text-red-600 focus:outline-none bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-red-300 hover:shadow-md transition-all"
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

  return (
    <div className="space-y-5 animate-fade-in">
      <Toaster />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchasing</h1>
          <p className="text-sm text-slate-500 mt-0.5">All purchase records linked to suppliers and categories.</p>
        </div>
        <Button
          id="add-purchase-btn"
          onClick={() => router.push('/admin/purchasing/add')}
          className="h-10 px-5 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Purchase
        </Button>
      </div>

      {/* Stats Strip */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
          {[
            { label: "Total Records", value: data.length, color: "text-slate-900", bg: "bg-white" },
            { label: "Total Amount", value: `LKR ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, color: "text-violet-700", bg: "bg-violet-50" },
            { label: "Pending", value: pendingCount, color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Done", value: doneCount, color: "text-green-700", bg: "bg-green-50" },
          ].map(stat => (
            <div key={stat.label} className={clsx("rounded-xl px-4 py-3 border border-slate-100 shadow-sm", stat.bg)}>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
              <p className="text-lg font-black truncate" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all"
              placeholder="Search description..."
            />
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            {[
              { value: statusFilter, onChange: setStatusFilter, options: [['', 'All Status'], ['PENDING', 'Pending'], ['DONE', 'Done'], ['CANCELLED', 'Cancelled'], ['RETURNED', 'Returned']] },
              { value: supplierFilter, onChange: setSupplierFilter, options: [['', 'All Suppliers'], ...suppliers.map(s => [s._id, s.name] as [string, string])] },
              { value: categoryFilter, onChange: setCategoryFilter, options: [['', 'All Categories'], ...categories.map(c => [c._id, c.name] as [string, string])] },
            ].map((sel, i) => (
              <div key={i} className="flex items-center border border-slate-200 bg-white rounded-lg px-2 shadow-sm hover:border-slate-300 transition-colors">
                <select value={sel.value} onChange={e => sel.onChange(e.target.value)} className="py-1.5 pl-1 pr-6 border-0 bg-transparent text-slate-700 focus:ring-0 text-xs font-medium max-w-[130px]">
                  {sel.options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            ))}
            {(statusFilter || supplierFilter || categoryFilter) && (
              <button onClick={() => { setStatusFilter(''); setSupplierFilter(''); setCategoryFilter(''); }} className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[380px]">
          <table className="min-w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-100 bg-slate-50/60">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-5 py-3 text-left whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Loading purchase records...</p>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-base font-bold text-slate-700">No records found</p>
                      <p className="text-sm text-slate-400">Try adjusting filters or add a new purchase record.</p>
                      {(statusFilter || supplierFilter || categoryFilter || globalFilter) && (
                        <Button variant="outline" size="sm" className="mt-1" onClick={() => { setStatusFilter(''); setSupplierFilter(''); setCategoryFilter(''); setGlobalFilter(''); }}>
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => {
                  const status = row.original.status;
                  return (
                    <tr
                      key={row.id}
                      className={clsx(
                        'group border-b border-slate-50 last:border-0 transition-colors',
                        status === 'DONE'    && 'hover:bg-green-50/40',
                        status === 'PENDING' && 'hover:bg-amber-50/40',
                        status !== 'DONE' && status !== 'PENDING' && 'hover:bg-slate-50/60',
                      )}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-5 py-3 whitespace-nowrap text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              –{' '}
              <span className="font-semibold text-slate-700">
                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">{table.getFilteredRowModel().rows.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PurchasingPage() {
  return (
    <Suspense>
      <PurchasingPageContent />
    </Suspense>
  );
}
