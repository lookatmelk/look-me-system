import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Hash, Package, Ruler, Scissors } from "lucide-react";
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
            label="Description"
            value={record.description}
          />
          <DetailField
            icon={<Ruler className="w-4 h-4" />}
            label="Size"
            value={
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {record.size}
              </span>
            }
          />
          <DetailField
            icon={<Scissors className="w-4 h-4" />}
            label="Fabric (Category)"
            value={record.fabric}
          />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Cost Breakdown
        </p>
        <div className="space-y-2.5">
          <CostRow label="Fabric Price" value={record.fabricPrice} />
          <CostRow
            label="Fabric Consumption"
            value={record.fabricConsumption}
            suffix=""
          />
          <CostRow label="Fabric Cost" value={record.fabricCost} highlight />
          <div className="border-t border-slate-100 my-2" />
          <CostRow label="Print / Belt" value={record.printBelt} />
          <CostRow
            label="Thread / Labels / Polly Bags"
            value={record.threadLabelsPollyBags}
          />
          <CostRow
            label="Fusing / Elastic / Button / Zip"
            value={record.fusingElasticButtonZip}
          />
          <CostRow
            label="Standard Minutes Value"
            value={record.standardMinutesValue}
            suffix=""
          />
          <div className="border-t border-slate-100 my-2" />
          <CostRow label="Sewing Cost" value={record.sewingCost} />
          <CostRow label="Accessories Cost" value={record.accessoriesCost} />
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
