import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Hash, Package, Store, Calendar, FileText, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface OrderDetailModalProps {
  record: any;
  onClose: () => void;
}

export default function OrderDetailModal({ record, onClose }: OrderDetailModalProps) {
  if (!record) return null;

  // ─── Status Color Logic ───
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_PRODUCTION: 'bg-blue-50 text-blue-700 border-blue-200',
    DISPATCHED: 'bg-violet-50 text-violet-700 border-violet-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const displayLabels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PRODUCTION: 'In Production',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Order — Design #${record.designNo}`}
      subtitle={record.description}
      size="lg"
    >
      {/* Revenue Summary Hero */}
      <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Design Total</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {record.designTotal?.toLocaleString() ?? '0'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Projected Revenue</p>
            <p className="text-2xl font-black text-green-700 tracking-tight">
              LKR {record.projectedRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Projected Profit</p>
            <p className="text-2xl font-black tracking-tight" style={{ color: record.projectedProfit >= 0 ? '#15803d' : '#dc2626' }}>
              LKR {record.projectedProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Information */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Information</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <DetailField icon={<Hash className="h-3.5 w-3.5" />} label="Design No" value={record.designNo} />
          <DetailField icon={<Package className="h-3.5 w-3.5" />} label="Description" value={record.description} />
          <DetailField icon={<Calendar className="h-3.5 w-3.5" />} label="Order Date" value={
            record.orderDate ? format(new Date(record.orderDate), 'dd MMM yyyy') : '—'
          } />
          <DetailField icon={<FileText className="h-3.5 w-3.5" />} label="Status" value={
            <span className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
              statusStyles[record.status] || 'bg-slate-100 text-slate-500'
            )}>
              {displayLabels[record.status] || record.status}
            </span>
          } />
        </div>
      </div>

      {/* Shop Allocations Breakdown */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shop Allocations</p>
        <div className="space-y-3">
          {(record.shopAllocations || []).length > 0 ? (
            record.shopAllocations.map((alloc: any) => {
              const qty = alloc.qty || 0;
              const sizes = alloc.sizes || [];
              if (qty === 0 && sizes.length === 0) return null;
              
              // Extract denormalized color if populated, otherwise default
              const shopColor = alloc.shopId?.color || 'blue';
              const shopName = alloc.shopName || alloc.shopId?.name || 'Unknown Shop';

              return (
                <ShopRow
                  key={alloc.shopId?._id || alloc.shopId || Math.random()}
                  shopName={shopName}
                  shopColor={shopColor}
                  qty={qty}
                  sizes={sizes}
                  sellingPrice={record.sellingPrice}
                />
              );
            })
          ) : (
            <div className="text-sm text-slate-500 py-2 italic text-center">No active allocations found for this order.</div>
          )}

          {/* Total Row */}
          {(record.shopAllocations || []).length > 0 && (
            <div className="border-t-2 border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">Design Total</span>
              <span className="text-xl font-black text-green-700 font-mono">
                {record.designTotal?.toLocaleString() ?? '0'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Costing Snapshot */}
      <div className="px-6 py-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Costing Information</p>
        <div className="space-y-2.5">
          <CostRow label="Selling Price (per unit)" value={record.sellingPrice} />
          <CostRow label="Total Cost (per unit)" value={record.totalCost} />
          <div className="border-t border-slate-100 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Profit per unit</span>
            <span className={clsx(
              'font-mono text-sm font-bold',
              (record.sellingPrice - record.totalCost) >= 0 ? 'text-green-700' : 'text-red-600'
            )}>
              LKR {((record.sellingPrice || 0) - (record.totalCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Profit Percentage</span>
            <span className={clsx(
              'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border',
              record.profitPercentage >= 30 && 'bg-green-50 text-green-700 border-green-200',
              record.profitPercentage >= 20 && record.profitPercentage < 30 && 'bg-amber-50 text-amber-700 border-amber-200',
              record.profitPercentage < 20 && 'bg-red-50 text-red-700 border-red-200',
            )}>
              {(record.profitPercentage || 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3 rounded-b-xl">
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// Individual field display
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
      <div className="text-sm font-semibold text-slate-900">{value || '—'}</div>
    </div>
  );
}

// Shop row in allocations breakdown
function ShopRow({
  shopName,
  shopColor,
  qty,
  sizes,
  sellingPrice,
}: {
  shopName: string;
  shopColor: string;
  qty: number;
  sizes: string[];
  sellingPrice: number;
}) {
  return (
    <div className={clsx('flex justify-between items-center px-4 py-3 rounded-lg border', `bg-${shopColor}-50/50 border-${shopColor}-200`)}>
      <div>
        <div className="flex items-center gap-2">
          <Store className={clsx('h-3.5 w-3.5', `text-${shopColor}-700`)} />
          <span className="text-sm font-semibold text-slate-700">{shopName}</span>
        </div>
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {sizes.map(size => (
              <span key={size} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">
                {size}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right">
        <span className={clsx('text-lg font-black font-mono', qty > 0 ? `text-${shopColor}-700` : 'text-slate-300')}>
          {qty > 0 ? qty.toLocaleString() : '—'}
        </span>
        {qty > 0 && (
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            = LKR {(qty * sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>
      {/* Dynamic classes injection */}
      <span className={`hidden bg-${shopColor}-50/50 border-${shopColor}-200 text-${shopColor}-700`} />
    </div>
  );
}

// Cost row in costing section
function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-700">
        LKR {(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}
