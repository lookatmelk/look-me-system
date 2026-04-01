import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Hash, Package, Ruler } from "lucide-react";
import clsx from "clsx";

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span className="text-slate-300">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">{value || "—"}</div>
    </div>
  );
}

function CostRow({
  label,
  value,
  highlight = false,
  bold = false,
  suffix = "",
}: {
  label: string;
  value: number;
  highlight?: boolean;
  bold?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span
        className={clsx(
          "text-sm",
          bold
            ? "font-bold text-slate-800 uppercase tracking-wider text-xs"
            : "text-slate-500"
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          "font-mono text-sm",
          highlight ? "font-bold text-slate-900" : "font-semibold text-slate-700",
          bold && "text-base font-black text-red-700"
        )}
      >
        {value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
        {suffix}
      </span>
    </div>
  );
}

function CategorySection({
  title,
  items,
  subtotal,
  note,
}: {
  title: string;
  items: any[];
  subtotal: number;
  note?: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {note && <span className="text-[10px] text-slate-400 font-medium">{note}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="text-left py-1 pr-3">Type</th>
              <th className="text-left py-1 pr-3">Description</th>
              <th className="text-left py-1 pr-3">Unit</th>
              <th className="text-right py-1 pr-3">Rate</th>
              <th className="text-right py-1 pr-3">CON</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} className="border-t border-slate-50">
                <td className="py-1.5 pr-3 font-semibold text-slate-700">{item.type}</td>
                <td className="py-1.5 pr-3 text-slate-600">{item.description || '—'}</td>
                <td className="py-1.5 pr-3 text-slate-500 font-mono text-xs">{item.unit}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-slate-700">
                  {item.rate?.toFixed(2)}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono text-slate-700">
                  {item.consumption?.toFixed(item.consumption < 1 ? 4 : 2)}
                </td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                  {item.amount?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td colSpan={5} className="py-2 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-3">
                Subtotal
              </td>
              <td className="py-2 text-right font-mono font-black text-slate-900">
                {subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function CostingDetailModal({
  record,
  onClose,
}: {
  record: any;
  onClose: () => void;
}) {
  if (!record) return null;

  // ─── Profit Color Logic ───
  const profitColorClasses = (() => {
    const pct = record.profitPercentage || 0;
    if (pct >= 30) return "bg-green-50 text-green-700 border-green-200";
    if (pct >= 20) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  })();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Design #${record.designNo}`}
      subtitle={record.description}
      size="lg"
    >
      {/* Cost Summary Hero */}
      <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Cost */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Cost
            </p>
            <p className="text-2xl font-black text-red-700 tracking-tight">
              LKR{" "}
              {record.totalCost?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }) ?? "0.00"}
            </p>
          </div>

          {/* Selling Price */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Selling Price
            </p>
            <p className="text-2xl font-black text-green-700 tracking-tight">
              LKR{" "}
              {record.sellingPrice?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }) ?? "0.00"}
            </p>
          </div>

          {/* Profit */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Profit
            </p>
            <p
              className="text-2xl font-black tracking-tight"
              style={{ color: record.grossProfit >= 0 ? "#15803d" : "#dc2626" }}
            >
              LKR{" "}
              {record.grossProfit?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }) ?? "0.00"}
            </p>
            <span
              className={clsx(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-1 border",
                profitColorClasses
              )}
            >
              {record.profitPercentage?.toFixed(2) ?? "0.00"}%
            </span>
          </div>
        </div>
      </div>

      {/* Design Information */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Design Information
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <DetailField
            icon={<Hash className="w-4 h-4" />}
            label="Design No"
            value={record.designNo}
          />
          <DetailField
            icon={<Package className="w-4 h-4" />}
            label="Design Description"
            value={record.description}
          />
          <DetailField
            icon={<Ruler className="w-4 h-4" />}
            label="Sizes"
            value={
              <div className="flex flex-wrap gap-1.5">
                {(record.sizes || []).map((size: string) => (
                  <span
                    key={size}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                  >
                    {size}
                  </span>
                ))}
              </div>
            }
          />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="px-6 py-5 border-b border-slate-100 space-y-6">
        <CategorySection
          title="Sewing"
          items={record.sewingItems}
          subtotal={record.sewingCost}
        />
        <CategorySection
          title="Fabric"
          items={record.fabricItems}
          subtotal={record.fabricCost}
          note="(incl. 5% wastage)"
        />
        <CategorySection
          title="Accessories"
          items={record.accessoriesItems}
          subtotal={record.accessoriesCost}
        />
        <CategorySection
          title="Special"
          items={record.specialItems}
          subtotal={record.specialCost}
        />
      </div>
      
      {/* Grand Total */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Grand Total</p>
        <div className="space-y-2.5">
          <CostRow label="Sewing Cost" value={record.sewingCost} />
          <CostRow label="Fabric Cost" value={record.fabricCost} />
          <CostRow label="Accessories Cost" value={record.accessoriesCost} />
          <CostRow label="Special Cost" value={record.specialCost} />
          <div className="border-t border-slate-200 my-2" />
          <CostRow label="TOTAL COST" value={record.totalCost} highlight bold />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
