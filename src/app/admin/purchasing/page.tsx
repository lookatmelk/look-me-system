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

  const columns = useMemo(() => [
    columnHelper.accessor('buyDate', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase hover:text-gray-700 transition-colors">
          Buy Date <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <div className="font-medium text-gray-900">{format(new Date(info.getValue()), 'dd-MMM-yy')}</div>,
      sortingFn: 'datetime',
    }),
    columnHelper.accessor(row => row.supplierId?.name || 'Unknown', {
      id: 'supplier',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase hover:text-gray-700 transition-colors">
          Supplier <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-semibold text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => <span className="text-gray-700 max-w-[180px] truncate block">{info.getValue()}</span>,
    }),
    columnHelper.accessor(row => row.categoryId?.name || 'Unknown', {
      id: 'category',
      header: 'Category',
      cell: info => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{info.getValue()}</span>,
    }),
    columnHelper.accessor('units', {
      header: 'Units',
      cell: info => <span className="text-gray-500 text-xs font-mono">{info.getValue()}</span>,
    }),
    columnHelper.accessor('qty', {
      header: 'Qty',
      cell: info => <span className="font-mono text-gray-900">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor('rate', {
      header: 'Rate',
      cell: info => <span className="font-mono text-gray-900">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase hover:text-gray-700 transition-colors">
          Amount <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-mono font-bold text-gray-900">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('paymentMode', {
      header: 'Payment',
      cell: info => <span className="text-gray-500 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const s = info.getValue();
        return (
          <span className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold tracking-wide',
            s === 'DONE' && 'bg-[var(--color-success)] text-[var(--color-success-text)]',
            s === 'PENDING' && 'bg-[var(--color-pending)] text-[var(--color-pending-text)]',
            s === 'CANCELLED' && 'bg-[var(--color-cancelled-bg)] text-[var(--color-cancelled-text)]',
            s === 'RETURNED' && 'bg-[var(--color-returned-bg)] text-[var(--color-returned-text)]',
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
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={() => router.push(`/admin/purchasing/${props.row.original._id}/edit`)}
            className="text-gray-400 hover:text-[var(--color-primary)] focus:outline-none bg-white p-1 rounded-md shadow-sm border border-[var(--color-border)] transition-colors"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(props.row.original._id, props.row.original.description)}
            className="text-gray-400 hover:text-red-600 focus:outline-none bg-white p-1 rounded-md shadow-sm border border-[var(--color-border)] transition-colors"
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster />
      <div className="sm:flex sm:items-center sm:justify-between bg-white p-6 rounded-xl shadow-sm border border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Purchasing</h1>
          <p className="mt-1 text-sm text-gray-500">All purchase records, linked to suppliers and categories.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button
            id="add-purchase-btn"
            onClick={() => router.push('/admin/purchasing/add')}
            className="flex items-center shadow-md shadow-green-100 h-10 px-5"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-[var(--color-border)] sm:rounded-xl overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-[var(--color-border)] bg-gray-50/50 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="block w-full rounded-full border border-gray-200 py-2 pl-10 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white shadow-inner transition-all"
              placeholder="Search by description..."
            />
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {[
              { value: statusFilter, onChange: setStatusFilter, options: [['', 'All Statuses'], ['PENDING', 'Pending'], ['DONE', 'Done'], ['CANCELLED', 'Cancelled'], ['RETURNED', 'Returned']] },
              { value: supplierFilter, onChange: setSupplierFilter, options: [['', 'All Suppliers'], ...suppliers.map(s => [s._id, s.name] as [string, string])] },
              { value: categoryFilter, onChange: setCategoryFilter, options: [['', 'All Categories'], ...categories.map(c => [c._id, c.name] as [string, string])] },
            ].map((sel, i) => (
              <div key={i} className="flex items-center border border-gray-200 bg-white rounded-lg px-2 shadow-sm">
                <select value={sel.value} onChange={e => sel.onChange(e.target.value)} className="py-1.5 pl-1 pr-6 border-0 bg-transparent text-gray-700 focus:ring-0 text-xs font-medium max-w-[130px]">
                  {sel.options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            ))}
            {(statusFilter || supplierFilter || categoryFilter) && (
              <button onClick={() => { setStatusFilter(''); setSupplierFilter(''); setCategoryFilter(''); }} className="text-xs text-[var(--color-primary)] hover:underline">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-200 border-collapse">
            <thead className="bg-[#f8fafc] border-b border-[var(--color-border)]">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-5 py-3 text-left whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin mb-4" />
                    <p>Loading purchase records...</p>
                  </div>
                </td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-green-50 p-4 rounded-full mb-4 text-green-400">
                      <Search className="h-8 w-8" />
                    </div>
                    <p className="text-xl font-medium text-gray-900">No records found</p>
                    <p className="mt-1 max-w-sm text-center">Try adjusting filters or add a new purchase record.</p>
                    {(statusFilter || supplierFilter || categoryFilter || globalFilter) && (
                      <Button variant="outline" className="mt-4" onClick={() => { setStatusFilter(''); setSupplierFilter(''); setCategoryFilter(''); setGlobalFilter(''); }}>
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </td></tr>
              ) : (
                table.getRowModel().rows.map(row => {
                  const status = row.original.status;
                  return (
                    <tr key={row.id} className={clsx(
                      'group transition-colors relative',
                      status === 'DONE' && 'bg-green-50/30 hover:bg-green-50/60',
                      status === 'PENDING' && 'bg-amber-50/30 hover:bg-amber-50/60',
                      status !== 'DONE' && status !== 'PENDING' && 'hover:bg-gray-50',
                    )}>
                      {status === 'DONE' && <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-success-text)]" />}
                      {status === 'PENDING' && <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-pending-text)]" />}
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
          <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[#f8fafc] px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of{' '}
                <span className="font-medium text-gray-900">{table.getFilteredRowModel().rows.length}</span>
              </p>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-white disabled:opacity-50 transition-colors bg-gray-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-white disabled:opacity-50 transition-colors bg-gray-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
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
