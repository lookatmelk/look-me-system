"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import OrderForm, { DesignOption } from '@/components/orders/OrderForm';
import { showToast, Toaster } from '@/components/ui/Toaster';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="border-4 border-slate-200 border-t-green-500 rounded-full w-10 h-10 animate-spin" />
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <p className="text-center text-slate-500">Order not found</p>
      </div>
    );
  }

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
        Edit Order
      </h1>

      <OrderForm
        initialData={orderData}
        availableDesigns={availableDesigns}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
