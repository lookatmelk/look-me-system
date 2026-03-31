# 05 — Costing Form (Add / Edit)

> **File to create:** `src/components/costing/CostingFormModal.tsx`

---

## Overview

Multi-step wizard form (3 steps), matching the purchasing form pattern:

| Step | Title | Fields |
|------|-------|--------|
| 1 | **Design Details** | Design No, Description (dropdown from purchasing), Size, Fabric Name |
| 2 | **Cost Components** | Fabric Price, Fabric Consumption, Print/Belt, Thread/Labels/Polly Bags, Fusing/Elastic/Button/Zip, Standard Minutes Value |
| 3 | **Pricing** | Sewing Cost, Accessories Cost, Selling Price + calculated preview |

---

## Zod Validation Schema

```typescript
import * as z from 'zod';

const costingSchema = z.object({
  designNo: z.string().min(1, "Design number is required"),
  description: z.string().min(1, "Description is required"),
  size: z.enum(['S', 'M', 'L', 'XL', '2XL', 'FREE']),
  fabricName: z.string().min(1, "Fabric name is required"),
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
```

---

## Component Interface

```typescript
interface CostingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CostingFormValues) => Promise<void>;
  initialData?: any;          // null for Add, populated for Edit
  isLoading?: boolean;
  purchasingDescriptions: string[];  // Fetched from /api/costing/descriptions
}
```

---

## Step 1: Design Details

```tsx
{step === 1 && (
  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">

    {/* Design No */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Design No <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        {...register('designNo')}
        placeholder="e.g. 1001"
        className={`mt-1 block w-full rounded-md border ${
          errors.designNo ? 'border-red-500' : 'border-gray-300'
        } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
      />
      {errors.designNo && (
        <p className="mt-1 text-xs text-red-600">{errors.designNo.message}</p>
      )}
    </div>

    {/* ★ Description — PURCHASING DESCRIPTIONS DROPDOWN ★ */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description <span className="text-red-500">*</span>
        <span className="text-xs text-slate-400 ml-1">(from purchasing)</span>
      </label>
      <select
        {...register('description')}
        className={`mt-1 block w-full rounded-md border ${
          errors.description ? 'border-red-500' : 'border-gray-300'
        } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
      >
        <option value="">Select a purchasing description...</option>
        {purchasingDescriptions.map((desc) => (
          <option key={desc} value={desc}>{desc}</option>
        ))}
      </select>
      {errors.description && (
        <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
      )}
    </div>

    {/* Size */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Size <span className="text-red-500">*</span>
      </label>
      <select
        {...register('size')}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white"
      >
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
        <option value="2XL">2XL</option>
        <option value="FREE">FREE</option>
      </select>
    </div>

    {/* Fabric Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fabric Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        {...register('fabricName')}
        placeholder="e.g. VISCOSE LYCRA"
        className={`mt-1 block w-full rounded-md border ${
          errors.fabricName ? 'border-red-500' : 'border-gray-300'
        } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white`}
      />
      {errors.fabricName && (
        <p className="mt-1 text-xs text-red-600">{errors.fabricName.message}</p>
      )}
    </div>
  </div>
)}
```

---

## Step 2: Cost Components

```tsx
{step === 2 && (
  <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">

    {/* Fabric Price + Consumption in 2 columns */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fabric Price <span className="text-red-500">*</span>
        </label>
        <input
          type="number" step="0.01"
          {...register('fabricPrice', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border ${
            errors.fabricPrice ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono`}
        />
        {errors.fabricPrice && <p className="mt-1 text-xs text-red-600">{errors.fabricPrice.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fabric Consumption <span className="text-red-500">*</span>
        </label>
        <input
          type="number" step="0.01"
          {...register('fabricConsumption', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border ${
            errors.fabricConsumption ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono`}
        />
        {errors.fabricConsumption && <p className="mt-1 text-xs text-red-600">{errors.fabricConsumption.message}</p>}
      </div>
    </div>

    {/* Calculated Fabric Cost Preview */}
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fabric Cost</span>
      <span className="text-lg font-black text-slate-900 font-mono">
        {(Number(watchFabricPrice || 0) * Number(watchFabricConsumption || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    </div>

    {/* Print/Belt */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Print / Belt</label>
      <input
        type="number" step="0.01"
        {...register('printBelt', { valueAsNumber: true })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono"
      />
    </div>

    {/* Thread / Labels / Polly Bags */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Thread / Labels / Polly Bags</label>
      <input
        type="number" step="0.01"
        {...register('threadLabelsPollyBags', { valueAsNumber: true })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono"
      />
    </div>

    {/* Fusing / Elastic / Button / Zip */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Fusing / Elastic / Button / Zip</label>
      <input
        type="number" step="0.01"
        {...register('fusingElasticButtonZip', { valueAsNumber: true })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono"
      />
    </div>

    {/* Standard Minutes Value */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Standard Minutes Value (SMV)</label>
      <input
        type="number" step="0.01"
        {...register('standardMinutesValue', { valueAsNumber: true })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono"
      />
    </div>
  </div>
)}
```

---

## Step 3: Pricing & Summary

```tsx
{step === 3 && (
  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">

    {/* Sewing Cost */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Sewing Cost <span className="text-red-500">*</span>
      </label>
      <input
        type="number" step="0.01"
        {...register('sewingCost', { valueAsNumber: true })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono"
      />
    </div>

    {/* Accessories Cost */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Accessories Cost <span className="text-red-500">*</span>
      </label>
      <input
        type="number" step="0.01"
        {...register('accessoriesCost', { valueAsNumber: true })}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono"
      />
    </div>

    {/* Selling Price */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Selling Price <span className="text-red-500">*</span>
      </label>
      <input
        type="number" step="0.01"
        {...register('sellingPrice', { valueAsNumber: true })}
        className={`mt-1 block w-full rounded-md border ${
          errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
        } px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm bg-gray-50 focus:bg-white text-right font-mono`}
      />
      {errors.sellingPrice && <p className="mt-1 text-xs text-red-600">{errors.sellingPrice.message}</p>}
    </div>

    {/* ─── Live Calculation Summary ─── */}
    <div className="space-y-2 mt-4">
      <div className="bg-gray-50 p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Fabric Cost</span>
          <span className="font-mono font-semibold text-slate-700">{fabricCostCalc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">+ Sewing Cost</span>
          <span className="font-mono font-semibold text-slate-700">{sewingCostVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">+ Accessories Cost</span>
          <span className="font-mono font-semibold text-slate-700">{accessoriesCostVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">+ Others (Print, Thread, Fusing)</span>
          <span className="font-mono font-semibold text-slate-700">{otherCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between">
          <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Total Cost</span>
          <span className="text-xl font-black text-red-700 font-mono">{totalCostCalc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Selling Price</span>
          <span className="text-xl font-black text-green-700 font-mono">{sellingPriceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="border-t border-slate-200 pt-3 flex justify-between">
          <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Gross Profit</span>
          <span className={clsx('text-xl font-black font-mono', grossProfitCalc >= 0 ? 'text-green-700' : 'text-red-600')}>
            {grossProfitCalc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-slate-700 uppercase text-xs tracking-wider">Profit %</span>
          <span className={clsx(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-black',
            profitPctCalc >= 30 && 'bg-green-50 text-green-700 border border-green-200',
            profitPctCalc >= 20 && profitPctCalc < 30 && 'bg-amber-50 text-amber-700 border border-amber-200',
            profitPctCalc < 20 && 'bg-red-50 text-red-700 border border-red-200',
          )}>
            {profitPctCalc.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>

    {/* Info notice */}
    <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-md flex items-start gap-2 mt-4">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p>Verify all cost components. Total cost and profit are calculated automatically.</p>
    </div>
  </div>
)}
```

---

## Live Calculation Variables

```typescript
const watchFabricPrice = watch('fabricPrice');
const watchFabricConsumption = watch('fabricConsumption');
const watchPrintBelt = watch('printBelt');
const watchThreadLabels = watch('threadLabelsPollyBags');
const watchFusingElastic = watch('fusingElasticButtonZip');
const watchSewingCost = watch('sewingCost');
const watchAccessoriesCost = watch('accessoriesCost');
const watchSellingPrice = watch('sellingPrice');

// Derived calculations
const fabricCostCalc = Number((Number(watchFabricPrice || 0) * Number(watchFabricConsumption || 0)).toFixed(2));
const sewingCostVal = Number(watchSewingCost || 0);
const accessoriesCostVal = Number(watchAccessoriesCost || 0);
const otherCosts = Number((Number(watchPrintBelt || 0) + Number(watchThreadLabels || 0) + Number(watchFusingElastic || 0)).toFixed(2));
const totalCostCalc = Number((fabricCostCalc + sewingCostVal + accessoriesCostVal + otherCosts).toFixed(2));
const sellingPriceVal = Number(watchSellingPrice || 0);
const grossProfitCalc = Number((sellingPriceVal - totalCostCalc).toFixed(2));
const profitPctCalc = sellingPriceVal > 0 ? Number(((grossProfitCalc / sellingPriceVal) * 100).toFixed(2)) : 0;
```

---

## Stepper Navigation

Match the purchasing form stepper exactly:

```tsx
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
        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white font-semibold text-sm transition-colors ${
          step >= num
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-gray-300 text-gray-400'
        }`}
      >
        {step > num ? <CheckCircle2 className="w-5 h-5 fill-current" /> : num}
      </div>
    ))}
  </div>
  <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
    <span>Design Details</span>
    <span>Cost Components</span>
    <span>Pricing</span>
  </div>
</div>
```

---

## Step Validation

```typescript
const nextStep = async () => {
  let isValid = false;
  if (step === 1) {
    isValid = await trigger(['designNo', 'description', 'size', 'fabricName']);
  } else if (step === 2) {
    isValid = await trigger([
      'fabricPrice', 'fabricConsumption', 'printBelt',
      'threadLabelsPollyBags', 'fusingElasticButtonZip', 'standardMinutesValue',
    ]);
  }
  if (isValid) setStep(step + 1);
};
```

---

## Default Values

```typescript
const defaultValues: CostingFormValues = {
  designNo: '',
  description: '',
  size: 'M',
  fabricName: '',
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
```

---

## Key Notes

1. **The description field is a `<select>` dropdown**, NOT a text input. It pulls options from `purchasingDescriptions` prop (fetched via `/api/costing/descriptions`).
2. **All number inputs use `valueAsNumber: true`** in react-hook-form registration.
3. **All number inputs are right-aligned** with `font-mono` for readability.
4. **The calculation summary panel** on Step 3 updates in real-time as the user changes values.
5. **Same stepper progress bar** as the purchasing form — green gradient line.

---

> **Next:** [06-purchasing-description-dropdown.md](./06-purchasing-description-dropdown.md)
