"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import CostingForm from '@/components/costing/CostingForm';
import { showToast } from '@/components/ui/Toaster';

export default function EditCostingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!id) return;

    const init = async () => {
      try {
        const dataRes = await axios.get(`/api/costing/${id}`);

        if (dataRes.data.success) {
          setInitialData(dataRes.data.data);
        } else {
          showToast('error', 'Costing record not found');
          router.push('/admin/costing');
        }
      } catch (err) {
        setServerError('Failed to fetch initial data for editing.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, router]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await axios.put(`/api/costing/${id}`, values);
      if (res.data.success) {
        showToast('success', 'Costing record updated successfully');
        router.push('/admin/costing');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update costing record.';
      setServerError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Page Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Link href="/admin/costing" className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Costing</h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">Modify existing costing parameters configuration.</p>
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : initialData ? (
        <CostingForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/costing')}
          isLoading={submitting}
        />
      ) : null}
    </div>
  );
}
