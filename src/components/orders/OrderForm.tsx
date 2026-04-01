"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import { Button } from '@/components/ui/Button';

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
  onCancel: () => void;
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
  onCancel,
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

  const nextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
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

  const inputClass = (error?: boolean) =>
    `mt-1 block w-full rounded-lg border ${
      error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
    } px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all min-h-[42px]`;

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
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (activeShops.length === 0) {
    return (
      <div className="bg-orange-50 text-orange-800 p-8 rounded-2xl border border-orange-200 text-center">
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative pb-20 max-w-4xl mx-auto">
      <div className="p-6 sm:p-8">
        {/* Stepper Header */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10 transform -translate-y-1/2" />
            <div
              className="absolute left-0 top-1/2 h-0.5 bg-green-500 transition-all duration-300 -z-10 transform -translate-y-1/2"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white font-bold text-base transition-colors ${
                  step >= num
                    ? 'border-green-500 text-green-600 shadow-md shadow-green-100'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                {step > num ? <CheckCircle2 className="w-6 h-6 fill-current text-green-500" /> : num}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs sm:text-sm font-semibold text-slate-500">
            <span className={step >= 1 ? 'text-slate-800' : ''}>Design Selection</span>
            <span className={step >= 2 ? 'text-slate-800' : ''}>Shop Allocations</span>
            <span className={step >= 3 ? 'text-slate-800' : ''}>Review</span>
          </div>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 3) {
              handleSubmit(onFormSubmit)(e);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
        >

          {/* Step 1: Design Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Design Number <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-400 ml-1">(from costing)</span>
                </label>
                <select
                  {...register('costingId')}
                  onChange={(e) => handleDesignChange(e.target.value)}
                  className={inputClass(!!errors.costingId)}
                >
                  <option value="">Select a design number...</option>
                  {availableDesigns.map((design) => (
                    <option key={design._id} value={design._id}>
                      {design.designNo} - {design.description} (LKR {design.sellingPrice.toLocaleString()})
                    </option>
                  ))}
                </select>
                {errors.costingId && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.costingId.message}</p>
                )}
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('orderDate')}
                    className={inputClass(!!errors.orderDate)}
                  />
                  {errors.orderDate && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.orderDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('status')}
                    className={inputClass(!!errors.status)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Notes <span className="text-xs text-slate-400 ml-1">(optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Any additional notes about this order..."
                  className={inputClass(!!errors.notes)}
                />
                {errors.notes && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.notes.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Shop Allocations */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {fields.map((field, index) => {
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
                    inputClass={inputClass}
                  />
                );
              })}

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Design Total</span>
                <span className="text-2xl font-black text-green-700 font-mono">
                  {designTotalCalc.toLocaleString()}
                </span>
              </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="space-y-5">
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

                <div className="space-y-2">
                  {allocationsWatch.map((alloc: any) => {
                    const qty = alloc.qty || 0;
                    const sizes = alloc.sizes || [];
                    if (qty === 0) return null;

                    return (
                      <div key={alloc.shopId} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-white border border-slate-100">
                        <div>
                          <span className="text-sm font-semibold text-slate-700">{alloc.shopName}</span>
                          {sizes.length > 0 && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{sizes.join(', ')}</p>
                          )}
                        </div>
                        <span className="font-mono text-sm font-bold text-slate-800">
                          {qty.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>Review all shop allocations carefully. Revenue and profit are calculated from the linked costing record.</p>
                </div>
              </div>

              <div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dynamic Summary</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Design Total</span>
                      <span className="font-mono font-bold text-slate-800">{designTotalCalc.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Selling Price / Unit</span>
                      <span className="font-mono font-bold text-slate-800">
                        LKR {(selectedDesign?.sellingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Cost / Unit</span>
                      <span className="font-mono font-bold text-slate-800">
                        LKR {(selectedDesign?.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Projected Revenue</span>
                      <span className="text-2xl font-black text-green-600 font-mono tracking-tight">
                        {projectedRevenueCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white py-1.5 px-3 -mx-3 rounded-lg border border-slate-100 shadow-sm">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Projected Profit</span>
                      <span className={clsx(
                        'text-xl font-black font-mono tracking-tight',
                        projectedProfitCalc >= 0 ? 'text-green-700' : 'text-red-600'
                      )}>
                        {projectedProfitCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200 mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Profit Margin</span>
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-black tracking-wide border',
                        (selectedDesign?.profitPercentage || 0) >= 30 && 'bg-green-50 text-green-700 border-green-200',
                        (selectedDesign?.profitPercentage || 0) >= 20 && (selectedDesign?.profitPercentage || 0) < 30 && 'bg-amber-50 text-amber-700 border-amber-200',
                        (selectedDesign?.profitPercentage || 0) < 20 && 'bg-red-50 text-red-700 border-red-200'
                      )}>
                        {(selectedDesign?.profitPercentage || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 sm:px-8 py-4 flex justify-between items-center">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading || isSubmitting} className="gap-2 text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isSubmitting} className="text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl">
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep} disabled={isLoading || isSubmitting} className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500">
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" isLoading={isLoading || isSubmitting} disabled={isLoading || isSubmitting} className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500">
                {(isLoading || isSubmitting) ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <>{initialData ? "Update Order" : "Create Order"}</>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
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
  inputClass,
}: {
  index: number;
  shopName: string;
  shopColor: string;
  register: any;
  watch: any;
  errors: any;
  toggleSize: (index: number, size: string) => void;
  inputClass: (error?: boolean) => string;
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
        <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
        <input
          type="number"
          min="0"
          step="1"
          {...register(`shopAllocations.${index}.qty`, { valueAsNumber: true })}
          className={`${inputClass(!!errors?.shopAllocations?.[index]?.qty)} text-right font-mono`}
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
