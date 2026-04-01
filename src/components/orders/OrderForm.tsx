"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

// ─── Zod Schema ───

const shopAllocationSchema = z.object({
  shopId: z.string(),
  shopName: z.string(),
  qty: z.number()
    .min(0, 'Quantity cannot be negative')
    .int('Quantity must be a whole number'),
  sizes: z.array(z.string()),
});

const orderSchema = z.object({
  costingId: z.string().min(1, 'Please select a design'),
  orderDate: z.string().min(1, 'Order date is required'),
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
  shopAllocations: z.array(shopAllocationSchema),
}).refine(
  (data) => {
    const total = data.shopAllocations.reduce((sum, alloc) => sum + (alloc.qty || 0), 0);
    return total > 0;
  },
  {
    message: 'At least one shop must have a quantity greater than 0',
    path: ['shopAllocations'],
  }
).refine(
  (data) => {
    for (const alloc of data.shopAllocations) {
      if ((alloc.qty > 0) && alloc.sizes.length === 0) return false;
    }
    return true;
  },
  {
    message: 'Shops with quantity must have at least one size selected',
    // We cannot map perfectly to array index here without knowing which fails in refine easily, 
    // so we will handle the precise error presentation manually during step validation.
    path: ['shopAllocations'],
  }
);

type OrderFormValues = z.infer<typeof orderSchema>;

// ─── Interfaces ───

export interface DesignOption {
  _id: string;
  designNo: string;
  description: string;
  sellingPrice: number;
  totalCost: number;
  profitPercentage: number;
  size: string;
}

interface OrderFormProps {
  initialData?: any;
  availableDesigns: DesignOption[];
  isLoading?: boolean;
  onSubmit: (data: OrderFormValues) => Promise<void>;
}

// ─── Constants ───

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'FREE'];
const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38', '40'];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// ─── Main Component ───

export default function OrderForm({
  initialData,
  availableDesigns,
  isLoading = false,
  onSubmit,
}: OrderFormProps) {
  const [step, setStep] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState<DesignOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeShops, setActiveShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      costingId: initialData?.costingId?._id || initialData?.costingId || '',
      orderDate: initialData?.orderDate
        ? new Date(initialData.orderDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      status: initialData?.status || 'PENDING',
      notes: initialData?.notes || '',
      shopAllocations: [], // Populated dynamically once shops load
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'shopAllocations',
  });

  const allocationsWatch = watch('shopAllocations') || [];

  // Fetch active shops and sync allocations
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axios.get('/api/shops?status=ACTIVE');
        if (res.data.success) {
          const shops = res.data.data;
          setActiveShops(shops);
          
          // Build allocations array
          const initialAllocations = shops.map((shop: any) => {
            // Find existing if editing
            const existing = initialData?.shopAllocations?.find((a: any) => 
              a.shopId.toString() === shop._id.toString()
            );
            return {
              shopId: shop._id,
              shopName: shop.name,
              qty: existing ? existing.qty : 0,
              sizes: existing ? existing.sizes : [],
              // We inject these for UI rendering only, they get stripped on submit
              _color: shop.color,
            };
          });
          
          replace(initialAllocations);
        }
      } catch {
        console.error("Failed to load shops");
      } finally {
        setShopsLoading(false);
      }
    };
    fetchShops();
  }, [initialData, replace]);

  // Set selected design for edit mode
  useEffect(() => {
    if (initialData?.costingId && typeof initialData.costingId === 'object') {
      setSelectedDesign({
        _id: initialData.costingId._id,
        designNo: initialData.costingId.designNo,
        description: initialData.costingId.description,
        sellingPrice: initialData.sellingPrice,
        totalCost: initialData.totalCost,
        profitPercentage: initialData.profitPercentage,
        size: initialData.costingId.size,
      });
    }
  }, [initialData, availableDesigns]);

  const designTotalCalc = allocationsWatch.reduce((sum, a) => sum + (a.qty || 0), 0);

  const projectedRevenueCalc = selectedDesign
    ? Number((selectedDesign.sellingPrice * designTotalCalc).toFixed(2))
    : 0;

  const projectedProfitCalc = selectedDesign
    ? Number(((selectedDesign.sellingPrice - selectedDesign.totalCost) * designTotalCalc).toFixed(2))
    : 0;

  const handleDesignChange = (costingId: string) => {
    const design = availableDesigns.find(d => d._id === costingId);
    setSelectedDesign(design || null);
    setValue('costingId', costingId);
    if (errors.costingId) clearErrors('costingId');
  };

  const toggleSize = (index: number, size: string) => {
    const currentSizes = watch(`shopAllocations.${index}.sizes`) || [];
    const updated = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    setValue(`shopAllocations.${index}.sizes`, updated);
    if (errors.shopAllocations?.[index]?.sizes) clearErrors(`shopAllocations.${index}.sizes` as any);
  };

  const validateStep1 = async (): Promise<boolean> => {
    const isValid = await trigger(['costingId', 'orderDate', 'status']);
    return isValid;
  };

  const validateStep2 = async (): Promise<boolean> => {
    const fieldsValid = await trigger('shopAllocations');
    
    // Manual cross-field validations
    const currentAllocations = watch('shopAllocations') || [];
    const total = currentAllocations.reduce((sum, a) => sum + (a.qty || 0), 0);
    
    if (total === 0) {
      setError('shopAllocations', {
        type: 'manual',
        message: 'At least one shop must have a quantity greater than 0',
      });
      return false;
    }

    let sizesValid = true;
    currentAllocations.forEach((alloc, index) => {
      if ((alloc.qty || 0) > 0 && (alloc.sizes || []).length === 0) {
        setError(`shopAllocations.${index}.sizes` as any, {
          type: 'manual',
          message: `Select at least one size for ${alloc.shopName}`,
        });
        sizesValid = false;
      }
    });

    return fieldsValid && sizesValid;
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await validateStep1();
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await validateStep2();
      if (isValid) setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onFormSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      // Strip UI-only fields like _color before submit
      const cleanedData = {
        ...data,
        shopAllocations: data.shopAllocations.map(a => ({
          shopId: a.shopId,
          shopName: a.shopName,
          qty: a.qty,
          sizes: a.sizes,
        }))
      };
      await onSubmit(cleanedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (shopsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (activeShops.length === 0) {
    return (
      <div className="bg-orange-50 text-orange-800 p-6 rounded-2xl border border-orange-200 text-center">
        <Store className="h-10 w-10 text-orange-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg">No Active Shops</h3>
        <p className="mt-1 mb-4 text-sm text-orange-700/80">You need to have at least one active shop to create an order.</p>
        <a href="/admin/shops" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700">
          Manage Shops
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2" />
          <div
            className="absolute left-0 top-1/2 h-0.5 bg-[var(--color-primary)] transition-all duration-300 -z-10 transform -translate-y-1/2"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white font-semibold text-sm transition-colors z-10 ${
                step >= num
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
          <span>Design Selection</span>
          <span>Shop Allocations</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step 1: Design Selection */}
      {step === 1 && (
        <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
          {/* Design Number Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Number <span className="text-red-500">*</span>
              <span className="text-xs text-slate-400 ml-1">(from costing)</span>
            </label>
            <select
              {...register('costingId')}
              onChange={(e) => handleDesignChange(e.target.value)}
              className={`mt-1 block w-full rounded-md border ${
                errors.costingId ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
            >
              <option value="">Select a design number...</option>
              {availableDesigns.map((design) => (
                <option key={design._id} value={design._id}>
                  {design.designNo} — {design.description} (LKR {design.sellingPrice.toLocaleString()})
                </option>
              ))}
            </select>
            {errors.costingId && (
              <p className="mt-1 text-xs text-red-600">{errors.costingId.message}</p>
            )}
          </div>

          {/* Auto-filled Design Info Card */}
          {selectedDesign && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 space-y-2 animate-fade-in">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Selected Design</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Description</span>
                  <span className="text-sm font-bold text-slate-900">{selectedDesign.description}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Size</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                    {selectedDesign.size}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Selling Price</span>
                  <span className="text-sm font-black text-green-700 font-mono">
                    LKR {selectedDesign.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Total Cost</span>
                  <span className="text-sm font-black text-red-700 font-mono">
                    LKR {selectedDesign.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('orderDate')}
              className={`mt-1 block w-full rounded-md border ${
                errors.orderDate ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
            />
            {errors.orderDate && (
              <p className="mt-1 text-xs text-red-600">{errors.orderDate.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-xs text-slate-400 ml-1">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any additional notes about this order..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Shop Allocations */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          {/* Dynamic Shop Sections */}
          {fields.map((field, index) => {
             // extract UI field `_color` directly from field since we inserted it
            const shopColorStr = (field as any)._color || 'blue';
            return (
              <ShopAllocationSection
                key={field.id}
                index={index}
                shopName={field.shopName}
                shopColor={shopColorStr}
                register={register}
                watch={watch}
                errors={errors}
                toggleSize={toggleSize}
              />
            )
          })}

          {/* Live Design Total */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Design Total</span>
            <span className="text-2xl font-black text-green-700 font-mono">
              {designTotalCalc.toLocaleString()}
            </span>
          </div>

          {/* Cross-field error */}
          {errors.shopAllocations?.type === 'manual' && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{errors.shopAllocations.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
          {/* Design Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Summary</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Design No</span>
                <p className="font-bold text-slate-900">{selectedDesign?.designNo}</p>
              </div>
              <div>
                <span className="text-slate-500">Description</span>
                <p className="font-bold text-slate-900">{selectedDesign?.description}</p>
              </div>
            </div>
          </div>

          {/* Shop Breakdown */}
          <div className="space-y-2">
            {allocationsWatch.map((alloc: any, i) => {
              const qty = alloc.qty || 0;
              const sizes = alloc.sizes || [];
              const colorStr = alloc._color || 'blue';
              if (qty === 0) return null;

              return (
                <div key={alloc.shopId} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-white border border-slate-100">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">{alloc.shopName}</span>
                    {sizes.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{sizes.join(', ')}</p>
                    )}
                  </div>
                  <span className={clsx(
                    'font-mono text-sm font-bold font-mono',
                    `text-${colorStr}-700`
                  )}>
                    {qty.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Design Total</span>
              <span className="text-xl font-black text-green-700 font-mono">{designTotalCalc.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
              <span className="text-slate-500">Projected Revenue</span>
              <span className="font-bold text-slate-900 font-mono">
                LKR {projectedRevenueCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Projected Profit</span>
              <span className={clsx(
                'font-bold font-mono',
                projectedProfitCalc >= 0 ? 'text-green-700' : 'text-red-600'
              )}>
                LKR {projectedProfitCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Info notice */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>Review all shop allocations carefully. Revenue and profit are calculated from the costing record.</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="h-10 px-6 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={isLoading || isSubmitting}
            className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : initialData ? 'Update Order' : 'Create Order'}
          </button>
        )}
      </div>
    </form>
  );
}

// ─── ShopAllocationSection Component ───

function ShopAllocationSection({
  index,
  shopName,
  shopColor,
  register,
  watch,
  errors,
  toggleSize,
}: {
  index: number;
  shopName: string;
  shopColor: string;
  register: any;
  watch: any;
  errors: any;
  toggleSize: (index: number, size: string) => void;
}) {
  const currentSizes: string[] = watch(`shopAllocations.${index}.sizes`) || [];
  const currentQty = watch(`shopAllocations.${index}.qty`) || 0;

  return (
    <div className={clsx(`p-4 rounded-xl border-2 bg-${shopColor}-50/50 border-${shopColor}-200`)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Store className={clsx('h-4 w-4', `text-${shopColor}-600`)} />
          <span className="text-sm font-bold text-slate-800">{shopName}</span>
        </div>
        {currentQty > 0 && (
          <span className={clsx(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            `bg-${shopColor}-100 text-${shopColor}-700`
          )}>
            {currentQty} units
          </span>
        )}
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
        <input
          type="number"
          min="0"
          step="1"
          {...register(`shopAllocations.${index}.qty`, { valueAsNumber: true })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-right font-mono text-sm shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 bg-white"
          placeholder="0"
        />
        {errors?.shopAllocations?.[index]?.qty && (
          <p className="mt-1 text-xs text-red-600">{errors.shopAllocations[index].qty.message}</p>
        )}
      </div>

      {/* Sizes (Multi-Select Chips) */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Available Sizes
          {currentQty > 0 && currentSizes.length === 0 && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>

        {/* Text Sizes */}
        <p className="text-[10px] text-slate-400 font-medium mb-1.5">Standard</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {AVAILABLE_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(index, size)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                currentSizes.includes(size)
                  ? `bg-${shopColor}-600 text-white border-${shopColor}-600`
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Numeric Sizes */}
        <p className="text-[10px] text-slate-400 font-medium mb-1.5">Numeric</p>
        <div className="flex flex-wrap gap-1.5">
          {NUMERIC_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(index, size)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                currentSizes.includes(size)
                  ? `bg-${shopColor}-600 text-white border-${shopColor}-600`
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Selected sizes summary */}
        {currentSizes.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-2">
            Selected: <span className="font-semibold">{currentSizes.join(', ')}</span>
          </p>
        )}

        {errors?.shopAllocations?.[index]?.sizes && (
          <p className="mt-1 text-xs text-red-600">{errors.shopAllocations[index].sizes.message}</p>
        )}
      </div>
      {/* Tailwind dynamic JIT catch */}
      <span className={`hidden bg-${shopColor}-50/50 border-${shopColor}-200 text-${shopColor}-600 bg-${shopColor}-100 text-${shopColor}-700 bg-${shopColor}-600 border-${shopColor}-600`} />
    </div>
  );
}
