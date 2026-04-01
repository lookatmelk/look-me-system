"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  FileText,
  CircleDollarSign,
  Store,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Tags,
  Lock,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Purchasing", href: "/admin/purchasing", icon: ShoppingCart },
  { name: "Costing", href: "/admin/costing", icon: CircleDollarSign },
  { name: "Orders", href: "/admin/orders", icon: FileText },
];

const purchasingSubNavigation = [
  { name: "Category", href: "/admin/categories", icon: Tags },
  { name: "Supplier", href: "/admin/suppliers", icon: Users },
];

const inactiveTabs = [
  { name: "Summary", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [isPurchasingExpandedManual, setIsPurchasingExpandedManual] = useState<boolean | null>(null);
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    setIsPurchasingExpandedManual(null);
    setIsShopsExpandedManual(null);
  }, [pathname]);

  // Fetch shops for dynamic sidebar
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch('/api/shops?status=ACTIVE');
        const data = await res.json();
        if (data.success) setShops(data.data);
      } catch {
        // Silent — fallback to empty
      }
    };
    fetchShops();
  }, []);

  const isPurchasingSection =
    pathname.startsWith("/admin/purchasing") ||
    pathname.startsWith("/admin/categories") ||
    pathname.startsWith("/admin/suppliers");
  const isPurchasingExpanded = isPurchasingExpandedManual !== null ? isPurchasingExpandedManual : isPurchasingSection;

  const isShopsSection = pathname.startsWith("/admin/shops");
  const [isShopsExpandedManual, setIsShopsExpandedManual] = useState<boolean | null>(null);
  const isShopsExpanded = isShopsExpandedManual !== null ? isShopsExpandedManual : isShopsSection;

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : session?.user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col h-full transition-all duration-300 ease-in-out relative z-10",
        collapsed ? "w-[68px]" : "w-60"
      )}
      style={{
        background: "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
      }}
    >
      {/* Top: Logo */}
      <div
        className={clsx(
          "flex items-center h-16 px-4 border-b border-white/[0.07] flex-shrink-0 overflow-hidden",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
            >
              <span className="text-base leading-none">@</span>
            </div>
            <span className="text-base font-black tracking-tighter text-white">
              LOOK<span className="text-green-400">@</span>ME
            </span>
          </div>
        )}
        {collapsed && (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-white"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <span className="text-sm leading-none">@</span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-[72px] z-20 h-7 w-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-green-700 hover:border-green-400 transition-all"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-5 px-2.5 space-y-1 overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Navigation
          </p>
        )}

        {navigation.map((item) => {
          const isPurchasingParent = item.href === "/admin/purchasing";
          const isActive = isPurchasingParent
            ? isPurchasingSection
            : pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

          if (isPurchasingParent) {
            return (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => setIsPurchasingExpandedManual(true)}
                  title={collapsed ? item.name : undefined}
                  className={clsx(
                    "group flex items-center rounded-xl transition-all duration-200 ease-in-out relative overflow-hidden",
                    collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 gap-3",
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.07]"
                  )}
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(135deg, rgba(22,163,74,0.22) 0%, rgba(22,163,74,0.10) 100%)",
                          border: "1px solid rgba(22,163,74,0.25)",
                        }
                      : {}
                  }
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-green-400" />
                  )}
                  <item.icon
                    className={clsx(
                      "flex-shrink-0 h-4.5 w-4.5 transition-all",
                      isActive ? "text-green-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                    style={{ width: 18, height: 18 }}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-semibold truncate flex-1">{item.name}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIsPurchasingExpandedManual(!isPurchasingExpanded);
                        }}
                        className={clsx(
                          "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
                          isActive ? "text-green-300 hover:bg-white/10" : "text-slate-500 hover:bg-white/10"
                        )}
                        aria-label="Toggle purchasing menu"
                      >
                        <ChevronDown
                          className={clsx(
                            "h-4 w-4 transition-transform duration-200",
                            isPurchasingExpanded ? "rotate-180" : "rotate-0"
                          )}
                        />
                      </button>
                    </>
                  )}
                </Link>

                {!collapsed && isPurchasingExpanded && (
                  <div className="ml-5 pl-3 border-l border-white/10 space-y-1.5 animate-fade-in">
                    {purchasingSubNavigation.map((subItem) => {
                      const isSubActive = pathname.startsWith(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={clsx(
                            "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200",
                            isSubActive
                              ? "text-white bg-white/10 border border-white/10"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <subItem.icon
                            className={clsx(
                              "h-3.5 w-3.5",
                              isSubActive ? "text-green-400" : "text-slate-500 group-hover:text-slate-300"
                            )}
                          />
                          <span className="font-medium">{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={clsx(
                "group flex items-center rounded-xl transition-all duration-200 ease-in-out relative overflow-hidden",
                collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 gap-3",
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.07]"
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(22,163,74,0.22) 0%, rgba(22,163,74,0.10) 100%)",
                      border: "1px solid rgba(22,163,74,0.25)",
                    }
                  : {}
              }
            >
              {/* Active glow dot */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-green-400" />
              )}
              <item.icon
                className={clsx(
                  "flex-shrink-0 h-4.5 w-4.5 transition-all",
                  isActive ? "text-green-400" : "text-slate-500 group-hover:text-slate-300"
                )}
                style={{ width: 18, height: 18 }}
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        {/* ── SHOPS SECTION ── */}
        {shops.length > 0 && (
          <div className="space-y-1 mt-6">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                Shops
              </p>
            )}
            {/* Shops Parent */}
            <Link
              href="/admin/shops"
              onClick={() => setIsShopsExpandedManual(true)}
              className={clsx(
                "group flex items-center rounded-xl transition-all duration-200 ease-in-out relative overflow-hidden",
                collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 gap-3",
                isShopsSection ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.07]"
              )}
              style={isShopsSection ? {
                background: 'linear-gradient(135deg, rgba(22,163,74,0.22) 0%, rgba(22,163,74,0.10) 100%)',
                border: '1px solid rgba(22,163,74,0.25)',
              } : {}}
            >
              {isShopsSection && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-green-400" />
              )}
              <Store className={clsx(
                "flex-shrink-0 transition-all",
                isShopsSection ? "text-green-400" : "text-slate-500 group-hover:text-slate-300"
              )} style={{ width: 18, height: 18 }} />
              {!collapsed && (
                <>
                  <span className="text-sm font-semibold truncate flex-1">Shops</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsShopsExpandedManual(!isShopsExpanded); }}
                    className={clsx(
                      'h-6 w-6 rounded-md flex items-center justify-center transition-colors',
                      isShopsSection ? 'text-green-300 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'
                    )}
                  >
                    <ChevronDown className={clsx('h-4 w-4 transition-transform duration-200', isShopsExpanded ? 'rotate-180' : 'rotate-0')} />
                  </button>
                </>
              )}
            </Link>

            {/* Sub-Navigation: Individual Shops */}
            {!collapsed && isShopsExpanded && (
              <div className="ml-5 pl-3 border-l border-white/10 space-y-1.5 animate-fade-in">
                {shops.map(shop => {
                  const shopHref = `/admin/shops/${shop.slug}`;
                  const isSubActive = pathname === shopHref;
                  return (
                    <Link
                      key={shop._id}
                      href={shopHref}
                      className={clsx(
                        'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200',
                        isSubActive
                          ? 'text-white bg-white/10 border border-white/10'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Store className={clsx('h-3.5 w-3.5', isSubActive ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300')} />
                      <span className="font-medium">{shop.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Coming soon */}
        <div className={clsx("mt-6", !collapsed && "border-t border-white/[0.06] pt-5")}>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
              Coming Soon
            </p>
          )}
          {inactiveTabs.map((item) => (
            <div
              key={item.name}
              title={collapsed ? item.name : undefined}
              className={clsx(
                "flex items-center rounded-xl text-slate-600 cursor-not-allowed select-none",
                collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 gap-3"
              )}
            >
              <item.icon
                className="flex-shrink-0 text-slate-700"
                style={{ width: 18, height: 18 }}
                aria-hidden="true"
              />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.name}</span>
                  <Lock style={{ width: 12, height: 12 }} className="text-slate-700" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: User + sign out */}
      <div className="flex-shrink-0 border-t border-white/[0.07] p-3">
        <div
          className={clsx(
            "flex items-center rounded-xl p-2 gap-3",
            collapsed ? "justify-center" : ""
          )}
        >
          {/* Avatar */}
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}
          >
            {initials}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/[0.07]"
                title="Sign out"
              >
                <LogOut style={{ width: 15, height: 15 }} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
