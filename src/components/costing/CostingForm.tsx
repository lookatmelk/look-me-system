"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";

const costingSchema = z.object({
  designNo: z.string().min(1, "Design number is required"),
  description: z.string().min(1, "Design description is required"),
  purchasingDescription: z.string().min(1, "Purchasing description is required"),
  size: z.enum(["S", "M", "L", "XL", "2XL", "FREE"]),
  fabric: z.string().min(1, "Fabric is automatically mapped but cannot be empty"),
  fabricPrice: z.number().min(0, "Fabric price cannot be negative"),
  fabricConsumption: z.number().min(0, "Fabric consumption cannot be negative"),
  printBelt: z.number().min(0, "Print/Belt cost cannot be negative"),
  threadLabelsPollyBags: z.number().min(0, "Thread/Labels cost cannot be negative"),
  fusingElasticButtonZip: z.number().min(0, "Fusing/Elastic cost cannot be negative"),
  standardMinutesValue: z.number().min(0, "SMV cannot be negative"),
  sewingCost: z.number().min(0, "Sewing cost cannot be negative"),
  accessoriesCost: z.number().min(0, "Accessories cost cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
});

type CostingFormValues = z.infer<typeof costingSchema>;

const defaultValues: CostingFormValues = {
  designNo: "",
  description: "",
  purchasingDescription: "",
  size: "M",
  fabric: "",
  fabricPrice: 0,
  fabricConsumption: 0,
  printBelt: 0,
  threadLabelsPollyBags: 0,
  fusingElasticButtonZip: 0,
  standardMinutesValue: 0,
  sewingCost: 0,
  accessoriesCost: 0,
  sellingPrice: 0,
};

interface CostingFormProps {
  initialData?: any;
  onSubmit: (data: CostingFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  purchasingDescriptions: { description: string; fabric: string }[];
}

export default function CostingForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  purchasingDescriptions,
}: CostingFormProps) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CostingFormValues>({
    resolver: zodResolver(costingSchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const watchPurchasingDescription = watch("purchasingDescription");
  const watchFabricPrice = watch("fabricPrice");
  const watchFabricConsumption = watch("fabricConsumption");
  const watchPrintBelt = watch("printBelt");
  const watchThreadLabels = watch("threadLabelsPollyBags");
  const watchFusingElastic = watch("fusingElasticButtonZip");
  const watchSewingCost = watch("sewingCost");
  const watchAccessoriesCost = watch("accessoriesCost");
  const watchSellingPrice = watch("sellingPrice");

  // Auto-map fabric from purchasing description
  useEffect(() => {
    if (watchPurchasingDescription) {
      const match = purchasingDescriptions.find((d) => d.description === watchPurchasingDescription);
      if (match) {
        setValue("fabric", match.fabric, { shouldValidate: true });
      }
    } else {
      setValue("fabric", "", { shouldValidate: true });
    }
  }, [watchPurchasingDescription, purchasingDescriptions, setValue]);

  const fabricCostCalc = Number(
    (Number(watchFabricPrice || 0) * Number(watchFabricConsumption || 0)).toFixed(2)
  );
  const sewingCostVal = Number(watchSewingCost || 0);
  const accessoriesCostVal = Number(watchAccessoriesCost || 0);
  const otherCosts = Number(
    (
      Number(watchPrintBelt || 0) +
      Number(watchThreadLabels || 0) +
      Number(watchFusingElastic || 0)
    ).toFixed(2)
  );
  const totalCostCalc = Number(
    (fabricCostCalc + sewingCostVal + accessoriesCostVal + otherCosts).toFixed(2)
  );
  const sellingPriceVal = Number(watchSellingPrice || 0);
  const grossProfitCalc = Number((sellingPriceVal - totalCostCalc).toFixed(2));
  const profitPctCalc =
    sellingPriceVal > 0
      ? Number(((grossProfitCalc / sellingPriceVal) * 100).toFixed(2))
      : 0;

  const nextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["designNo", "description", "purchasingDescription", "size", "fabric"]);
    } else if (step === 2) {
      isValid = await trigger([
        "fabricPrice",
        "fabricConsumption",
        "printBelt",
        "threadLabelsPollyBags",
        "fusingElasticButtonZip",
        "standardMinutesValue",
      ]);
    }
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const inputClass = (error?: boolean) =>
    `mt-1 block w-full rounded-lg border ${
      error ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
    } px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all min-h-[42px]`;

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
                    ? "border-green-500 text-green-600 shadow-md shadow-green-100"
                    : "border-slate-200 text-slate-400"
                }`}
              >
                {step > num ? (
                  <CheckCircle2 className="w-6 h-6 fill-current text-green-500" />
                ) : (
                  num
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs sm:text-sm font-semibold text-slate-500">
            <span className={step >= 1 ? "text-slate-800" : ""}>Design Details</span>
            <span className={step >= 2 ? "text-slate-800" : ""}>Cost Components</span>
            <span className={step >= 3 ? "text-slate-800" : ""}>Pricing Overview</span>
          </div>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 3) {
              handleSubmit(onSubmit)(e);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
        >
          {/* Step 1: Design Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Design No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("designNo")}
                    placeholder="e.g. 1001"
                    className={inputClass(!!errors.designNo)}
                  />
                  {errors.designNo && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.designNo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("size")}
                    className={inputClass(!!errors.size)}
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="FREE">FREE</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Design Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("description")}
                    placeholder="e.g. Blue Striped Summer Dress"
                    className={inputClass(!!errors.description)}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Purchasing Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      {...register("purchasingDescription")}
                      className={inputClass(!!errors.purchasingDescription)}
                    >
                      <option value="">Select a purchasing description...</option>
                      {purchasingDescriptions.map((d) => (
                        <option key={d.description} value={d.description}>
                          {d.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.purchasingDescription && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.purchasingDescription.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Fabric (Linked from Purchasing)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("fabric")}
                      readOnly
                      placeholder="Select a description first..."
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-semibold px-3 py-2 min-h-[42px] cursor-not-allowed focus:outline-none focus:ring-0"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center mt-1">
                      <CheckCircle2 className={clsx("h-4 w-4", watch("fabric") ? "text-green-500" : "text-transparent")} />
                    </div>
                  </div>
                  {errors.fabric && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.fabric.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cost Components */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Fabric Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("fabricPrice", { valueAsNumber: true })}
                    className={`${inputClass(!!errors.fabricPrice)} text-right font-mono`}
                  />
                  {errors.fabricPrice && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.fabricPrice.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Fabric Consumption <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("fabricConsumption", { valueAsNumber: true })}
                    className={`${inputClass(!!errors.fabricConsumption)} text-right font-mono`}
                  />
                  {errors.fabricConsumption && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.fabricConsumption.message}</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fabric Cost</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {fabricCostCalc.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Print / Belt</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("printBelt", { valueAsNumber: true })}
                    className={`${inputClass(false)} text-right font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Thread / Labels / Polly Bags</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("threadLabelsPollyBags", { valueAsNumber: true })}
                    className={`${inputClass(false)} text-right font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fusing / Elastic / Button / Zip</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("fusingElasticButtonZip", { valueAsNumber: true })}
                    className={`${inputClass(false)} text-right font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Standard Minutes Value (SMV)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("standardMinutesValue", { valueAsNumber: true })}
                    className={`${inputClass(false)} text-right font-mono`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing Summary */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Sewing Cost <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("sewingCost", { valueAsNumber: true })}
                    className={`${inputClass(!!errors.sewingCost)} text-right font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Accessories Cost <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("accessoriesCost", { valueAsNumber: true })}
                    className={`${inputClass(!!errors.accessoriesCost)} text-right font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("sellingPrice", { valueAsNumber: true })}
                    className={`${inputClass(!!errors.sellingPrice)} text-right font-mono font-black text-green-700`}
                  />
                  {errors.sellingPrice && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.sellingPrice.message}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>
                    Verify all cost components. Total cost and profit percentages are calculated automatically and attached directly to the record layout.
                  </p>
                </div>
              </div>

              {/* Dynamic Summary Card */}
              <div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dynamic Summary</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Fabric Cost</span>
                      <span className="font-mono font-bold text-slate-800">{fabricCostCalc.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">+ Sewing Cost</span>
                      <span className="font-mono font-bold text-slate-800">{sewingCostVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">+ Accessories Cost</span>
                      <span className="font-mono font-bold text-slate-800">{accessoriesCostVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-semibold">+ Others (Print, Thread, Fusing)</span>
                      <span className="font-mono font-bold text-slate-800">{otherCosts.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Total Cost</span>
                      <span className="text-2xl font-black text-red-600 font-mono tracking-tight">{totalCostCalc.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white py-1.5 px-3 -mx-3 rounded-lg border border-slate-100 shadow-sm">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Selling Price</span>
                      <span className="text-xl font-black text-green-600 font-mono tracking-tight">{sellingPriceVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200 mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Gross Profit</span>
                      <span className={clsx("text-2xl font-black font-mono tracking-tight", grossProfitCalc >= 0 ? "text-green-700" : "text-red-600")}>
                        {grossProfitCalc.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 uppercase text-xs tracking-wider">Profit Margin</span>
                      <span className={clsx("inline-flex items-center px-3 py-1.5 rounded-full text-sm font-black tracking-wide border",
                        profitPctCalc >= 30 && "bg-green-50 text-green-700 border-green-200",
                        profitPctCalc >= 20 && profitPctCalc < 30 && "bg-amber-50 text-amber-700 border-amber-200",
                        profitPctCalc < 20 && "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {profitPctCalc.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Action Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 sm:px-8 py-4 flex justify-between items-center">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading} className="gap-2 text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl">
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep} disabled={isLoading} className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500">
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" isLoading={isLoading} className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <>{initialData ? "Save Changes" : "Create Record"}</>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
