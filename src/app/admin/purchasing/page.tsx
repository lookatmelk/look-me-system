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
  Calendar, CreditCard, Tag, User, CheckCircle2, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toaster, showToast } from '@/components/ui/Toaster';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PurchasingFormModal } from '@/components/purchasing/PurchasingFormModal';
import clsx from 'clsx';
import { Kbd } from '@/components/ui/Kbd';
import { useKeyboardTableNavigation } from '@/hooks/useKeyboardTableNavigation';

const columnHelper = createColumnHelper<any>();

export default function PurchasingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; desc: string }>({
    open: false, id: '', desc: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = data.reduce((sum, r) => sum + (r.qty * r.rate || 0), 0);
    const pending = data.filter(r => r.status === 'PENDING').length;
    const completed = data.filter(r => r.status === 'DONE').length;
    return { total, pending, completed, count: data.length };
  }, [data]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (paymentModeFilter) count++;
    if (startDate || endDate) count++;
    return count;
  }, [statusFilter, paymentModeFilter, startDate, endDate]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (paymentModeFilter) params.append('paymentMode', paymentModeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await axios.get(`/api/purchasing?${params.toString()}`);
      if (res.data.success) setData(res.data.data);
    } catch {
      showToast('error', 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, paymentModeFilter, startDate, endDate]);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (selectedRecord) {
        await axios.put(`/api/purchasing/${selectedRecord._id}`, formData);
        showToast('success', 'Record updated successfully');
      } else {
        await axios.post('/api/purchasing', formData);
        showToast('success', 'Record created successfully');
      }
      setIsFormModalOpen(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/purchasing/${deleteConfirm.id}`);
      showToast('success', 'Record deleted');
      fetchRecords();
    } catch {
      showToast('error', 'Delete failed');
    } finally {
      setIsSubmitting(false);
      setDeleteConfirm({ open: false, id: '', desc: '' });
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('buyDate', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Date <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => <span className="font-semibold text-slate-900">{new Date(info.getValue()).toLocaleDateString()}</span>,
    }),
    columnHelper.accessor('supplierId.name', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier</span>,
      cell: info => <span className="font-bold text-slate-900">{info.getValue() || 'N/A'}</span>,
    }),
    columnHelper.accessor('categoryId.name', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</span>,
      cell: info => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
          <Tag className="w-3 h-3" /> {info.getValue() || 'Uncategorized'}
        </span>
      ),
    }),
    columnHelper.accessor('description', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</span>,
      cell: info => <span className="text-slate-600 max-w-[200px] truncate block">{info.getValue()}</span>,
    }),
    columnHelper.accessor('total', {
      id: 'total',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
          Amount <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      accessorFn: row => row.qty * row.rate,
      cell: info => (
        <span className="font-black text-green-700 font-mono">
          {info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: () => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</span>,
      cell: info => {
        const val = info.getValue();
        const styles = {
          DONE: 'bg-green-50 text-green-700 border-green-200',
          PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
          CANCELLED: 'bg-red-50 text-red-700 border-red-200',
          RETURNED: 'bg-slate-100 text-slate-600 border-slate-200',
        };
        const icons = {
          DONE: <CheckCircle2 className="w-3 h-3" />,
          PENDING: <Clock className="w-3 h-3" />,
          CANCELLED: <XCircle className="w-3 h-3" />,
          RETURNED: <AlertCircle className="w-3 h-3" />,
        };
        return (
          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider', styles[val as keyof typeof styles])}>
            {icons[val as keyof typeof icons]} {val}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (props) => (
        <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={() => { setSelectedRecord(props.row.original); setIsFormModalOpen(true); }}
            className="text-slate-400 hover:text-green-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 transition-all"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteConfirm({ open: true, id: props.row.original._id, desc: props.row.original.description })}
            className="text-slate-400 hover:text-red-600 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 transition-all"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    }),
  ], []);

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
    initialState: { pagination: { pageSize: 12 } },
  });

  const rows = table.getRowModel().rows;
  const {
    tableRef,
    selectedIndex,
    setSelectedIndex,
    handleTableKeyDown,
  } = useKeyboardTableNavigation({
    rows,
    onOpenRow: (row) => {
      setSelectedRecord(row.original);
      setIsFormModalOpen(true);
    },
    onDeleteRow: (row) => {
      setDeleteConfirm({ open: true, id: row.original._id, desc: row.original.description });
    },
  });

  return (
    <div className="px-6 py-5 animate-fade-in pb-20">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchasing</h1>
          <p className="text-sm text-slate-500 font-medium">Track your inventory buy-ins and supplier payments.</p>
        </div>
        <Button onClick={() => { setSelectedRecord(null); setIsFormModalOpen(true); }} className="gap-2 shadow-green-100">
          <Plus className="h-4 w-4" /> Add Record
        </Button>
      </div>

      {/* Stats */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-fade-in-up">
          <StatCard label="Total Spend" value={`LKR ${stats.total.toLocaleString()}`} icon={CreditCard} color="green" />
          <StatCard label="Total Records" value={stats.count} icon={Tag} color="slate" />
          <StatCard label="Pending Items" value={stats.pending} icon={Clock} color="amber" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="blue" />
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
              placeholder="Quick search records..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all relative',
                activeFilterCount > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-black shadow-sm border-2 border-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Kbd variant="default">↑</Kbd>
            <Kbd variant="default">↓</Kbd>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigate</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Kbd variant="default">Enter</Kbd>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Kbd variant="default">Del</Kbd>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delete</span>
          </div>
        </div>

        {/* The Table */}
        <div
          ref={tableRef}
          id="purchasing-table-keyboard-region"
          tabIndex={0}
          onKeyDown={handleTableKeyDown}
          className="overflow-x-auto focus:outline-none"
          aria-label="Purchasing table keyboard region"
        >
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="bg-slate-50/50">
                  {hg.headers.map(h => (
                    <th key={h.id} className="px-5 py-3 text-left">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="px-5 py-20 text-center"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-10 w-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">No records found</p>
                      {(globalFilter || activeFilterCount > 0) && (
                        <button
                          onClick={() => { setGlobalFilter(''); setStatusFilter(''); setPaymentModeFilter(''); setStartDate(''); setEndDate(''); }}
                          className="text-sm text-green-600 hover:text-green-700 font-semibold"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  onClick={() => { setSelectedIndex(idx); setSelectedRecord(row.original); setIsFormModalOpen(true); }}
                  className={clsx(
                    'group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer',
                    selectedIndex === idx && 'bg-green-50/50 ring-1 ring-inset ring-green-200'
                  )}
                >
                  {row.getVisibleCells().map(c => (
                    <td key={c.id} className="px-5 py-3.5 text-sm">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <span className="text-xs text-slate-500 font-medium italic">Showing records {table.getRowModel().rows.length} of {data.length}</span>
          <div className="flex gap-2">
            <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-white transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <PurchasingFormModal
          isOpen={isFormModalOpen}
          onClose={() => { setIsFormModalOpen(false); setSelectedRecord(null); }}
          onSubmit={handleSubmit}
          initialData={selectedRecord}
          isLoading={isSubmitting}
        />
      )}

      {/* Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-left">
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h2 className="font-black text-slate-900">Advanced Filters</h2>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all">
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Mode</label>
                <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all">
                  <option value="">All Modes</option>
                  <option value="CASH">CASH</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="CREDIT">CREDIT</option>
                  <option value="BANK TRANSFER">BANK TRANSFER</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Date Range</label>
                <div className="space-y-2">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm transition-all" />
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm transition-all" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setStatusFilter(''); setPaymentModeFilter(''); setStartDate(''); setEndDate(''); }}>Reset</Button>
              <Button className="flex-1" onClick={() => setIsFilterDrawerOpen(false)}>Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', desc: '' })}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the purchase for "${deleteConfirm.desc}"? This cannot be undone.`}
        confirmText="Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorStyles = {
    green: 'bg-green-50 text-green-700 border-green-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return (
    <div className={clsx('p-4 rounded-2xl border shadow-sm', colorStyles[color as keyof typeof colorStyles])}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
        <Icon className="w-4 h-4 opacity-40" />
      </div>
      <div className="text-xl font-black font-mono tracking-tight truncate">{value}</div>
    </div>
  );
}
