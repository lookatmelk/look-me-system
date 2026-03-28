"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShoppingCart,
  Users,
  Tags,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface Stats {
  totalPurchases: number;
  totalSpend: number;
  totalSuppliers: number;
  totalCategories: number;
  pendingCount: number;
  doneCount: number;
  outstandingDebt: number;
}

interface RecentRecord {
  _id: string;
  buyDate: string;
  description: string;
  amount: number;
  status: string;
  supplierId?: { name: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DONE:      { label: "Done",      color: "text-green-600 bg-green-50",  icon: CheckCircle2 },
  PENDING:   { label: "Pending",   color: "text-amber-600 bg-amber-50",  icon: Clock },
  CANCELLED: { label: "Cancelled", color: "text-gray-500 bg-gray-100",   icon: XCircle },
  RETURNED:  { label: "Returned",  color: "text-red-600 bg-red-50",      icon: RotateCcw },
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  delay = 0,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  delay?: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group animate-fade-in-up overflow-hidden relative"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Decorative gradient blob */}
      <div
        className={clsx("absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity", accent)}
        style={{ filter: "blur(12px)" }}
      />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-md font-black text-slate-900 break-words leading-tight">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={clsx("h-11 w-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 ml-3", accent)}>
          <Icon style={{ width: 20, height: 20 }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [purchRes, recentRes, supRes, catRes] = await Promise.all([
          axios.get("/api/purchasing"),
          axios.get("/api/purchasing?limit=6"),
          axios.get("/api/suppliers"),
          axios.get("/api/categories"),
        ]);

        const records: RecentRecord[] = purchRes.data.data || [];
        const latestRecords: RecentRecord[] = recentRes.data.data || [];
        const suppliers = supRes.data.data || [];
        const categories = catRes.data.data || [];

        const totalSpend = records.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
        const pendingCount = records.filter((r: any) => r.status === "PENDING").length;
        const doneCount = records.filter((r: any) => r.status === "DONE").length;
        const outstandingDebt = records
          .filter((r: any) => r.status === "PENDING")
          .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

        setStats({
          totalPurchases: records.length,
          totalSpend,
          totalSuppliers: suppliers.length,
          totalCategories: categories.length,
          pendingCount,
          doneCount,
          outstandingDebt,
        });

        setRecent(latestRecords);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Page Title */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back — here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 stagger-children">
          <StatCard
            title="Total Records"
            value={stats?.totalPurchases ?? 0}
            sub={`${stats?.pendingCount} pending`}
            icon={ShoppingCart}
            accent="bg-green-500"
            delay={0}
          />
          <StatCard
            title="Total Spend"
            value={stats ? formatCurrency(stats.totalSpend) : "—"}
            sub="Across all purchases"
            icon={TrendingUp}
            accent="bg-violet-500"
            delay={60}
          />
          <StatCard
            title="Outstanding"
            value={stats ? formatCurrency(stats.outstandingDebt) : "—"}
            sub={`${stats?.pendingCount ?? 0} unpaid record${(stats?.pendingCount ?? 0) !== 1 ? 's' : ''}`}
            icon={Wallet}
            accent="bg-rose-500"
            delay={120}
          />
          <StatCard
            title="Suppliers"
            value={stats?.totalSuppliers ?? 0}
            sub="Active vendors"
            icon={Users}
            accent="bg-sky-500"
            delay={180}
          />
          <StatCard
            title="Categories"
            value={stats?.totalCategories ?? 0}
            sub="Product types"
            icon={Tags}
            accent="bg-amber-500"
            delay={240}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Purchases</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest 6 records</p>
            </div>
            <button
              onClick={() => router.push("/admin/purchasing")}
              className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-all"
            >
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No purchase records yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent.map((rec) => {
                const sc = statusConfig[rec.status] ?? statusConfig["PENDING"];
                const StatusIcon = sc.icon;
                return (
                  <div
                    key={rec._id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/admin/purchasing/${rec._id}/edit`)}
                  >
                    <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", sc.color)}>
                      <StatusIcon style={{ width: 15, height: 15 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{rec.description}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {rec.supplierId?.name ?? "Unknown"} · {format(new Date(rec.buyDate), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">
                        {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(rec.amount)}
                      </p>
                      <span className={clsx("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full", sc.color)}>
                        {sc.label}
                      </span>
                    </div>
                    <ChevronRight
                      style={{ width: 14, height: 14 }}
                      className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions + Status Breakdown */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
            style={{ animationDelay: "250ms", animationFillMode: "both" }}
          >
            <h2 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Add Purchase Record", icon: ShoppingCart, href: "/admin/purchasing/add", accent: "bg-green-500" },
                { label: "Manage Suppliers", icon: Users, href: "/admin/suppliers", accent: "bg-sky-500" },
                { label: "Manage Categories", icon: Tags, href: "/admin/categories", accent: "bg-amber-500" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group text-left"
                >
                  <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center text-white flex-shrink-0", action.accent)}>
                    <action.icon style={{ width: 15, height: 15 }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">
                    {action.label}
                  </span>
                  <ArrowUpRight
                    style={{ width: 14, height: 14 }}
                    className="text-slate-300 group-hover:text-slate-500 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            <h2 className="text-sm font-bold text-slate-800 mb-3">Purchase Status</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {(["DONE", "PENDING", "CANCELLED", "RETURNED"] as const).map((s) => {
                  const sc = statusConfig[s];
                  const count =
                    s === "DONE" ? stats?.doneCount ?? 0
                    : s === "PENDING" ? stats?.pendingCount ?? 0
                    : 0;
                  const total = stats?.totalPurchases || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", sc.color)}>
                          {sc.label}
                        </span>
                        <span className="text-xs font-bold text-slate-600">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full transition-all duration-700",
                            s === "DONE" ? "bg-green-400"
                            : s === "PENDING" ? "bg-amber-400"
                            : s === "CANCELLED" ? "bg-slate-300"
                            : "bg-red-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
