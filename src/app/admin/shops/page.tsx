'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Store, MapPin, User, Phone, Edit2, Eye, Plus, Search, Filter } from 'lucide-react';
import clsx from 'clsx';
import { showToast, Toaster } from '@/components/ui/Toaster';
import ShopDrawer from '@/components/shops/ShopDrawer';

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`/api/shops?${params.toString()}`);
      if (res.data.success) {
        setShops(res.data.data);
      }
    } catch {
      showToast('error', 'Failed to fetch shops');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [search, statusFilter]);

  const handleEdit = (shop: any) => {
    setSelectedShop(shop);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setSelectedShop(null);
    setDrawerOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <Toaster />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Store className="h-8 w-8 text-green-600" />
            Shop Management
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Manage your retail locations and view their allocations.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" /> Add Shop
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, location or manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 font-medium"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 pl-10 pr-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[240px] bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center col-span-full">
          <Store className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No shops found</h3>
          <p className="mb-6">Try adjusting your search or add a new shop.</p>
          <button
            onClick={handleAdd}
            className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            Add New Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {shops.map((shop) => (
            <ShopCard key={shop._id} shop={shop} onEdit={handleEdit} />
          ))}
          
          {/* Add Shop Placeholder Card */}
          <button
            onClick={handleAdd}
            className="rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50/30 transition-all min-h-[220px] cursor-pointer group h-full"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:border-green-400 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-semibold text-sm group-hover:text-green-700 transition-colors">Add New Shop</span>
          </button>
        </div>
      )}

      {/* Drawer */}
      <ShopDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        shop={selectedShop}
        onSave={fetchShops}
      />
    </div>
  );
}

// ─── Shop Card Component ───
function ShopCard({ shop, onEdit }: { shop: any; onEdit: (shop: any) => void }) {
  const colorStr = shop.color || 'blue';

  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full',
      shop.status === 'INACTIVE' && 'opacity-[0.65] grayscale-[0.2]'
    )}>
      {/* Color Top Strip */}
      <div 
        className={clsx('h-2.5 w-full')} 
        style={{ backgroundColor: `var(--color-${colorStr}-500, #3b82f6)` }} // fallback using inline style or specific tailwind classes via map
      />
      {/* Fallback pattern since dynamic tailwind variables might be purged */}
      <div className={clsx(
        'hidden',
        'bg-blue-500 bg-violet-500 bg-emerald-500 bg-amber-500 bg-rose-500 bg-cyan-500 bg-indigo-500 bg-teal-500 bg-orange-500 bg-pink-500 bg-lime-500 bg-sky-500',
        'text-blue-700 text-violet-700 text-emerald-700 text-amber-700 text-rose-700 text-cyan-700 text-indigo-700 text-teal-700 text-orange-700 text-pink-700 text-lime-700 text-sky-700',
        'bg-blue-100 bg-violet-100 bg-emerald-100 bg-amber-100 bg-rose-100 bg-cyan-100 bg-indigo-100 bg-teal-100 bg-orange-100 bg-pink-100 bg-lime-100 bg-sky-100'
      )} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Title + Status */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex gap-3">
            <div className={clsx(
              `h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-${colorStr}-100 text-${colorStr}-700`
            )}>
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-black text-slate-900 leading-snug">{shop.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                  shop.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                )}>
                  <span className={clsx(
                    'h-1.5 w-1.5 rounded-full',
                    shop.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400'
                  )} />
                  {shop.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-2.5 mb-6 flex-1">
          {shop.location && (
            <div className="flex items-start gap-2.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="leading-snug line-clamp-2" title={shop.location}>{shop.location}</span>
            </div>
          )}
          {shop.manager && (
            <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{shop.manager}</span>
            </div>
          )}
          {shop.phone && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600 font-mono">
              <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>{shop.phone}</span>
            </div>
          )}
          {!shop.location && !shop.manager && !shop.phone && (
            <div className="h-full min-h-[4rem] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-xs text-slate-400 italic">No contact details</p>
            </div>
          )}
        </div>

        {/* Actions Bottom */}
        <div className="flex gap-2.5 pt-4 border-t border-slate-100 mt-auto">
          <button
            onClick={() => onEdit(shop)}
            className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <Link
            href={`/admin/shops/${shop.slug}`}
            className="flex-[1.5] h-9 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm bg-slate-800 hover:bg-slate-900"
          >
            <Eye className="h-3.5 w-3.5 text-slate-300" /> View Orders
          </Link>
        </div>
      </div>
    {/* Dynamic classes are added on lines: `bg-${colorStr}-500`, but they are defined statically in a hidden div so tailwind JIT catches them. */}
    {/* To be extremely safe with Tailwind JIT, we do: */}
    <div className={`h-2.5 w-full bg-${colorStr}-500 absolute top-0 left-0`} />
    </div>
  );
}
