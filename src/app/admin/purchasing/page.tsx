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
import { Edit2, Trash2, Search, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Package, User, Tag, Ruler, Hash, DollarSign, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toaster, showToast } from '@/components/ui/Toaster';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ─── Purchase Detail Modal ────────────────────────────────────────────────────
function PurchaseDetailModal({ record, onClose }: { record: any; onClose: () => void }) {
  if (!record) return null;

  const statusColors: Record<string, string> = {
    DONE:      'bg-green-50 text-green-700 border-green-200',
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
    RETURNED:  'bg-red-50 text-red-700 border-red-200',
  };

  const paymentModeColors: Record<string, string> = {
    CASH:          'bg-emerald-50 text-emerald-700 border-emerald-200',
    CHEQUE:        'bg-blue-50 text-blue-700 border-blue-200',
    CREDIT:        'bg-purple-50 text-purple-700 border-purple-200',
    'BANK TRANSFER': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CARD:          'bg-sky-50 text-sky-700 border-sky-200',
    OTHER:         'bg-slate-50 text-slate-600 border-slate-200',
  };

  const safeDate = (v: any) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : format(d, 'dd MMM yyyy');
  };

  const fields: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    {
      icon: <User className="h-4 w-4" />,
      label: 'Supplier',
      value: <span className="font-semibold text-slate-900">{record.supplierId?.name || '—'}</span>,
    },
    {
      icon: <Tag className="h-4 w-4" />,
      label: 'Category',
      value: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {record.categoryId?.name || '—'}
        </span>
      ),
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: 'Description',
      value: <span className="font-semibold text-slate-900">{record.description || '—'}</span>,
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Units',
      value: <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-700">{record.units || '—'}</span>,
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: 'Quantity',
      value: <span className="font-semibold text-slate-900">{record.qty?.toLocaleString() ?? '—'}</span>,
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Rate',
      value: <span className="font-semibold text-slate-900">{record.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '—'}</span>,
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Buy Date',
      value: <span className="font-semibold text-slate-900">{safeDate(record.buyDate) ?? '—'}</span>,
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Payment Date',
      value: <span className="font-semibold text-slate-900">{safeDate(record.paymentDate) ?? '—'}</span>,
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: 'Payment Mode',
      value: (
        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border', paymentModeColors[record.paymentMode] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
          {record.paymentMode || '—'}
        </span>
      ),
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: 'Cheque Number',
      value: <span className="font-semibold text-slate-900">{record.paymentMode === 'CHEQUE' ? (record.chequeNumber || '—') : '—'}</span>,
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Status',
      value: (
        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border', statusColors[record.status] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
          {record.status || '—'}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={record.description || 'Purchase Record'}
      subtitle={`Supplier: ${record.supplierId?.name || 'Unknown'}`}
      size="lg"
    >
      {/* Amount hero */}
      <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
        <p className="text-4xl font-black text-slate-900 tracking-tight">
          LKR {record.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {record.qty?.toLocaleString()} {record.units} × LKR {record.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Field grid */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {fields.map(({ icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="text-slate-300">{icon}</span>
              {label}
            </div>
            <div className="text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* Notes (if present) */}
      {record.notes && (
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

const columnHelper = createColumnHelper<any>();
const PAYMENT_MODE_OPTIONS = ['CASH', 'CHEQUE', 'CREDIT', 'BANK TRANSFER', 'CARD', 'OTHER'] as const;

function PurchasingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateTypeFilter, setDateTypeFilter] = useState<'buyDate' | 'paymentDate'>('paymentDate');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [paymentModeFilters, setPaymentModeFilters] = useState<string[]>([...PAYMENT_MODE_OPTIONS]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  // Count of active secondary filters (drives the badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (supplierFilter) count++;
    if (categoryFilter) count++;
    if (paymentModeFilters.length < PAYMENT_MODE_OPTIONS.length) count++;
    return count;
  }, [statusFilter, supplierFilter, categoryFilter, paymentModeFilters]);

  const togglePaymentMode = (mode: string) => {
    setPaymentModeFilters(prev => {
      if (prev.includes(mode)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== mode);
      }
      return [...prev, mode];
    });
  };

  const resetAllFilters = () => {
    setStatusFilter('');
    setSupplierFilter('');
    setCategoryFilter('');
    setDateTypeFilter('paymentDate');
    setStartDateFilter('');
    setEndDateFilter('');
    setPaymentModeFilters([...PAYMENT_MODE_OPTIONS]);
  };

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
      if (paymentModeFilters.length > 0 && paymentModeFilters.length < PAYMENT_MODE_OPTIONS.length) {
        params.append('paymentModes', paymentModeFilters.join(','));
      }
      if (dateTypeFilter) params.append('dateType', dateTypeFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      const res = await axios.get(`/api/purchasing?${params.toString()}`);
      if (res.data.success) setData(res.data.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, supplierFilter, categoryFilter, paymentModeFilters, dateTypeFilter, startDateFilter, endDateFilter]);

  const confirmDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/api/purchasing/${itemToDelete.id}`);
      showToast('success', 'Purchase record deleted.');
      fetchRecords();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to delete record.');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

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
      cell: info => <div className="font-semibold text-slate-900 text-sm">{format(new Date(info.getValue()), 'dd-MMM-yy')}</div>,
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
      cell: info => <span className="font-semibold text-slate-900 text-sm max-w-[180px] truncate block">{info.getValue()}</span>,
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
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor('rate', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rate</span>,
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Amount <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    }),
    columnHelper.accessor('paymentMode', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment</span>,
      cell: info => <span className="font-semibold text-slate-900 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('paymentDate', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Date</span>,
      cell: info => {
        const value = info.getValue();
        if (!value) return <span className="text-slate-400 text-sm">-</span>;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return <span className="text-slate-400 text-sm">-</span>;
        return <span className="font-semibold text-slate-900 text-sm">{format(parsed, 'dd-MMM-yy')}</span>;
      },
      sortingFn: 'datetime',
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
            onClick={(e) => { e.stopPropagation(); setSelectedRecord(props.row.original); }}
            className="text-slate-400 hover:text-blue-600 focus:outline-none bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/admin/purchasing/${props.row.original._id}/edit`); }}
            className="text-slate-400 hover:text-green-600 focus:outline-none bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); confirmDelete(props.row.original._id, props.row.original.description); }}
            className="text-slate-400 hover:text-red-600 focus:outline-none bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-red-300 hover:shadow-md transition-all"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    }),
  ], [router, setSelectedRecord]);

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

      {/* Purchase Detail Modal */}
      {selectedRecord && (
        <PurchaseDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

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
            { label: 'Total Records', value: data.length, color: 'text-slate-900', bg: 'bg-white' },
            { label: 'Total Amount', value: `LKR ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Pending', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Done', value: doneCount, color: 'text-green-700', bg: 'bg-green-50' },
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
              onChange={e => setGlobalFilter(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all"
              placeholder="Search description..."
            />
          </div>

          {/* Unified Date Group */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm divide-x divide-slate-200 text-xs">
            <select
              value={dateTypeFilter}
              onChange={e => setDateTypeFilter(e.target.value as 'buyDate' | 'paymentDate')}
              className="h-9 pl-3 pr-7 bg-transparent text-slate-600 font-medium focus:ring-0 border-0 text-xs cursor-pointer"
              aria-label="Date type"
            >
              <option value="paymentDate">Payment Date</option>
              <option value="buyDate">Buy Date</option>
            </select>
            <input
              type="date"
              value={startDateFilter}
              onChange={e => setStartDateFilter(e.target.value)}
              className="h-9 px-2 bg-transparent text-slate-700 focus:ring-0 border-0 text-xs"
              aria-label="Start date"
            />
            <span className="px-2 h-9 flex items-center text-slate-400 font-medium select-none">to</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={e => setEndDateFilter(e.target.value)}
              className="h-9 px-2 bg-transparent text-slate-700 focus:ring-0 border-0 text-xs"
              aria-label="End date"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                className="h-9 px-2.5 text-slate-400 hover:text-red-500 transition-colors text-[11px] font-bold"
                aria-label="Clear dates"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters button with active-filter badge */}
          <button
            id="open-filters-btn"
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

          {/* Quick clear all */}
          {(globalFilter || activeFilterCount > 0 || startDateFilter || endDateFilter) && (
            <button
              onClick={() => { setGlobalFilter(''); resetAllFilters(); }}
              className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* ── ADVANCED FILTERS DRAWER ── */}
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
                  <p className="text-xs text-slate-400 mt-0.5">Refine purchase records</p>
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

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status</label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="DONE">Done</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="RETURNED">Returned</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Supplier</label>
                  <div className="relative">
                    <select
                      value={supplierFilter}
                      onChange={e => setSupplierFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Payment Methods – multi-select checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Methods</label>
                    <button
                      type="button"
                      onClick={() =>
                        paymentModeFilters.length === PAYMENT_MODE_OPTIONS.length
                          ? setPaymentModeFilters([])
                          : setPaymentModeFilters([...PAYMENT_MODE_OPTIONS])
                      }
                      className="text-[11px] font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      {paymentModeFilters.length === PAYMENT_MODE_OPTIONS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100 overflow-hidden">
                    {PAYMENT_MODE_OPTIONS.map(mode => {
                      const checked = paymentModeFilters.includes(mode);
                      return (
                        <label
                          key={mode}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePaymentMode(mode)}
                            className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className={clsx(
                            'flex-1 text-sm font-medium transition-colors select-none',
                            checked ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'
                          )}>
                            {mode}
                          </span>
                          {checked && (
                            <svg className="h-3.5 w-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer footer */}
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
                  <td colSpan={12} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Loading purchase records...</p>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-base font-bold text-slate-700">No records found</p>
                      <p className="text-sm text-slate-400">Try adjusting filters or add a new purchase record.</p>
                      {(statusFilter || supplierFilter || categoryFilter || globalFilter || startDateFilter || endDateFilter || paymentModeFilters.length < PAYMENT_MODE_OPTIONS.length) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          onClick={() => { setGlobalFilter(''); resetAllFilters(); }}
                        >
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
                      onClick={() => setSelectedRecord(row.original)}
                      className={clsx(
                        'group border-b border-slate-50 last:border-0 transition-colors cursor-pointer',
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
              </span>
              {' '}–{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>
              {' '}of{' '}
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

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Delete Purchase Record"
        message={`Are you sure you want to delete the purchase record for "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
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
