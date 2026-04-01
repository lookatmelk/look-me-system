'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, MapPin, User, Phone, ChevronLeft, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { showToast, Toaster } from '@/components/ui/Toaster';

export default function ShopDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');
  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    
    const fetchShopAndOrders = async () => {
      setIsLoading(true);
      try {
        // 1. Get shop by slug
        const shopsRes = await axios.get('/api/shops');
        const foundShop = shopsRes.data.data.find((s: any) => s.slug === slug);

        if (!foundShop) {
          notFound();
          return;
        }
        setShop(foundShop);

        // 2. Get orders for this shop
        const queryParams = new URLSearchParams();
        if (statusFilter) queryParams.append('status', statusFilter);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        const ordersRes = await axios.get(`/api/shops/${foundShop._id}/orders?${queryParams.toString()}`);
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.data.orders);
          setStats(ordersRes.data.data.stats);
        }
      } catch (err) {
        showToast('error', 'Failed to load shop details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopAndOrders();
  }, [slug, statusFilter, startDate, endDate]);

  if (isLoading && !shop) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-200 rounded-2xl mb-4" />
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
        </div>
      </div>
    );
  }

  if (!shop) return null; // Let next/navigation handle notFound()

  // Safely get colors ensuring Tailwind picks them up
  const colorStr = shop.color || 'blue';
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <Toaster />
      
      {/* Back Link */}
      <Link
        href="/admin/shops"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Shops
      </Link>

      {/* Header Profile */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        {/* Background gradient hint */}
        <div className={clsx(`absolute top-0 right-0 w-64 h-64 bg-${colorStr}-500 opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`)} />
        
        <div className={clsx(
          `h-24 w-24 md:h-28 md:w-28 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner bg-${colorStr}-100 text-${colorStr}-600`
        )}>
          <Store className="h-12 w-12" />
        </div>
        
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{shop.name}</h1>
            <span className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider',
              shop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            )}>
              <span className={clsx(
                'h-2 w-2 rounded-full',
                shop.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400 animate-pulse'
              )} />
              {shop.status}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
            {shop.location && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                {shop.location}
              </div>
            )}
            {shop.manager && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                {shop.manager}
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 font-mono">
                <Phone className="h-4 w-4 text-slate-400" />
                {shop.phone}
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden classes for tailwind JIT */}
        <div className="hidden bg-blue-100 bg-blue-500 text-blue-600 bg-violet-100 bg-emerald-100 bg-amber-100 bg-rose-100 bg-cyan-100 text-violet-600 text-emerald-600" />
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Orders" value={stats.totalOrders} icon={FileText} color="slate" />
          <StatCard label="Allocated Units" value={stats.totalQty.toLocaleString()} icon={Store} color={colorStr} />
          <StatCard label="Shop Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString()}`} icon={CheckCircle2} color="green" />
          <StatCard label="Shop Profit" value={`Rs. ${stats.totalProfit.toLocaleString()}`} icon={CheckCircle2} color="emerald" />
        </div>
      )}

      {/* Filters & Table */}
      <div className="bg-white border text-center border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Controls */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex-1 w-full flex text-left">Recent Allocations</h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="DELIVERED">Delivered</option>
            </select>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl">
              <Calendar className="h-4 w-4 text-slate-400 ml-2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 px-2 text-sm bg-transparent outline-none font-medium text-slate-600"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 px-2 text-sm bg-transparent outline-none font-medium text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Design No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Order Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Shop Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Est. Revenue</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-slate-50/30">
                    No orders allocated to this shop matching the criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const alloc = order.shopAllocations.find((a: any) => a.shopId.toString() === shop._id.toString());
                  if (!alloc) return null; // Should not happen given API, but type safety
                  
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/admin/orders`} className="font-bold text-slate-900 hover:text-green-600 font-mono">
                          {order.designNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{order.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={clsx(`text-sm font-black text-${colorStr}-600 bg-${colorStr}-50 px-2 py-0.5 rounded-md`)}>
                            {alloc.qty.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold max-w-[120px] truncate">
                            {alloc.sizes.join(', ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="font-mono text-sm font-medium text-slate-700">
                           Rs. {(alloc.qty * order.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Stat Card ───
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={clsx(`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-${color}-50 text-${color}-600`)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{label}</h4>
        <p className={clsx(`text-xl font-black text-${color}-950`)}>{value}</p>
      </div>
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    IN_PRODUCTION: 'bg-blue-100 text-blue-700',
    DISPATCHED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={clsx('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md inline-block whitespace-nowrap', map[status] || 'bg-slate-100 text-slate-700')}>
      {status.replace('_', ' ')}
    </span>
  );
}
