"use client";

import React, { useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";

const costLineItemSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  consumption: z.number().min(0, 'Consumption cannot be negative'),
});

const costingSchema = z.object({
  designNo: z.string().min(1, 'Design number is required'),
  description: z.string().min(1, 'Design description is required'),
  sizes: z.array(z.string().min(1)).min(1, 'At least one size is required'),
  sewingItems: z.array(costLineItemSchema),
  fabricItems: z.array(costLineItemSchema),
  accessoriesItems: z.array(costLineItemSchema),
  specialItems: z.array(costLineItemSchema),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
});

type CostingFormValues = z.infer<typeof costingSchema>;

const emptyLineItem = {
  type: '',
  description: '',
  unit: '',
  rate: 0,
  consumption: 0,
};

const defaultValues: CostingFormValues = {
  designNo: '',
  description: '',
  sizes: [],
  sewingItems: [],
  fabricItems: [],
  accessoriesItems: [],
  specialItems: [],
  sellingPrice: 0,
};

interface CostingFormProps {
  initialData?: any;
  onSubmit: (data: CostingFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CostingForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: CostingFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CostingFormValues>({
    resolver: zodResolver(costingSchema),
    defaultValues: initialData ? { ...defaultValues, ...initialData } : defaultValues,
  });

  const { fields: sewingFields, append: appendSewing, remove: removeSewing } = useFieldArray({
    control,
    name: 'sewingItems',
  });
  const { fields: fabricFields, append: appendFabric, remove: removeFabric } = useFieldArray({
    control,
    name: 'fabricItems',
  });
  const { fields: accessoriesFields, append: appendAccessories, remove: removeAccessories } = useFieldArray({
    control,
    name: 'accessoriesItems',
  });
  const { fields: specialFields, append: appendSpecial, remove: removeSpecial } = useFieldArray({
    control,
    name: 'specialItems',
  });

  // Watch for real-time calculation
  const sewingItems = watch('sewingItems');
  const fabricItems = watch('fabricItems');
  const accessoriesItems = watch('accessoriesItems');
  const specialItems = watch('specialItems');
  const sellingPrice = watch('sellingPrice');
  const sizes = watch('sizes');

  // Calculates amounts
  const calcSewingAmount = (item: any) => Number(((item?.rate || 0) * (item?.consumption || 0)).toFixed(2));
  const calcFabricAmount = (item: any) => {
    const base = (item?.rate || 0) * (item?.consumption || 0);
    return Number((base + (base / 100) * 5).toFixed(2));
  };
  const calcAccessoriesAmount = (item: any) => Number(((item?.rate || 0) * (item?.consumption || 0)).toFixed(2));
  const calcSpecialAmount = (item: any) => Number(((item?.rate || 0) * (item?.consumption || 0)).toFixed(2));

  // Category totals
  const sewingCost = (sewingItems || []).reduce((s, i) => s + calcSewingAmount(i), 0);
  const fabricCost = (fabricItems || []).reduce((s, i) => s + calcFabricAmount(i), 0);
  const accessoriesCost = (accessoriesItems || []).reduce((s, i) => s + calcAccessoriesAmount(i), 0);
  const specialCost = (specialItems || []).reduce((s, i) => s + calcSpecialAmount(i), 0);

  // Grand total
  const totalCost = Number((sewingCost + fabricCost + accessoriesCost + specialCost).toFixed(2));
  const grossProfit = Number(((sellingPrice || 0) - totalCost).toFixed(2));
  const profitPct = (sellingPrice || 0) > 0
    ? Number(((grossProfit / sellingPrice) * 100).toFixed(2))
    : 0;

  // Refs for Enter navigation
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)[]>([]);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const sizeInputRef = useRef<HTMLInputElement | null>(null);

  let refIndex = 0;
  const getRef = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
    if (el) {
      inputRefs.current[refIndex] = el;
    }
    refIndex++;
  };

  const mergeRefs = (registerResult: any) => {
    const { ref: registerRef, ...rest } = registerResult;
    return {
      ...rest,
      ref: (el: HTMLInputElement | null) => {
        registerRef(el);
        getRef(el);
      },
    };
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;

    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
      return;
    }

    e.preventDefault();

    const currentIndex = inputRefs.current.findIndex(ref => ref === target);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
      const nextElement = inputRefs.current[nextIndex];
      if (nextElement) {
        nextElement.focus();
        if (nextElement instanceof HTMLInputElement) {
          nextElement.select();
        }
      }
    } else {
      if (submitBtnRef.current) {
        submitBtnRef.current.focus();
        submitBtnRef.current.click();
      }
    }
  };

  const handleSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation();

      const value = e.currentTarget.value.trim().toUpperCase();

      if (value === '') {
        const currentIndex = inputRefs.current.findIndex(ref => ref === e.currentTarget);
        if (currentIndex !== -1 && currentIndex + 1 < inputRefs.current.length) {
          inputRefs.current[currentIndex + 1]?.focus();
        }
        return;
      }

      const currentSizes = getValues('sizes') || [];
      if (!currentSizes.includes(value)) {
        setValue('sizes', [...currentSizes, value], { shouldValidate: true });
      }

      e.currentTarget.value = '';
    }

    if (e.key === 'Backspace' && e.currentTarget.value === '') {
      const currentSizes = getValues('sizes') || [];
      if (currentSizes.length > 0) {
        setValue('sizes', currentSizes.slice(0, -1), { shouldValidate: true });
      }
    }
  };

  const handleRemoveSize = (sz: string) => {
    const currentSizes = getValues('sizes') || [];
    setValue('sizes', currentSizes.filter(s => s !== sz), { shouldValidate: true });
  };

  const handleFormSubmit = async (data: CostingFormValues) => {
    await onSubmit(data);
  };

  const inputClass = (error?: boolean) =>
    `mt-1 block w-full rounded-lg border ${
      error ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
    } px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all min-h-[42px]`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative pb-20 max-w-5xl mx-auto">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        onKeyDown={handleFormKeyDown}
        className="p-6 sm:p-8 space-y-8"
      >
        {/* Section 1: Design Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-5">Design Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Design No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...mergeRefs(register('designNo'))}
                placeholder="e.g. 1009"
                className={inputClass(!!errors.designNo)}
              />
              {errors.designNo && <p className="mt-1 text-xs font-semibold text-red-600">{errors.designNo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Sizes <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(sizes || []).map((sz) => (
                  <span key={sz} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {sz}
                    <button type="button" onClick={() => handleRemoveSize(sz)} className="text-slate-400 hover:text-red-500 focus:outline-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                ref={(el) => { getRef(el); sizeInputRef.current = el; }}
                placeholder="Type a size and press Enter"
                className={inputClass(!!errors.sizes)}
                onKeyDown={handleSizeKeyDown}
              />
              {errors.sizes && <p className="mt-1 text-xs font-semibold text-red-600">{errors.sizes.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...mergeRefs(register('description'))}
                placeholder="e.g. FRONT GATHARING LONG SLEEVE SHORT FROCK"
                className={inputClass(!!errors.description)}
              />
              {errors.description && <p className="mt-1 text-xs font-semibold text-red-600">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Sewing Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Sewing</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => appendSewing({ ...emptyLineItem, unit: 'SMV' })} className="h-8 gap-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 px-1 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:flex">
              <div className="w-[18%]">Type</div>
              <div className="w-[28%]">Description</div>
              <div className="w-[10%]">Unit</div>
              <div className="w-[15%] text-right">Rate</div>
              <div className="w-[15%] text-right">CON</div>
              <div className="w-[14%] text-right">Amount</div>
              <div className="w-8"></div>
            </div>
            {sewingFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="w-full sm:w-[18%]">
                  <input type="text" placeholder="Type" {...mergeRefs(register(`sewingItems.${index}.type`))} className={inputClass(!!errors.sewingItems?.[index]?.type)} />
                </div>
                <div className="w-full sm:w-[28%]">
                  <input type="text" placeholder="Description" {...mergeRefs(register(`sewingItems.${index}.description`))} className={inputClass(false)} />
                </div>
                <div className="w-full sm:w-[10%]">
                  <input type="text" placeholder="Unit" {...mergeRefs(register(`sewingItems.${index}.unit`))} className={inputClass(!!errors.sewingItems?.[index]?.unit)} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.01" placeholder="Rate" {...mergeRefs(register(`sewingItems.${index}.rate`, { valueAsNumber: true }))} className={`${inputClass(!!errors.sewingItems?.[index]?.rate)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.0001" placeholder="CON" {...mergeRefs(register(`sewingItems.${index}.consumption`, { valueAsNumber: true }))} className={`${inputClass(!!errors.sewingItems?.[index]?.consumption)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[14%] text-right font-mono font-bold text-green-700 pt-3 sm:pt-0">
                  {calcSewingAmount(sewingItems?.[index]).toFixed(2)}
                </div>
                <div className="w-8 flex justify-end">
                  <button type="button" onClick={() => removeSewing(index)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sewing Cost</span>
              <span className="font-mono font-bold text-slate-800">{sewingCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Fabric Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Fabric <span className="text-xs font-medium text-slate-400 tracking-normal normal-case ml-2">(incl. 5% wastage)</span></h3>
            <Button type="button" variant="outline" size="sm" onClick={() => appendFabric({ ...emptyLineItem, unit: 'YADS' })} className="h-8 gap-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 px-1 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:flex">
              <div className="w-[18%]">Type</div>
              <div className="w-[28%]">Description</div>
              <div className="w-[10%]">Unit</div>
              <div className="w-[15%] text-right">Rate</div>
              <div className="w-[15%] text-right">CON</div>
              <div className="w-[14%] text-right">Amount</div>
              <div className="w-8"></div>
            </div>
            {fabricFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="w-full sm:w-[18%]">
                  <input type="text" placeholder="Type" {...mergeRefs(register(`fabricItems.${index}.type`))} className={inputClass(!!errors.fabricItems?.[index]?.type)} />
                </div>
                <div className="w-full sm:w-[28%]">
                  <input type="text" placeholder="Description" {...mergeRefs(register(`fabricItems.${index}.description`))} className={inputClass(false)} />
                </div>
                <div className="w-full sm:w-[10%]">
                  <input type="text" placeholder="Unit" {...mergeRefs(register(`fabricItems.${index}.unit`))} className={inputClass(!!errors.fabricItems?.[index]?.unit)} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.01" placeholder="Rate" {...mergeRefs(register(`fabricItems.${index}.rate`, { valueAsNumber: true }))} className={`${inputClass(!!errors.fabricItems?.[index]?.rate)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.0001" placeholder="CON" {...mergeRefs(register(`fabricItems.${index}.consumption`, { valueAsNumber: true }))} className={`${inputClass(!!errors.fabricItems?.[index]?.consumption)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[14%] text-right font-mono font-bold text-green-700 pt-3 sm:pt-0">
                  {calcFabricAmount(fabricItems?.[index]).toFixed(2)}
                </div>
                <div className="w-8 flex justify-end">
                  <button type="button" onClick={() => removeFabric(index)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fabric Cost</span>
              <span className="font-mono font-bold text-slate-800">{fabricCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Accessories Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Accessories</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => appendAccessories({ ...emptyLineItem, unit: 'NOS' })} className="h-8 gap-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 px-1 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:flex">
              <div className="w-[18%]">Type</div>
              <div className="w-[28%]">Description</div>
              <div className="w-[10%]">Unit</div>
              <div className="w-[15%] text-right">Rate</div>
              <div className="w-[15%] text-right">CON</div>
              <div className="w-[14%] text-right">Amount</div>
              <div className="w-8"></div>
            </div>
            {accessoriesFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="w-full sm:w-[18%]">
                  <input type="text" placeholder="Type" {...mergeRefs(register(`accessoriesItems.${index}.type`))} className={inputClass(!!errors.accessoriesItems?.[index]?.type)} />
                </div>
                <div className="w-full sm:w-[28%]">
                  <input type="text" placeholder="Description" {...mergeRefs(register(`accessoriesItems.${index}.description`))} className={inputClass(false)} />
                </div>
                <div className="w-full sm:w-[10%]">
                  <input type="text" placeholder="Unit" {...mergeRefs(register(`accessoriesItems.${index}.unit`))} className={inputClass(!!errors.accessoriesItems?.[index]?.unit)} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.01" placeholder="Rate" {...mergeRefs(register(`accessoriesItems.${index}.rate`, { valueAsNumber: true }))} className={`${inputClass(!!errors.accessoriesItems?.[index]?.rate)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.0001" placeholder="CON" {...mergeRefs(register(`accessoriesItems.${index}.consumption`, { valueAsNumber: true }))} className={`${inputClass(!!errors.accessoriesItems?.[index]?.consumption)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[14%] text-right font-mono font-bold text-green-700 pt-3 sm:pt-0">
                  {calcAccessoriesAmount(accessoriesItems?.[index]).toFixed(2)}
                </div>
                <div className="w-8 flex justify-end">
                  <button type="button" onClick={() => removeAccessories(index)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accessories Cost</span>
              <span className="font-mono font-bold text-slate-800">{accessoriesCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Section 5: Special Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Special</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => appendSpecial({ ...emptyLineItem, unit: 'NOS' })} className="h-8 gap-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 px-1 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:flex">
              <div className="w-[18%]">Type</div>
              <div className="w-[28%]">Description</div>
              <div className="w-[10%]">Unit</div>
              <div className="w-[15%] text-right">Rate</div>
              <div className="w-[15%] text-right">CON</div>
              <div className="w-[14%] text-right">Amount</div>
              <div className="w-8"></div>
            </div>
            {specialFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="w-full sm:w-[18%]">
                  <input type="text" placeholder="Type" {...mergeRefs(register(`specialItems.${index}.type`))} className={inputClass(!!errors.specialItems?.[index]?.type)} />
                </div>
                <div className="w-full sm:w-[28%]">
                  <input type="text" placeholder="Description" {...mergeRefs(register(`specialItems.${index}.description`))} className={inputClass(false)} />
                </div>
                <div className="w-full sm:w-[10%]">
                  <input type="text" placeholder="Unit" {...mergeRefs(register(`specialItems.${index}.unit`))} className={inputClass(!!errors.specialItems?.[index]?.unit)} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.01" placeholder="Rate" {...mergeRefs(register(`specialItems.${index}.rate`, { valueAsNumber: true }))} className={`${inputClass(!!errors.specialItems?.[index]?.rate)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[15%]">
                  <input type="number" step="0.0001" placeholder="CON" {...mergeRefs(register(`specialItems.${index}.consumption`, { valueAsNumber: true }))} className={`${inputClass(!!errors.specialItems?.[index]?.consumption)} text-right font-mono`} />
                </div>
                <div className="w-full sm:w-[14%] text-right font-mono font-bold text-green-700 pt-3 sm:pt-0">
                  {calcSpecialAmount(specialItems?.[index]).toFixed(2)}
                </div>
                <div className="w-8 flex justify-end">
                  <button type="button" onClick={() => removeSpecial(index)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Special Cost</span>
              <span className="font-mono font-bold text-slate-800">{specialCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Section 6: Pricing & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...mergeRefs(register('sellingPrice', { valueAsNumber: true }))}
              className={`${inputClass(!!errors.sellingPrice)} text-right font-mono font-black text-green-700 text-lg`}
            />
            {errors.sellingPrice && <p className="mt-1 text-xs font-semibold text-red-600">{errors.sellingPrice.message}</p>}
          </div>

          <div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm font-mono">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-4">Summary</h4>
              <div className="space-y-2 border-b border-slate-200 pb-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sewing Cost</span>
                  <span className="font-bold">{sewingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fabric Cost</span>
                  <span className="font-bold">{fabricCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Accessories Cost</span>
                  <span className="font-bold">{accessoriesCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Special Cost</span>
                  <span className="font-bold">{specialCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2 border-b border-slate-200 pb-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-800 font-bold uppercase">Total Cost</span>
                  <span className="font-bold text-slate-900">{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-800 font-bold uppercase">Selling Price</span>
                  <span className="font-bold text-slate-900">{(sellingPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-800 font-bold uppercase">Profit</span>
                  <span className={clsx("font-bold", grossProfit >= 0 ? "text-green-700" : "text-red-600")}>
                    {grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 font-bold uppercase">Margin %</span>
                  <span className={clsx("px-2 py-0.5 rounded text-sm font-bold border",
                    profitPct >= 30 && "bg-green-100 text-green-800 border-green-200",
                    profitPct >= 20 && profitPct < 30 && "bg-amber-100 text-amber-800 border-amber-200",
                    profitPct < 20 && "bg-red-100 text-red-800 border-red-200"
                  )}>
                    {profitPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Action Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 sm:px-8 py-4 flex justify-between items-center z-10">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl">
            Cancel
          </Button>
          <Button type="submit" ref={submitBtnRef} isLoading={isLoading} className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500">
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
            ) : (
              <>{initialData ? "Save Changes" : "Create Record"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
