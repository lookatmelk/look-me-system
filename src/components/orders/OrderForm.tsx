"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, AlertCircle, Loader2, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { FormKeyboardHints } from '@/components/ui/FormKeyboardHints';
import { useFormEnterNavigation } from '@/hooks/useFormEnterNavigation';

// ─── Zod Schema ───

const shopAllocationSchema = z.object({
  shopId: z.string().min(1, 'Shop is required'),
  shopName: z.string(),
  qty: z.number()
    .min(0, 'Quantity cannot be negative')
    .int('Quantity must be a whole number'),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
});

const orderSchema = z.object({
  costingId: z.string().min(1, 'Please select a design'),
  sampleNo: z.string().max(50, 'Sample number cannot exceed 50 characters').optional().or(z.literal('')),
  orderDate: z.string().min(1, 'Order date is required'),
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
  shopAllocations: z.array(shopAllocationSchema)
    .min(1, 'At least one shop allocation is required'),
}).refine(
  (data) => {
    const total = data.shopAllocations.reduce((sum, alloc) => sum + (alloc.qty || 0), 0);
    return total > 0;
  },
  {
    message: 'At least one shop must have a quantity greater than 0',
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
  sizes: string[];
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

const SHOP_COLOR_MAP: Record<string, string> = {
  blue: '#2563eb',
  emerald: '#059669',
  green: '#16a34a',
  yellow: '#ca8a04',
  amber: '#d97706',
  orange: '#ea580c',
  red: '#dc2626',
  rose: '#e11d48',
  pink: '#db2777',
  fuchsia: '#c026d3',
  purple: '#9333ea',
  violet: '#7c3aed',
  indigo: '#4f46e5',
  sky: '#0284c7',
  cyan: '#0891b2',
  teal: '#0d9488',
  lime: '#65a30d',
  slate: '#334155',
  gray: '#4b5563',
  zinc: '#52525b',
  neutral: '#525252',
  stone: '#57534e',
};

const resolveShopColor = (shopColor: string) => SHOP_COLOR_MAP[shopColor] || '#16a34a';
const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrderForm({
  initialData,
  availableDesigns,
  isLoading = false,
  onCancel,
  onSubmit,
}: OrderFormProps) {
  const [selectedDesign, setSelectedDesign] = useState<DesignOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeShops, setActiveShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  // Focus refs for Enter navigation
  const { handleFormKeyDown, submitBtnRef } = useFormEnterNavigation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      costingId: initialData?.costingId?._id || initialData?.costingId || '',
      sampleNo: initialData?.sampleNo || '',
      orderDate: initialData?.orderDate
        ? new Date(initialData.orderDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      status: initialData?.status || 'PENDING',
      notes: initialData?.notes || '',
      shopAllocations: [], 
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'shopAllocations',
  });

  const allocationsWatch = watch('shopAllocations') || [];

  // Fetch active shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axios.get('/api/shops?status=ACTIVE');
        if (res.data.success) {
          setActiveShops(res.data.data);
        }
      } catch {
        console.error("Failed to load shops");
      } finally {
        setShopsLoading(false);
      }
    };
    fetchShops();
  }, []);

  // Initialize allocations and design for edit mode
  useEffect(() => {
    if (initialData?.costingId) {
      const initDesignNo = initialData.costingId.designNo || initialData.designNo;
      const foundDesign = availableDesigns.find(d => d.designNo === initDesignNo || d._id === initialData.costingId._id);
      
      if (foundDesign) {
        setSelectedDesign(foundDesign);
      } else if (typeof initialData.costingId === 'object') {
        setSelectedDesign({
          _id: initialData.costingId._id,
          designNo: initialData.costingId.designNo,
          description: initialData.costingId.description,
          sellingPrice: initialData.sellingPrice,
          totalCost: initialData.totalCost,
          profitPercentage: initialData.profitPercentage,
          sizes: initialData.costingId.sizes || [],
        });
      }
    }

    if (initialData?.shopAllocations && activeShops.length > 0) {
      const existingAllocations = initialData.shopAllocations.map((alloc: any) => ({
        shopId: typeof alloc.shopId === 'object' ? alloc.shopId._id : alloc.shopId,
        shopName: alloc.shopName || alloc.shopId?.name || '',
        qty: alloc.qty || 0,
        sizes: alloc.sizes || [],
      }));
      setValue('shopAllocations', existingAllocations);
    }
  }, [initialData, activeShops, availableDesigns, setValue]);

  const allocatedShopIds = useMemo(() => new Set((watch('shopAllocations') || []).map((a: any) => a.shopId)), [allocationsWatch]);
  const availableShopsList = useMemo(() => activeShops.filter((shop) => !allocatedShopIds.has(shop._id)), [activeShops, allocatedShopIds]);

  const handleAddShop = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shopId = e.target.value;
    if (!shopId) return;

    const shop = activeShops.find((s) => s._id === shopId);
    if (!shop) return;

    append({
      shopId: shop._id,
      shopName: shop.name,
      qty: 0,
      sizes: [],
    });
    e.target.value = ''; // Reset select
  };

  const handleAddAllShops = () => {
    availableShopsList.forEach((shop) => {
      append({
        shopId: shop._id,
        shopName: shop.name,
        qty: 0,
        sizes: [],
      });
    });
  };

  // Calculations
  const designTotalCalc = allocationsWatch.reduce((sum, a) => sum + (a.qty || 0), 0);
  const projectedRevenueCalc = selectedDesign ? Number((selectedDesign.sellingPrice * designTotalCalc).toFixed(2)) : 0;
  const projectedProfitCalc = selectedDesign ? Number(((selectedDesign.sellingPrice - selectedDesign.totalCost) * designTotalCalc).toFixed(2)) : 0;

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

  const inputClass = (error?: boolean) =>
    `mt-1 block w-full rounded-lg border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
    } px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all min-h-[42px]`;

  const onFormSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...data,
        shopAllocations: data.shopAllocations
          .filter((a) => a.qty > 0)
          .map((a) => ({
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
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        onKeyDown={handleFormKeyDown}
        className="p-6 sm:p-8 space-y-8"
      >
        <FormKeyboardHints />

        {/* Section 1: Design & Order Details */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Design & Order Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Design Number <span className="text-red-500">*</span>
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
              {errors.costingId && <p className="mt-1 text-xs font-semibold text-red-600">{errors.costingId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Sample Number
              </label>
              <input
                type="text"
                {...register('sampleNo')}
                placeholder="e.g. SAMPLE-001"
                className={inputClass(!!errors.sampleNo)}
              />
              {errors.sampleNo && <p className="mt-1 text-xs font-semibold text-red-600">{errors.sampleNo.message}</p>}
            </div>
          </div>

          {selectedDesign && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col space-y-3 animate-in fade-in">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Design Preview</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Description</span>
                  <span className="text-sm font-bold text-slate-900">{selectedDesign.description}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Sizes</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedDesign.sizes || []).map((sz: string) => (
                      <span key={sz} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Selling Price</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    LKR {selectedDesign.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Total Cost</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    LKR {selectedDesign.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('orderDate')}
                className={inputClass(!!errors.orderDate)}
              />
              {errors.orderDate && <p className="mt-1 text-xs font-semibold text-red-600">{errors.orderDate.message}</p>}
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
              placeholder="Any additional notes..."
              className={inputClass(!!errors.notes)}
            />
          </div>
        </div>

        {/* Section 2: Shop Allocations */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 justify-between border-b border-slate-100 pb-2">
             <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
               Shop Allocations
             </h3>
             <div className="flex items-center gap-3">
               <select
                 className="text-sm border border-slate-200 rounded-lg bg-slate-50 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500"
                 onChange={handleAddShop}
                 defaultValue=""
               >
                 <option value="" disabled>Select a shop to add...</option>
                 {availableShopsList.map(s => (
                   <option key={s._id} value={s._id}>{s.name}</option>
                 ))}
               </select>
               <Button
                 type="button"
                 variant="outline"
                 onClick={handleAddAllShops}
                 disabled={availableShopsList.length === 0}
                 className="text-xs py-1.5 h-auto rounded-lg font-semibold whitespace-nowrap"
               >
                 <Plus className="w-3.5 h-3.5 mr-1" /> Add All
               </Button>
             </div>
          </div>

          {fields.length === 0 ? (
             <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
               <p className="text-sm font-semibold text-slate-500">No shops allocated.</p>
               <p className="text-xs text-slate-400 mt-1">Use the dropdown above to add shops.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const shopId = allocationsWatch[index]?.shopId || field.shopId;
                const activeShopDetails = activeShops.find(s => s._id === shopId);
                const accentColor = resolveShopColor(activeShopDetails?.color || 'slate');
                
                const currentSizes = allocationsWatch[index]?.sizes || [];
                
                return (
                  <div key={field.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-in fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-slate-400" />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                        <span className="text-sm font-bold text-slate-800">{allocationsWatch[index]?.shopName || field.shopName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove allocation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-1">
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

                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-2 mt-2 md:mt-0">Sizes</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {AVAILABLE_SIZES.map(size => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleSize(index, size)}
                              className={clsx(
                                'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                currentSizes.includes(size)
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {NUMERIC_SIZES.map(size => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleSize(index, size)}
                              className={clsx(
                                'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                currentSizes.includes(size)
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        {errors?.shopAllocations?.[index]?.sizes && (
                          <p className="mt-2 text-xs text-red-600">{errors.shopAllocations[index].sizes?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {errors.shopAllocations?.message && (
             <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl flex items-start gap-2">
               <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
               <p>{errors.shopAllocations.message}</p>
             </div>
          )}
        </div>

        {/* Section 3: Summary (Live calculations) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Order Summary projection</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 block">Design Total</span>
                 <span className="text-2xl font-black font-mono text-slate-900">{designTotalCalc.toLocaleString()}</span>
              </div>
              <div>
                 <span className="text-[10px] uppercase font-bold text-slate-500 block">Profit Margin</span>
                 <span className={clsx(
                   'inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black tracking-wide border mt-1',
                   (selectedDesign?.profitPercentage || 0) >= 30 ? 'bg-green-100 text-green-700 border-green-200' :
                   (selectedDesign?.profitPercentage || 0) >= 20 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                   'bg-red-100 text-red-700 border-red-200'
                 )}>
                   {(selectedDesign?.profitPercentage || 0).toFixed(2)}%
                 </span>
              </div>
              <div className="col-span-2"></div>
           </div>
           
           <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                 <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Projected Revenue</span>
                 <span className="text-xl font-black font-mono text-green-600 tracking-tight">
                    LKR {projectedRevenueCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                 <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Projected Profit</span>
                 <span className={clsx("text-xl font-black font-mono tracking-tight", projectedProfitCalc >= 0 ? "text-green-700" : "text-red-600")}>
                    LKR {projectedProfitCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </span>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 sm:px-8 py-4 flex justify-between items-center z-10">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isSubmitting} className="text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl">
            Cancel
          </Button>
          <Button type="submit" ref={submitBtnRef} isLoading={isLoading || isSubmitting} disabled={isLoading || isSubmitting} className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500">
            {(isLoading || isSubmitting) ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
            ) : (
              <>{initialData ? "Update Order" : "Create Order"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
