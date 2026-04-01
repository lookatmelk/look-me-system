"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import OrderForm, { DesignOption } from '@/components/orders/OrderForm';
import { showToast, Toaster } from '@/components/ui/Toaster';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AddOrderPage() {
  const router = useRouter();
  const [availableDesigns, setAvailableDesigns] = useState<DesignOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await axios.get('/api/orders/designs');
        if (res.data.success) setAvailableDesigns(res.data.data);
      } catch {
        // Silent — dropdown will just be empty
      }
    };
    fetchDesigns();
  }, []);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/orders', data);
      if (res.data.success) {
        showToast('success', 'Order created successfully!');
        setTimeout(() => router.push('/admin/orders'), 1000);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <Toaster />

      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">
        Add Order
      </h1>

      <OrderForm
        availableDesigns={availableDesigns}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
