"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { FormKeyboardHints } from "@/components/ui/FormKeyboardHints";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";

const costLineItemSchema = z.object({
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  rate: z.number().min(0, "Rate cannot be negative"),
  consumption: z.number().min(0, "Consumption cannot be negative"),
});

const costingSchema = z.object({
  designNo: z.string().min(1, "Design number is required"),
  description: z.string().min(1, "Design description is required"),
  sizes: z.array(z.string().min(1)).min(1, "At least one size is required"),
  sewingItems: z.array(costLineItemSchema),
  fabricItems: z.array(costLineItemSchema),
  accessoriesItems: z.array(costLineItemSchema),
  specialItems: z.array(costLineItemSchema),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
});

export type CostingFormValues = z.infer<typeof costingSchema>;
type CostLineItem = z.infer<typeof costLineItemSchema>;
type CostSectionKey = "sewingItems" | "fabricItems" | "accessoriesItems" | "specialItems";

const emptyLineItem: CostLineItem = {
  type: "",
  description: "",
  unit: "",
  rate: 0,
  consumption: 0,
};

const defaultValues: CostingFormValues = {
  designNo: "",
  description: "",
  sizes: [],
  sewingItems: [],
  fabricItems: [],
  accessoriesItems: [],
  specialItems: [],
  sellingPrice: 0,
};

const fixedLineItemTemplates: Record<CostSectionKey, CostLineItem[]> = {
  sewingItems: [
    {
      type: "SEWING",
      description: "CUTTING,SEWING, PACKING",
      unit: "SMV",
      rate: 10,
      consumption: 25,
    },
  ],
  fabricItems: [
    {
      type: "FABRIC",
      description: "VISCOSE PRINTED",
      unit: "YADS",
      rate: 300,
      consumption: 1,
    },
    {
      type: "LILING",
      description: "LINING",
      unit: "YADS",
      rate: 120,
      consumption: 0.75,
    },
    {
      type: "FUSING",
      description: "DOT FUSING",
      unit: "YADS",
      rate: 45,
      consumption: 0.05,
    },
  ],
  accessoriesItems: [
    {
      type: "THREADS",
      description: "COTTON AND YARN",
      unit: "CONN",
      rate: 160,
      consumption: 0.1,
    },
    {
      type: "ELASTIC",
      description: '1" ELASTIC',
      unit: "ROLL",
      rate: 400,
      consumption: 0.5,
    },
    {
      type: "POLLY BAGS",
      description: "11 X14 POLLY BAGS",
      unit: "NOS",
      rate: 9.5,
      consumption: 1,
    },
    {
      type: "BUTTONS/BEATS",
      description: "COCO BUTTONS",
      unit: "NOS",
      rate: 2.5,
      consumption: 12,
    },
    {
      type: "BUCKLE/RINS",
      description: "COVERING BUCKLE",
      unit: "NOS",
      rate: 100,
      consumption: 1,
    },
    {
      type: "BUTTONS/BEATS",
      description: "",
      unit: "NOS",
      rate: 0,
      consumption: 1,
    },
  ],
  specialItems: [
    {
      type: "EMB/PRINT",
      description: "FRONT PRINT",
      unit: "NOS",
      rate: 60,
      consumption: 1,
    },
    {
      type: "PITUCK/PICKOT",
      description: "",
      unit: "NOS",
      rate: 0,
      consumption: 1,
    },
    {
      type: "B HOLE/B ATT",
      description: "",
      unit: "NOS",
      rate: 0,
      consumption: 1,
    },
    {
      type: "OTHERS",
      description: "",
      unit: "ANY",
      rate: 0,
      consumption: 1,
    },
    {
      type: "OTHERS",
      description: "",
      unit: "ANY",
      rate: 0,
      consumption: 1,
    },
  ],
};

const fixedSectionStyles: Record<
  CostSectionKey,
  {
    cardClass: string;
    badgeClass: string;
    totalClass: string;
  }
> = {
  sewingItems: {
    cardClass: "border-amber-200 bg-amber-50/80",
    badgeClass: "border-amber-200 bg-amber-100 text-amber-900",
    totalClass: "border-amber-200 bg-amber-100/80",
  },
  fabricItems: {
    cardClass: "border-indigo-200 bg-indigo-50/80",
    badgeClass: "border-indigo-200 bg-indigo-100 text-indigo-900",
    totalClass: "border-indigo-200 bg-indigo-100/80",
  },
  accessoriesItems: {
    cardClass: "border-emerald-200 bg-emerald-50/80",
    badgeClass: "border-emerald-200 bg-emerald-100 text-emerald-900",
    totalClass: "border-emerald-200 bg-emerald-100/80",
  },
  specialItems: {
    cardClass: "border-yellow-200 bg-yellow-50/85",
    badgeClass: "border-yellow-200 bg-yellow-100 text-yellow-900",
    totalClass: "border-yellow-200 bg-yellow-100/80",
  },
};

const mergeWithTemplate = (
  items: CostLineItem[] | undefined,
  template: CostLineItem[],
  blankEditableDefaults = false
) =>
  template.map((templateItem, index) => {
    const sourceItem = items?.[index];

    return {
      type: templateItem.type,
      unit: templateItem.unit,
      description: sourceItem?.description ?? (blankEditableDefaults ? "" : templateItem.description),
      rate: sourceItem?.rate ?? (blankEditableDefaults ? 0 : templateItem.rate),
      consumption: sourceItem?.consumption ?? (blankEditableDefaults ? 0 : templateItem.consumption),
    };
  });

const buildFixedDefaultValues = (source?: Partial<CostingFormValues>): CostingFormValues => {
  const shouldBlankEditableDefaults = !source;

  return {
  ...defaultValues,
  ...source,
  sewingItems: mergeWithTemplate(source?.sewingItems, fixedLineItemTemplates.sewingItems, shouldBlankEditableDefaults),
  fabricItems: mergeWithTemplate(source?.fabricItems, fixedLineItemTemplates.fabricItems, shouldBlankEditableDefaults),
  accessoriesItems: mergeWithTemplate(
    source?.accessoriesItems,
    fixedLineItemTemplates.accessoriesItems,
    shouldBlankEditableDefaults
  ),
  specialItems: mergeWithTemplate(source?.specialItems, fixedLineItemTemplates.specialItems, shouldBlankEditableDefaults),
};
};

const toNumberOrZero = (value: string) => {
  if (value === "") {
    return 0;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

interface CostingFormProps {
  initialData?: Partial<CostingFormValues>;
  onSubmit: (data: CostingFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  fixedStructure?: boolean;
}

export default function CostingForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  fixedStructure = false,
}: CostingFormProps) {
  const resolvedDefaultValues = fixedStructure
    ? buildFixedDefaultValues(initialData)
    : initialData
      ? { ...defaultValues, ...initialData }
      : defaultValues;

  const { handleFormKeyDown: baseHandleFormKeyDown, submitBtnRef } = useFormEnterNavigation();

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
    defaultValues: resolvedDefaultValues,
  });

  const { fields: sewingFields, append: appendSewing, remove: removeSewing } = useFieldArray({
    control,
    name: "sewingItems",
  });
  const { fields: fabricFields, append: appendFabric, remove: removeFabric } = useFieldArray({
    control,
    name: "fabricItems",
  });
  const { fields: accessoriesFields, append: appendAccessories, remove: removeAccessories } = useFieldArray({
    control,
    name: "accessoriesItems",
  });
  const { fields: specialFields, append: appendSpecial, remove: removeSpecial } = useFieldArray({
    control,
    name: "specialItems",
  });

  const sewingItems = watch("sewingItems");
  const fabricItems = watch("fabricItems");
  const accessoriesItems = watch("accessoriesItems");
  const specialItems = watch("specialItems");
  const sellingPrice = watch("sellingPrice");
  const sizes = watch("sizes");

  const calcSewingAmount = (item: CostLineItem | undefined) =>
    Number((((item?.rate ?? 0) * (item?.consumption ?? 0))).toFixed(2));
  const calcFabricAmount = (item: CostLineItem | undefined) => {
    const base = (item?.rate ?? 0) * (item?.consumption ?? 0);
    return Number((base + (base / 100) * 5).toFixed(2));
  };
  const calcAccessoriesAmount = (item: CostLineItem | undefined) =>
    Number((((item?.rate ?? 0) * (item?.consumption ?? 0))).toFixed(2));
  const calcSpecialAmount = (item: CostLineItem | undefined) =>
    Number((((item?.rate ?? 0) * (item?.consumption ?? 0))).toFixed(2));

  const sewingCost = (sewingItems || []).reduce((sum, item) => sum + calcSewingAmount(item), 0);
  const fabricCost = (fabricItems || []).reduce((sum, item) => sum + calcFabricAmount(item), 0);
  const accessoriesCost = (accessoriesItems || []).reduce((sum, item) => sum + calcAccessoriesAmount(item), 0);
  const specialCost = (specialItems || []).reduce((sum, item) => sum + calcSpecialAmount(item), 0);

  const totalCost = Number((sewingCost + fabricCost + accessoriesCost + specialCost).toFixed(2));
  const grossProfit = Number(((sellingPrice || 0) - totalCost).toFixed(2));
  const profitPct = (sellingPrice || 0) > 0 ? Number(((grossProfit / sellingPrice) * 100).toFixed(2)) : 0;

  useEffect(() => {
    if (!fixedStructure || initialData) {
      return;
    }

    // Keep stored numeric defaults at 0 while presenting fixed sheet numeric cells as empty initially.
    const blankableInputs = document.querySelectorAll<HTMLInputElement>("input[data-initial-blank='true']");

    blankableInputs.forEach((input) => {
      if (input.value === "0") {
        input.value = "";
      }
    });
  }, [fixedStructure, initialData]);

  const canMoveHorizontally = (target: HTMLInputElement, direction: "left" | "right") => {
    if (target.type === "number") {
      return true;
    }

    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (start === null || end === null) {
      return true;
    }

    if (direction === "left") {
      return start === 0 && end === 0;
    }

    const valueLength = target.value.length;
    return start === valueLength && end === valueLength;
  };

  const focusFixedGridCell = (row: number, col: number) => {
    const cell = document.querySelector<HTMLInputElement>(
      `input[data-nav-grid='costing-fixed'][data-row='${row}'][data-col='${col}']`
    );

    if (cell) {
      cell.focus();
      cell.select();
      return true;
    }

    return false;
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;

    if (
      fixedStructure &&
      target instanceof HTMLInputElement &&
      target.dataset.navGrid === "costing-fixed"
    ) {
      const row = Number(target.dataset.row);
      const col = Number(target.dataset.col);

      if (!Number.isNaN(row) && !Number.isNaN(col)) {
        if (e.key === "ArrowUp") {
          const moved = focusFixedGridCell(row - 1, col);
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (e.key === "ArrowDown" || e.key === "Enter") {
          // If it's a modifier key + Enter, let the base hook handle it
          if (e.ctrlKey || e.metaKey) {
            baseHandleFormKeyDown(e);
            return;
          }

          const moved = focusFixedGridCell(row + 1, col);
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          
          // If we are at the last row of the grid, let base handle it (which will submit or move to next section)
          if (e.key === "Enter") {
             // Fall through to baseHandleFormKeyDown
          } else {
             return;
          }
        }

        if (e.key === "ArrowLeft" && canMoveHorizontally(target, "left")) {
          const moved = focusFixedGridCell(row, col - 1);
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (e.key === "ArrowRight" && canMoveHorizontally(target, "right")) {
          const moved = focusFixedGridCell(row, col + 1);
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
      }
    }

    // Call base hook for standard navigation and Command+Enter
    baseHandleFormKeyDown(e);
  };

  const handleSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      // If it's a modifier key + Enter, let the form-level handler handle it (submit)
      if (e.ctrlKey || e.metaKey) {
        return; 
      }

      e.preventDefault();
      e.stopPropagation();

      const value = e.currentTarget.value.trim().toUpperCase();

      if (value === "") {
        return;
      }

      const currentSizes = getValues("sizes") || [];
      if (!currentSizes.includes(value)) {
        setValue("sizes", [...currentSizes, value], { shouldValidate: true });
      }

      e.currentTarget.value = "";
    }

    if (e.key === "Backspace" && e.currentTarget.value === "") {
      const currentSizes = getValues("sizes") || [];
      if (currentSizes.length > 0) {
        setValue("sizes", currentSizes.slice(0, -1), { shouldValidate: true });
      }
    }
  };

  const handleRemoveSize = (sz: string) => {
    const currentSizes = getValues("sizes") || [];
    setValue(
      "sizes",
      currentSizes.filter((size) => size !== sz),
      { shouldValidate: true }
    );
  };

  const handleFormSubmit = async (data: CostingFormValues) => {
    await onSubmit(data);
  };

  const handleEditableFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const inputClass = (error?: boolean) =>
    `mt-1 block w-full rounded-lg border ${
      error ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50"
    } px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all min-h-[42px]`;

  const sheetInputClass = (error?: boolean, alignRight?: boolean) =>
    clsx(
      "h-11 w-full rounded-xl border px-3 text-sm text-slate-900 shadow-sm transition-all outline-none",
      error
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100",
      alignRight && "text-right font-mono"
    );

  const lockedCellClass =
    "flex min-h-[44px] items-center rounded-xl border border-white/70 bg-white/75 px-3 text-sm font-semibold text-slate-700 shadow-sm";

  const renderFixedSection = ({
    sectionName,
    title,
    categoryLabel,
    note,
    totalLabel,
    total,
    fields,
    items,
    sectionErrors,
    amountCalculator,
    rowOffset = 0,
  }: {
    sectionName: CostSectionKey;
    title: string;
    categoryLabel: string;
    note?: string;
    totalLabel: string;
    total: number;
    fields: { id: string }[];
    items: CostLineItem[] | undefined;
    sectionErrors?: FieldErrors<CostingFormValues>[CostSectionKey];
    amountCalculator: (item: CostLineItem | undefined) => number;
    rowOffset?: number;
  }) => {
    const styles = fixedSectionStyles[sectionName];

    return (
      <div className={clsx("rounded-2xl border shadow-sm overflow-hidden", styles.cardClass)}>
        <div className="border-b border-white/70 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-[0.2em] text-slate-800">{title}</h3>
                {note && <span className="text-xs font-semibold text-slate-500">{note}</span>}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Only <span className="font-bold text-slate-800">Description</span>,{" "}
                <span className="font-bold text-slate-800">RATE</span>, and{" "}
                <span className="font-bold text-slate-800">CON</span> can be edited here.
              </p>
            </div>
            <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]", styles.badgeClass)}>
              {fields.length} Fixed {fields.length === 1 ? "Row" : "Rows"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto px-4 py-4">
          <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                <th className="px-2 py-1">Category</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Unit</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1 text-right">Rate</th>
                <th className="px-2 py-1 text-right">CON</th>
                <th className="px-2 py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id}>
                  <td className="px-2 align-middle">
                    <div className={lockedCellClass}>{categoryLabel}</div>
                  </td>
                  <td className="px-2 align-middle">
                    <input type="hidden" {...register(`${sectionName}.${index}.type` as const)} />
                    <div className={lockedCellClass}>{items?.[index]?.type || fixedLineItemTemplates[sectionName][index]?.type}</div>
                  </td>
                  <td className="px-2 align-middle">
                    <input type="hidden" {...register(`${sectionName}.${index}.unit` as const)} />
                    <div className={lockedCellClass}>{items?.[index]?.unit || fixedLineItemTemplates[sectionName][index]?.unit}</div>
                  </td>
                  <td className="px-2 align-middle">
                    <input
                      type="text"
                      {...register(`${sectionName}.${index}.description` as const)}
                      onFocus={handleEditableFocus}
                      data-nav-grid="costing-fixed"
                      data-row={rowOffset + index}
                      data-col={0}
                      className={sheetInputClass(false)}
                      placeholder="Enter description"
                    />
                  </td>
                  <td className="px-2 align-middle">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`${sectionName}.${index}.rate` as const, {
                        setValueAs: toNumberOrZero,
                      })}
                      onFocus={handleEditableFocus}
                      data-nav-grid="costing-fixed"
                      data-row={rowOffset + index}
                      data-col={1}
                      data-initial-blank="true"
                      placeholder="0.00"
                      className={sheetInputClass(!!sectionErrors?.[index]?.rate, true)}
                    />
                  </td>
                  <td className="px-2 align-middle">
                    <input
                      type="number"
                      step="0.0001"
                      {...register(`${sectionName}.${index}.consumption` as const, {
                        setValueAs: toNumberOrZero,
                      })}
                      onFocus={handleEditableFocus}
                      data-nav-grid="costing-fixed"
                      data-row={rowOffset + index}
                      data-col={2}
                      data-initial-blank="true"
                      placeholder="0.0000"
                      className={sheetInputClass(!!sectionErrors?.[index]?.consumption, true)}
                    />
                  </td>
                  <td className="px-2 align-middle">
                    <div className="flex min-h-[44px] items-center justify-end rounded-xl border border-white/70 bg-white/90 px-3 font-mono text-sm font-black text-slate-900 shadow-sm">
                      {amountCalculator(items?.[index]).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={clsx("flex items-center justify-between border-t px-6 py-4", styles.totalClass)}>
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">{totalLabel}</span>
          <span className="font-mono text-lg font-black text-slate-900">{total.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderDynamicSection = ({
    title,
    note,
    sectionName,
    fields,
    items,
    sectionErrors,
    amountCalculator,
    appendRow,
    removeRow,
    newRow,
    total,
    totalLabel,
  }: {
    title: string;
    note?: string;
    sectionName: CostSectionKey;
    fields: { id: string }[];
    items: CostLineItem[] | undefined;
    sectionErrors?: FieldErrors<CostingFormValues>[CostSectionKey];
    amountCalculator: (item: CostLineItem | undefined) => number;
    appendRow: (value: CostLineItem) => void;
    removeRow: (index: number) => void;
    newRow: CostLineItem;
    total: number;
    totalLabel: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
          {title}
          {note && <span className="text-xs font-medium text-slate-400 tracking-normal normal-case ml-2">{note}</span>}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendRow(newRow)}
          className="h-8 gap-1.5 px-3"
        >
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
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="w-full sm:w-[18%]">
              <input
                type="text"
                placeholder="Type"
                {...register(`${sectionName}.${index}.type` as const)}
                className={inputClass(!!sectionErrors?.[index]?.type)}
              />
            </div>
            <div className="w-full sm:w-[28%]">
              <input
                type="text"
                placeholder="Description"
                {...register(`${sectionName}.${index}.description` as const)}
                className={inputClass(false)}
              />
            </div>
            <div className="w-full sm:w-[10%]">
              <input
                type="text"
                placeholder="Unit"
                {...register(`${sectionName}.${index}.unit` as const)}
                className={inputClass(!!sectionErrors?.[index]?.unit)}
              />
            </div>
            <div className="w-full sm:w-[15%]">
              <input
                type="number"
                step="0.01"
                placeholder="Rate"
                {...register(`${sectionName}.${index}.rate` as const, {
                  setValueAs: toNumberOrZero,
                })}
                className={`${inputClass(!!sectionErrors?.[index]?.rate)} text-right font-mono`}
              />
            </div>
            <div className="w-full sm:w-[15%]">
              <input
                type="number"
                step="0.0001"
                placeholder="CON"
                {...register(`${sectionName}.${index}.consumption` as const, {
                  setValueAs: toNumberOrZero,
                })}
                className={`${inputClass(!!sectionErrors?.[index]?.consumption)} text-right font-mono`}
              />
            </div>
            <div className="w-full sm:w-[14%] text-right font-mono font-bold text-green-700 pt-3 sm:pt-0">
              {amountCalculator(items?.[index]).toFixed(2)}
            </div>
            <div className="w-8 flex justify-end">
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between mt-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{totalLabel}</span>
          <span className="font-mono font-bold text-slate-800">{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative pb-20 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} onKeyDown={handleFormKeyDown} className="p-6 sm:p-8 space-y-8">
        <FormKeyboardHints />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-5">Design Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Design No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("designNo")}
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
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                  >
                    {sz}
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(sz)}
                      className="text-slate-400 hover:text-red-500 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
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
                {...register("description")}
                placeholder="e.g. FRONT GATHARING LONG SLEEVE SHORT FROCK"
                className={inputClass(!!errors.description)}
              />
              {errors.description && <p className="mt-1 text-xs font-semibold text-red-600">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {fixedStructure ? (
          <>
            {(() => {
              const sewingOffset = 0;
              const fabricOffset = sewingOffset + sewingFields.length;
              const accessoriesOffset = fabricOffset + fabricFields.length;
              const specialOffset = accessoriesOffset + accessoriesFields.length;

              return (
                <>
            {renderFixedSection({
              sectionName: "sewingItems",
              title: "SEWING",
              categoryLabel: "SEWING",
              totalLabel: "SEWING COST",
              total: sewingCost,
              fields: sewingFields,
              items: sewingItems,
              sectionErrors: errors.sewingItems,
              amountCalculator: calcSewingAmount,
              rowOffset: sewingOffset,
            })}

            {renderFixedSection({
              sectionName: "fabricItems",
              title: "FABRIC",
              categoryLabel: "FABRIC",
              note: "(incl. 5% wastage)",
              totalLabel: "FABRIC COST",
              total: fabricCost,
              fields: fabricFields,
              items: fabricItems,
              sectionErrors: errors.fabricItems,
              amountCalculator: calcFabricAmount,
              rowOffset: fabricOffset,
            })}

            {renderFixedSection({
              sectionName: "accessoriesItems",
              title: "ACCESSORIES",
              categoryLabel: "ACCESSORIES",
              totalLabel: "ACCESSORIES COST",
              total: accessoriesCost,
              fields: accessoriesFields,
              items: accessoriesItems,
              sectionErrors: errors.accessoriesItems,
              amountCalculator: calcAccessoriesAmount,
              rowOffset: accessoriesOffset,
            })}

            {renderFixedSection({
              sectionName: "specialItems",
              title: "SPESIAL",
              categoryLabel: "SPESIAL",
              totalLabel: "SPESIAL COST",
              total: specialCost,
              fields: specialFields,
              items: specialItems,
              sectionErrors: errors.specialItems,
              amountCalculator: calcSpecialAmount,
              rowOffset: specialOffset,
            })}
                </>
              );
            })()}
          </>
        ) : (
          <>
            {renderDynamicSection({
              title: "Sewing",
              sectionName: "sewingItems",
              fields: sewingFields,
              items: sewingItems,
              sectionErrors: errors.sewingItems,
              amountCalculator: calcSewingAmount,
              appendRow: appendSewing,
              removeRow: removeSewing,
              newRow: { ...emptyLineItem, unit: "SMV" },
              total: sewingCost,
              totalLabel: "Sewing Cost",
            })}

            {renderDynamicSection({
              title: "Fabric",
              note: "(incl. 5% wastage)",
              sectionName: "fabricItems",
              fields: fabricFields,
              items: fabricItems,
              sectionErrors: errors.fabricItems,
              amountCalculator: calcFabricAmount,
              appendRow: appendFabric,
              removeRow: removeFabric,
              newRow: { ...emptyLineItem, unit: "YADS" },
              total: fabricCost,
              totalLabel: "Fabric Cost",
            })}

            {renderDynamicSection({
              title: "Accessories",
              sectionName: "accessoriesItems",
              fields: accessoriesFields,
              items: accessoriesItems,
              sectionErrors: errors.accessoriesItems,
              amountCalculator: calcAccessoriesAmount,
              appendRow: appendAccessories,
              removeRow: removeAccessories,
              newRow: { ...emptyLineItem, unit: "NOS" },
              total: accessoriesCost,
              totalLabel: "Accessories Cost",
            })}

            {renderDynamicSection({
              title: "Special",
              sectionName: "specialItems",
              fields: specialFields,
              items: specialItems,
              sectionErrors: errors.specialItems,
              amountCalculator: calcSpecialAmount,
              appendRow: appendSpecial,
              removeRow: removeSpecial,
              newRow: { ...emptyLineItem, unit: "NOS" },
              total: specialCost,
              totalLabel: "Special Cost",
            })}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register("sellingPrice", {
                setValueAs: toNumberOrZero,
              })}
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
                  <span className="text-slate-600">{fixedStructure ? "SPESIAL Cost" : "Special Cost"}</span>
                  <span className="font-bold">{specialCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2 border-b border-slate-200 pb-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-800 font-bold uppercase">Total Cost</span>
                  <span className="font-bold text-slate-900">
                    {totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-800 font-bold uppercase">Selling Price</span>
                  <span className="font-bold text-slate-900">
                    {(sellingPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
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
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded text-sm font-bold border",
                      profitPct >= 30 && "bg-green-100 text-green-800 border-green-200",
                      profitPct >= 20 && profitPct < 30 && "bg-amber-100 text-amber-800 border-amber-200",
                      profitPct < 20 && "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    {profitPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 sm:px-8 py-4 flex justify-between items-center z-10">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-600 border-slate-300 font-semibold shadow-sm rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            ref={submitBtnRef}
            isLoading={isLoading}
            className="gap-2 rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.28)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)] bg-gradient-to-r from-green-600 to-green-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
              </>
            ) : (
              <>{initialData ? "Save Changes" : "Create Record"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
