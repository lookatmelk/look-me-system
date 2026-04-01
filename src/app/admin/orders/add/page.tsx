"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import OrderForm, { DesignOption } from '@/components/orders/OrderForm';
import { showToast } from '@/components/ui/Toaster';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function AddOrderPage() {
  const router = useRouter();
  const [availableDesigns, setAvailableDesigns] = useState<DesignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await axios.get('/api/orders/designs');
        if (res.data.success) setAvailableDesigns(res.data.data);
      } catch {
        // Silent — dropdown will just be empty
      } finally {
        setLoading(false);
      }
    };
    fetchDesigns();
  }, []);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const res = await axios.post('/api/orders', data);
      if (res.data.success) {
        showToast('success', 'Order created successfully!');
        router.push('/admin/orders');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create order.';
      setServerError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Link href="/admin/orders" className="text-slate-400 hover:text-green-600 transition-colors p-2 hover:bg-slate-50 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add Order</h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">Create a new order linked to your costing records.</p>
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <OrderForm
          availableDesigns={availableDesigns}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/orders')}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
