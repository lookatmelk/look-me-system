"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShoppingCart,
  Users,
  Tags,
  TrendingUp,
  ArrowUpRight,
  Plus,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Package,
  Store,
  Hash,
  FileText,
  Calendar,
  Activity,
  BarChart3,
  Truck,
  Eye,
  Pencil,
  PieChart as PieChartIcon,
  DollarSign,
  TrendingDown,
  Layers,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import ChequeAlertModal from "@/components/notifications/ChequeAlertModal";

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────
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

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  amount: number;
  paymentDate: string;
  daysBefore: number;
  status: string;
  createdAt: string;
  purchaseRecordId?: {
    _id: string;
    description: string;
    supplierId?: { name: string };
  };
}

interface CostingRecord {
  _id: string;
  designNo: string;
  description: string;
  sellingPrice: number;
  totalCost: number;
  profitPercentage: number;
  createdAt: string;
}

interface Shop {
  _id: string;
  name: string;
  slug: string;
  location?: string;
  manager?: string;
  phone?: string;
  color: string;
  status: "ACTIVE" | "INACTIVE";
}

interface OrderRecord {
  _id: string;
  designNo: string;
  description: string;
  orderDate: string;
  status: string;
  designTotal: number;
  projectedRevenue: number;
  projectedProfit: number;
  shopAllocations: Array<{
    shopId: { _id: string; name: string; color: string };
    qty: number;
  }>;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Configurations
// ─────────────────────────────────────────────────────────────────────────────
const purchaseStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DONE:      { label: "Done",      color: "text-green-600 bg-green-50",  icon: CheckCircle2 },
  PENDING:   { label: "Pending",   color: "text-amber-600 bg-amber-50",  icon: Activity },
  CANCELLED: { label: "Cancelled", color: "text-gray-500 bg-gray-100",   icon: XCircle },
  RETURNED:  { label: "Returned",  color: "text-red-600 bg-red-50",      icon: RotateCcw },
};

const orderStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-600", bg: "bg-amber-500" },
  IN_PRODUCTION: { label: "In Production", color: "text-blue-600", bg: "bg-blue-500" },
  DISPATCHED: { label: "Dispatched", color: "text-violet-600", bg: "bg-violet-500" },
  DELIVERED: { label: "Delivered", color: "text-green-600", bg: "bg-green-500" },
  CANCELLED: { label: "Cancelled", color: "text-slate-500", bg: "bg-slate-500" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Modern Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
  delay = 0,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  trend?: { value: number; label: string };
  delay?: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group animate-fade-in-up overflow-hidden relative"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${accent}`} />
      
      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-2xl font-black text-slate-900 leading-tight mb-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 font-medium">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ml-3 shadow-sm ${accent}`}>
          <Icon style={{ width: 22, height: 22 }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module Navigation Card
// ─────────────────────────────────────────────────────────────────────────────
function ModuleCard({
  title,
  description,
  icon: Icon,
  color,
  count,
  href,
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count?: number;
  href: string;
  delay?: number;
}) {
  return (
    <a
      href={href}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden animate-fade-in-up relative"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className={`h-1.5 w-full ${color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          {count !== undefined && (
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              {count} items
            </span>
          )}
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-slate-700 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-4">{description}</p>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
          <span>Manage</span>
          <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Chart Card
// ─────────────────────────────────────────────────────────────────────────────
function MiniChartCard({
  title,
  data,
  type,
  color,
  valueKey,
  nameKey,
  delay = 0,
}: {
  title: string;
  data: any[];
  type: 'pie' | 'bar' | 'line';
  color: string;
  valueKey: string;
  nameKey: string;
  delay?: number;
}) {
  const COLORS = {
    green: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
    amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
    blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <h3 className="text-sm font-bold text-slate-700 mb-4">{title}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={180}>
          {type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey={valueKey}
                nameKey={nameKey}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={(COLORS as any)[color]?.[index % 4] || COLORS.green[index % 4]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          ) : type === 'bar' ? (
            <BarChart data={data}>
              <XAxis dataKey={nameKey} hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey={valueKey} fill={(COLORS as any)[color]?.[0] || COLORS.green[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis dataKey={nameKey} hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey={valueKey} stroke={(COLORS as any)[color]?.[0] || COLORS.green[0]} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent Item Card
// ─────────────────────────────────────────────────────────────────────────────
function RecentOrderCard({
  order,
  onView,
  delay = 0,
}: {
  order: OrderRecord;
  onView: () => void;
  delay?: number;
}) {
  const statusCfg = orderStatusConfig[order.status] || orderStatusConfig.PENDING;

  return (
    <div
      className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 p-4 animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <FileText className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">#{order.designNo}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{order.description}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusCfg.color} bg-opacity-50`}>
          {statusCfg.label}
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Calendar className="h-3 w-3 text-slate-400" />
        <span>{format(new Date(order.orderDate), "dd MMM yyyy")}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-3 w-3 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{order.designTotal.toLocaleString()} units</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Revenue</p>
          <p className="text-sm font-black text-green-700">LKR {(order.projectedRevenue / 1000).toFixed(1)}k</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [costingRecords, setCostingRecords] = useState<CostingRecord[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Notification alert state
  const [alertNotifications, setAlertNotifications] = useState<NotificationItem[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Load purchasing stats
  useEffect(() => {
    async function load() {
      try {
        const [purchRes, recentRes, supRes, catRes] = await Promise.all([
          axios.get("/api/purchasing"),
          axios.get("/api/purchasing?limit=5"),
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

  // Load dashboard data (limited for overview)
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [costingRes, shopsRes, ordersRes] = await Promise.all([
          axios.get("/api/costing?limit=3&sortBy=createdAt&sortOrder=desc"),
          axios.get("/api/shops?status=ACTIVE"),
          axios.get("/api/orders?limit=4&sortBy=createdAt&sortOrder=desc"),
        ]);

        setCostingRecords(costingRes.data.data || []);
        setShops(shopsRes.data.data || []);
        setOrders(ordersRes.data.data || []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setDashboardLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Notification alerts
  useEffect(() => {
    async function loadNotifications() {
      try {
        await axios.post("/api/notifications/generate");
        const res = await axios.get("/api/notifications?status=UNREAD");
        const unread: NotificationItem[] = res.data.data || [];

        if (unread.length > 0) {
          setAlertNotifications(unread);
          setShowAlert(true);
        }
      } catch {
        // silent
      }
    }
    loadNotifications();
  }, []);

  const handleAlertDismissed = () => {
    setShowAlert(false);
    setAlertNotifications([]);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);

  // Prepare chart data
  const purchaseStatusData = stats ? [
    { name: 'Done', value: stats.doneCount, label: 'DONE' },
    { name: 'Pending', value: stats.pendingCount, label: 'PENDING' },
  ].filter(d => d.value > 0) : [];

  const orderStatusData = orders.reduce((acc, order) => {
    const existing = acc.find(a => a.label === order.status);
    if (existing) {
      existing.value += order.designTotal;
    } else {
      acc.push({
        name: orderStatusConfig[order.status]?.label || order.status,
        value: order.designTotal,
        label: order.status,
      });
    }
    return acc;
  }, [] as { name: string; value: number; label: string }[]);

  const shopAllocationData = shops.slice(0, 5).map(shop => ({
    name: shop.name.length > 12 ? shop.name.substring(0, 12) + '...' : shop.name,
    value: 0, // Would need aggregation from orders
    fullName: shop.name,
  }));

  const OrderDetailModal = require("@/components/orders/OrderDetailModal").default;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cheque Alert Modal */}
      {showAlert && alertNotifications.length > 0 && (
        <ChequeAlertModal
          notifications={alertNotifications}
          onAcknowledged={handleAlertDismissed}
        />
      )}

      {/* Page Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your business performance — navigate to modules for details</p>
      </div>

      {/* ============================================================
          PRIMARY KPI CARDS
          ============================================================ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            title="Total Purchases"
            value={stats?.totalPurchases ?? 0}
            sub={`${stats?.pendingCount} pending`}
            icon={ShoppingCart}
            accent="bg-green-500"
            delay={0}
            trend={{ value: 12, label: '+12% this month' }}
          />
          <StatCard
            title="Total Spend"
            value={stats ? formatCurrency(stats.totalSpend).replace('LKR', 'LKR ') : '—'}
            sub="Across all purchases"
            icon={TrendingUp}
            accent="bg-violet-500"
            delay={80}
          />
          <StatCard
            title="Outstanding"
            value={stats ? formatCurrency(stats.outstandingDebt).replace('LKR', 'LKR ') : '—'}
            sub="Unpaid purchases"
            icon={Wallet}
            accent="bg-rose-500"
            delay={160}
          />
          <StatCard
            title="Active Suppliers"
            value={stats?.totalSuppliers ?? 0}
            sub="Business partners"
            icon={Users}
            accent="bg-sky-500"
            delay={240}
          />
        </div>
      )}

      {/* ============================================================
          MODULE NAVIGATION CARDS
          ============================================================ */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-slate-600" />
              Quick Navigation
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Access all modules — view full data and manage records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <ModuleCard
            title="Purchasing"
            description="Manage fabric & material purchases"
            icon={ShoppingCart}
            color="bg-green-500"
            count={stats?.totalPurchases}
            href="/admin/purchasing"
            delay={0}
          />
          <ModuleCard
            title="Costing"
            description="Design cost analysis & pricing"
            icon={BarChart3}
            color="bg-violet-500"
            count={costingRecords.length}
            href="/admin/costing"
            delay={80}
          />
          <ModuleCard
            title="Shops"
            description="Retail locations & allocations"
            icon={Store}
            color="bg-sky-500"
            count={shops.length}
            href="/admin/shops"
            delay={160}
          />
          <ModuleCard
            title="Orders"
            description="Production & delivery tracking"
            icon={Truck}
            color="bg-amber-500"
            count={orders.length}
            href="/admin/orders"
            delay={240}
          />
        </div>
      </div>

      {/* ============================================================
          CHARTS & ANALYTICS
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Purchase Status Chart */}
        <div
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
          style={{ animationDelay: "280ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Purchase Status Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Completed vs Pending purchases</p>
            </div>
            <button
              onClick={() => router.push("/admin/purchasing")}
              className="text-xs font-bold text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          
          {purchaseStatusData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={180}>
                <PieChart>
                  <Pie
                    data={purchaseStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {purchaseStatusData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={index === 0 ? '#10b981' : '#f59e0b'}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <PieChartIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No purchase data yet</p>
              </div>
            </div>
          )}

          {/* Legend */}
          {purchaseStatusData.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-slate-600">Done</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-slate-600">Pending</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Status Chart */}
        <div
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
          style={{ animationDelay: "320ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Order Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Units by order status</p>
            </div>
            <button
              onClick={() => router.push("/admin/orders")}
              className="text-xs font-bold text-amber-600 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          
          {orderStatusData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={180}>
                <BarChart data={orderStatusData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {orderStatusData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={
                          entry.label === 'DELIVERED' ? '#10b981' :
                          entry.label === 'IN_PRODUCTION' ? '#3b82f6' :
                          entry.label === 'DISPATCHED' ? '#8b5cf6' :
                          entry.label === 'PENDING' ? '#f59e0b' :
                          '#94a3b8'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No order data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          RECENT ORDERS & QUICK STATS
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "360ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Orders</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest 4 production orders</p>
            </div>
            <button
              onClick={() => router.push("/admin/orders")}
              className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg transition-all"
            >
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {dashboardLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Truck className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No orders yet</p>
              <button
                onClick={() => router.push("/admin/orders/add")}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all"
              >
                Create First Order
              </button>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {orders.map((order, idx) => (
                <RecentOrderCard
                  key={order._id}
                  order={order}
                  delay={idx * 50}
                  onView={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
            style={{ animationDelay: "400ms", animationFillMode: "both" }}
          >
            <h2 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "New Purchase", icon: ShoppingCart, href: "/admin/purchasing/add", accent: "bg-green-500" },
                { label: "New Order", icon: Truck, href: "/admin/orders/add", accent: "bg-amber-500" },
                { label: "New Design", icon: BarChart3, href: "/admin/costing/add", accent: "bg-violet-500" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group text-left"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm ${action.accent}`}>
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

          {/* Business Summary */}
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in-up"
            style={{ animationDelay: "440ms", animationFillMode: "both" }}
          >
            <h2 className="text-sm font-bold text-slate-800 mb-3">Business Summary</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Categories</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{stats?.totalCategories ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Avg Purchase</span>
                    <span className="text-xs text-slate-400">(LKR)</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {stats?.totalPurchases ? Math.round(stats.totalSpend / stats.totalPurchases).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Completion Rate</span>
                  </div>
                  <span className="text-sm font-black text-green-700">
                    {stats?.totalPurchases ? Math.round((stats.doneCount / stats.totalPurchases) * 100) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}
      {selectedOrder && (
        <OrderDetailModal
          record={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
