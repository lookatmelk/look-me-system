"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const PAYMENT_DATE_REQUIRED_MODES = ['CHEQUE', 'CREDIT'] as const;
const TODAY = new Date().toISOString().split('T')[0];

const purchasingSchema = z.object({
  buyDate: z.string().min(1, "Buy Date is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  units: z.enum(['YARDS', 'UNITS', 'CONS', 'SETS', 'OTHER']),
  qty: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0.01, "Rate must be greater than 0"),
  paymentMode: z.enum(['CHEQUE', 'CASH', 'BANK TRANSFER', 'CARD', 'CREDIT', 'OTHER']),
  chequeNumber: z.string().optional().or(z.literal('')),
  paymentDate: z.string().optional().or(z.literal('')),
  status: z.enum(['PENDING', 'DONE', 'CANCELLED', 'RETURNED']),
  linkedOrderId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMode === 'CHEQUE' && !data.chequeNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cheque Number is required for CHEQUE payments',
      path: ['chequeNumber'],
    });
  }

  if (PAYMENT_DATE_REQUIRED_MODES.includes(data.paymentMode as (typeof PAYMENT_DATE_REQUIRED_MODES)[number]) && !data.paymentDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Payment Date is required for CHEQUE and CREDIT payments',
      path: ['paymentDate'],
    });
  }
});

type PurchasingFormValues = z.infer<typeof purchasingSchema>;

interface PurchasingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PurchasingFormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export function PurchasingFormModal({ isOpen, onClose, onSubmit, initialData, isLoading }: PurchasingFormModalProps) {
  const [step, setStep] = useState(1);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, trigger, setValue, clearErrors } = useForm<PurchasingFormValues>({
    resolver: zodResolver(purchasingSchema),
    defaultValues: {
      buyDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      categoryId: '',
      description: '',
      units: 'UNITS',
      qty: 0,
      rate: 0,
      paymentMode: 'CASH',
      chequeNumber: '',
      paymentDate: '',
      status: 'PENDING',
    }
  });

  const qty = watch('qty');
  const rate = watch('rate');
  const paymentMode = watch('paymentMode');
  const amount = (Number(qty || 0) * Number(rate || 0)).toFixed(2);
  const isChequePayment = paymentMode === 'CHEQUE';
  const isManualPaymentDateMode = PAYMENT_DATE_REQUIRED_MODES.includes(paymentMode as (typeof PAYMENT_DATE_REQUIRED_MODES)[number]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      setStep(1);
      if (initialData) {
        reset({
          buyDate: new Date(initialData.buyDate).toISOString().split('T')[0],
          supplierId: initialData.supplierId?._id || initialData.supplierId || '',
          categoryId: initialData.categoryId?._id || initialData.categoryId || '',
          description: initialData.description,
          units: initialData.units,
          qty: initialData.qty,
          rate: initialData.rate,
          paymentMode: initialData.paymentMode,
          chequeNumber: initialData.chequeNumber || '',
          paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate).toISOString().split('T')[0] : '',
          status: initialData.status,
        });
      } else {
        reset({
          buyDate: new Date().toISOString().split('T')[0],
          supplierId: '',
          categoryId: '',
          description: '',
          units: 'UNITS',
          qty: 0,
          rate: 0,
          paymentMode: 'CASH',
          chequeNumber: '',
          paymentDate: '',
          status: 'PENDING',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const fetchDropdownData = async () => {
    try {
      const [supRes, catRes] = await Promise.all([
        axios.get('/api/suppliers'),
        axios.get('/api/categories')
      ]);
      setSuppliers(supRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch dropdowns', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !paymentMode) {
      return;
    }

    if (!isManualPaymentDateMode) {
      setValue('paymentDate', TODAY, { shouldValidate: true });
      clearErrors('paymentDate');
    }
  }, [isOpen, paymentMode, isManualPaymentDateMode, setValue, clearErrors]);

  useEffect(() => {
    if (!isOpen || !paymentMode) {
      return;
    }

    if (!isChequePayment) {
      setValue('chequeNumber', '', { shouldValidate: true });
      clearErrors('chequeNumber');
    }
  }, [isOpen, paymentMode, isChequePayment, setValue, clearErrors]);

  const handleFormSubmit = async (values: PurchasingFormValues) => {
    const payload = { ...values };

    if (!PAYMENT_DATE_REQUIRED_MODES.includes(payload.paymentMode as (typeof PAYMENT_DATE_REQUIRED_MODES)[number])) {
      payload.paymentDate = TODAY;
    }

    if (!initialData) {
      payload.status = 'PENDING';
    }

    if (payload.paymentMode === 'CHEQUE') {
      payload.chequeNumber = payload.chequeNumber?.trim() || '';
    } else {
      payload.chequeNumber = '';
    }

    await onSubmit(payload);
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['buyDate', 'supplierId', 'categoryId', 'description']);
    } else if (step === 2) {
      isValid = await trigger(['units', 'qty', 'rate']);
    }
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Purchase Record" : "Add Purchase Record"}>
      
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 h-0.5 bg-[var(--color-primary)] transition-all duration-300 -z-10 transform -translate-y-1/2" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          {[1, 2, 3].map((num) => (
            <div key={num} className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white font-semibold text-sm transition-colors ${step >= num ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-300 text-gray-400'}`}>
              {step > num ? <CheckCircle2 className="w-5 h-5 fill-current" /> : num}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
          <span>Details</span>
          <span>Quantities</span>
          <span>Payment</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buy Date <span className="text-red-500">*</span></label>
              <input type="date" {...register('buyDate')} className={`mt-1 block w-full rounded-md border ${errors.buyDate ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`} />
              {errors.buyDate && <p className="mt-1 text-xs text-red-600">{errors.buyDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier <span className="text-red-500">*</span></label>
              <select {...register('supplierId')} className={`mt-1 block w-full rounded-md border ${errors.supplierId ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}>
                <option value="">Select a supplier...</option>
                {suppliers.map(sup => (
                  <option key={sup._id} value={sup._id}>{sup.name}</option>
                ))}
              </select>
              {errors.supplierId && <p className="mt-1 text-xs text-red-600">{errors.supplierId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select {...register('categoryId')} className={`mt-1 block w-full rounded-md border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}>
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea {...register('description')} rows={2} placeholder="e.g. SLAB LINNEN FABRIC" className={`mt-1 block w-full rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`} />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units <span className="text-red-500">*</span></label>
              <select {...register('units')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white font-mono">
                <option value="YARDS">YARDS</option>
                <option value="UNITS">UNITS</option>
                <option value="CONS">CONS</option>
                <option value="SETS">SETS</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" {...register('qty', { valueAsNumber: true })} className={`mt-1 block w-full rounded-md border ${errors.qty ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono`} />
                {errors.qty && <p className="mt-1 text-xs text-red-600">{errors.qty.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" {...register('rate', { valueAsNumber: true })} className={`mt-1 block w-full rounded-md border ${errors.rate ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono`} />
                {errors.rate && <p className="mt-1 text-xs text-red-600">{errors.rate.message}</p>}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-[var(--color-border)] mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Calculated Amount</span>
              <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
              <select {...register('paymentMode')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white">
                <option value="CHEQUE">CHEQUE</option>
                <option value="CASH">CASH</option>
                <option value="BANK TRANSFER">BANK TRANSFER</option>
                <option value="CARD">CARD</option>
                <option value="CREDIT">CREDIT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            {isChequePayment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number <span className="text-red-500">*</span></label>
                <input type="text" {...register('chequeNumber')} className={`mt-1 block w-full rounded-md border ${errors.chequeNumber ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`} placeholder="Enter cheque number" />
                {errors.chequeNumber && <p className="mt-1 text-xs text-red-600">{errors.chequeNumber.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date {isManualPaymentDateMode ? <span className="text-red-500">*</span> : <span className="text-gray-500">(auto: today)</span>}
              </label>
              <input type="date" {...register('paymentDate')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white" disabled={!isManualPaymentDateMode} />
              {errors.paymentDate && <p className="mt-1 text-xs text-red-600">{errors.paymentDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
              <select {...register('status')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white font-medium" disabled={!initialData}>
                <option value="PENDING">PENDING</option>
                <option value="DONE">DONE</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-md flex items-start gap-2 mt-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Verify all details before saving. Amounts and records will be linked to the selected supplier and category.</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between pt-4 border-t border-[var(--color-border)]">
          {step > 1 ? (
             <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
               <ChevronLeft className="w-4 h-4 mr-1" /> Back
             </Button>
          ) : (
             <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
               Cancel
             </Button>
          )}

          {step < 3 ? (
             <Button type="button" onClick={nextStep} disabled={isLoading}>
               Next <ChevronRight className="w-4 h-4 ml-1" />
             </Button>
          ) : (
             <Button type="submit" isLoading={isLoading}>
               {initialData ? "Save Record" : "Add Record"}
             </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
