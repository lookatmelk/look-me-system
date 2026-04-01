"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import OrderForm, { DesignOption } from '@/components/orders/OrderForm';
import { showToast, Toaster } from '@/components/ui/Toaster';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [availableDesigns, setAvailableDesigns] = useState<DesignOption[]>([]);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await axios.get('/api/orders/designs');
        if (res.data.success) setAvailableDesigns(res.data.data);
      } catch {
        // Silent
      }
    };
    fetchDesigns();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/orders/${id}`);
        if (res.data.success) {
          setOrderData(res.data.data);
        }
      } catch (err: any) {
        showToast('error', 'Failed to load order');
        setTimeout(() => router.push('/admin/orders'), 1000);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await axios.put(`/api/orders/${id}`, data);
      if (res.data.success) {
        showToast('success', 'Order updated successfully!');
        setTimeout(() => router.push('/admin/orders'), 1000);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 h-64">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
           <p className="text-center text-slate-500 font-medium">Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
      <Toaster />

      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Link href="/admin/orders" className="text-slate-400 hover:text-green-600 transition-colors p-2 hover:bg-slate-50 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Order</h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">Modify existing order details and shop allocations.</p>
        </div>
      </div>

      <OrderForm
        initialData={orderData}
        availableDesigns={availableDesigns}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/orders')}
        isLoading={isSubmitting}
      />
    </div>
  );
}
