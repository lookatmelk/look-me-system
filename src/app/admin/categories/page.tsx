"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel
} from '@tanstack/react-table';
import { Edit2, Trash2, Search, Plus, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryDrawer } from '@/components/categories/CategoryDrawer';
import { Toaster, showToast } from '@/components/ui/Toaster';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import Image from 'next/image';
import { useKeyboardTableNavigation } from '@/hooks/useKeyboardTableNavigation';

const columnHelper = createColumnHelper<any>();

export default function CategoriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) setData(res.data.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const confirmDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/api/categories/${itemToDelete.id}`);
      showToast('success', `Category "${itemToDelete.name}" has been deleted.`);
      fetchCategories();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to delete category.');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory._id}`, values);
        showToast('success', 'Category updated successfully.');
      } else {
        await axios.post('/api/categories', values);
        showToast('success', 'Category added successfully.');
      }
      setIsDrawerOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    columnHelper.accessor('imageUrl', {
      header: 'Image',
      cell: info => {
        const url = info.getValue();
        return url ? (
          <div className="relative h-10 w-10 rounded-lg overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
            <Image src={url} alt="Category" fill className="object-cover" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center border border-green-100 text-green-400 flex-shrink-0">
            <ImageIcon className="h-5 w-5" />
          </div>
        );
      },
      enableGlobalFilter: false,
    }),
    columnHelper.accessor('name', {
      header: 'Category Name',
      cell: info => <span className="font-semibold text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => {
        const desc = info.getValue();
        return desc
          ? <span className="text-gray-600 truncate max-w-xs inline-block">{desc}</span>
          : <span className="text-gray-400 italic">No description</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (props) => (
        <div className="flex space-x-3">
          <button
            onClick={() => { setEditingCategory(props.row.original); setIsDrawerOpen(true); }}
            className="text-gray-400 hover:text-[var(--color-primary)] focus:outline-none transition-colors"
            title="Edit category"
            id={`edit-category-${props.row.original._id}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => confirmDelete(props.row.original._id, props.row.original.name)}
            className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
            title="Delete category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
      setEditingCategory(row.original);
      setIsDrawerOpen(true);
    },
    onDeleteRow: (row) => {
      confirmDelete(row.original._id, row.original.name);
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster />
      <div className="sm:flex sm:items-center sm:justify-between bg-white p-6 rounded-xl shadow-sm border border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage purchasing categories like FABRIC, ACCESSORIES, MACHINE, etc.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button
            id="add-category-btn"
            onClick={() => { setEditingCategory(null); setIsDrawerOpen(true); }}
            className="flex items-center shadow-md shadow-green-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-[var(--color-border)] sm:rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-gray-50/50 flex sm:items-center">
          <div className="relative max-w-md flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="block w-full rounded-full border border-gray-200 py-2 pl-10 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white shadow-inner transition-all"
              placeholder="Search categories by name..."
            />
          </div>
        </div>

        <div className="px-4 py-2 border-b border-[var(--color-border)] bg-slate-50 text-xs text-slate-500">
          Use Arrow Up/Down to select a row, Enter to edit, Delete/Backspace to open delete confirmation.
        </div>

        <div
          ref={tableRef}
          id="categories-table-keyboard-region"
          tabIndex={0}
          onKeyDown={handleTableKeyDown}
          className="overflow-x-auto focus:outline-none"
          aria-label="Categories table keyboard region"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin mb-4" />
                    <p>Loading categories...</p>
                  </div>
                </td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-green-50 p-3 rounded-full mb-4 text-green-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No categories found</p>
                    <p className="mt-1">Create your first category to get started.</p>
                  </div>
                </td></tr>
              ) : (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    data-kb-row-index={rowIndex}
                    data-selected={selectedIndex === rowIndex}
                    aria-selected={selectedIndex === rowIndex}
                    onClick={() => setSelectedIndex(rowIndex)}
                    className={`transition-colors group cursor-pointer ${selectedIndex === rowIndex ? 'bg-green-100/60' : 'hover:bg-green-50/30'}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-gray-50/50 px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of{' '}
                <span className="font-medium text-gray-900">{table.getFilteredRowModel().rows.length}</span> results
              </p>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      <CategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingCategory}
        isLoading={submitting}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
