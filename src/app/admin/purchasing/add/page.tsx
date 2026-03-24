"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  buyDate: z.string().min(1, 'Buy Date is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  units: z.enum(['YARDS', 'UNITS', 'CONS', 'SETS', 'OTHER']),
  qty: z.number({ error: 'Enter a valid number' }).min(0.01, 'Quantity must be > 0'),
  rate: z.number({ error: 'Enter a valid number' }).min(0.01, 'Rate must be > 0'),
  paymentMode: z.enum(['CHEQUE', 'CASH', 'BANK TRANSFER', 'CARD', 'OTHER']),
  paymentDate: z.string().optional().or(z.literal('')),
  status: z.enum(['PENDING', 'DONE', 'CANCELLED', 'RETURNED']),
});

type PurchaseFormValues = z.infer<typeof schema>;

const inputClass = (error?: boolean) =>
  `mt-1 block w-full rounded-lg border ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
  } px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:bg-white transition-all`;

const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';
const errorClass = 'mt-1.5 text-xs text-red-600';

export default function AddPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PurchaseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      buyDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      categoryId: '',
      description: '',
      units: 'UNITS',
      qty: 0,
      rate: 0,
      paymentMode: 'CASH',
      paymentDate: '',
      status: 'PENDING',
    },
  });

  const qty = watch('qty');
  const rate = watch('rate');
  const amount = (Number(qty || 0) * Number(rate || 0)).toFixed(2);

  useEffect(() => {
    Promise.all([axios.get('/api/suppliers'), axios.get('/api/categories')]).then(([sup, cat]) => {
      setSuppliers(sup.data.data || []);
      setCategories(cat.data.data || []);
    }).catch(() => {});
  }, []);

  const onSubmit = async (values: PurchaseFormValues) => {
    setSubmitting(true);
    setServerError('');
    try {
      await axios.post('/api/purchasing', {
        ...values,
        amount: parseFloat(amount),
      });
      router.push('/admin/purchasing?success=1');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to create purchase record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-[var(--color-border)]">
        <Link href="/admin/purchasing" className="text-gray-400 hover:text-[var(--color-primary)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Add Purchase Record</h1>
          <p className="mt-0.5 text-sm text-gray-500">Fill in the details to create a new purchase entry.</p>
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="add-purchase-form">
        {/* Section 1: Details & Linking */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">1</span>
            Details &amp; Linking
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Buy Date <span className="text-red-500">*</span></label>
              <input type="date" {...register('buyDate')} className={inputClass(!!errors.buyDate)} />
              {errors.buyDate && <p className={errorClass}>{errors.buyDate.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Supplier <span className="text-red-500">*</span></label>
              <select {...register('supplierId')} className={inputClass(!!errors.supplierId)}>
                <option value="">Select a supplier...</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {errors.supplierId && <p className={errorClass}>{errors.supplierId.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <select {...register('categoryId')} className={inputClass(!!errors.categoryId)}>
                <option value="">Select a category...</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className={errorClass}>{errors.categoryId.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Description <span className="text-red-500">*</span></label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="e.g. SLAB LINEN FABRIC — Blue 60 inch"
                className={inputClass(!!errors.description)}
              />
              {errors.description && <p className={errorClass}>{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Quantities & Rates */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">2</span>
            Quantities &amp; Rates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Units <span className="text-red-500">*</span></label>
              <select {...register('units')} className={inputClass()}>
                <option value="YARDS">YARDS</option>
                <option value="UNITS">UNITS</option>
                <option value="CONS">CONS</option>
                <option value="SETS">SETS</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Quantity <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                {...register('qty', { valueAsNumber: true })}
                className={`${inputClass(!!errors.qty)} text-right font-mono`}
              />
              {errors.qty && <p className={errorClass}>{errors.qty.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Rate <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                {...register('rate', { valueAsNumber: true })}
                className={`${inputClass(!!errors.rate)} text-right font-mono`}
              />
              {errors.rate && <p className={errorClass}>{errors.rate.message}</p>}
            </div>
          </div>

          <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Auto-Calculated Amount</p>
              <p className="text-xs text-green-600 mt-0.5">Qty × Rate</p>
            </div>
            <span className="text-3xl font-black text-green-800 font-mono tracking-tight">
              {Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Section 3: Payment */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">3</span>
            Payment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Payment Mode <span className="text-red-500">*</span></label>
              <select {...register('paymentMode')} className={inputClass()}>
                <option value="CHEQUE">CHEQUE</option>
                <option value="CASH">CASH</option>
                <option value="BANK TRANSFER">BANK TRANSFER</option>
                <option value="CARD">CARD</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Payment Date <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
              <input type="date" {...register('paymentDate')} className={inputClass()} />
            </div>

            <div>
              <label className={labelClass}>Status <span className="text-red-500">*</span></label>
              <select {...register('status')} className={inputClass()}>
                <option value="PENDING">PENDING</option>
                <option value="DONE">DONE</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Link href="/admin/purchasing">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={submitting} className="shadow-md shadow-green-100">
            {submitting ? 'Saving...' : 'Add Purchase Record'}
          </Button>
        </div>
      </form>
    </div>
  );
}
