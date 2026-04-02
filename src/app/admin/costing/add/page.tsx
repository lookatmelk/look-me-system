"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import CostingForm from '@/components/costing/CostingForm';
import type { CostingFormValues } from '@/components/costing/CostingForm';
import { showToast } from '@/components/ui/Toaster';

export default function AddCostingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (values: CostingFormValues) => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await axios.post('/api/costing', values);
      if (res.data.success) {
        showToast('success', 'Costing record created successfully');
        router.push('/admin/costing');
      }
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to create costing record.'
        : 'Failed to create costing record.';
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
        <Link href="/admin/costing" className="text-slate-400 hover:text-green-600 transition-colors p-2 hover:bg-slate-50 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add Costing</h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">Start from the client&apos;s fixed costing sheet and edit only the working values.</p>
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <CostingForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/costing')}
        isLoading={submitting}
        fixedStructure
      />
    </div>
  );
}
