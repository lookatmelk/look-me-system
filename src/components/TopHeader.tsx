"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

const crumbMap: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  purchasing: "Purchasing",
  suppliers: "Suppliers",
  categories: "Categories",
  add: "Add New",
  edit: "Edit",
};

export default function TopHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, i) => ({
      label: crumbMap[seg] ?? seg,
      href: "/" + segments.slice(0, i + 1).join("/"),
      isLast: i === segments.length - 1,
    }));
  }, [pathname]);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : session?.user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <header
      className="z-20 px-6 flex items-center justify-between h-16 sticky top-0 flex-shrink-0"
      style={{
        background: "rgba(240, 244, 248, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-slate-300 font-light select-none">/</span>
            )}
            <span
              className={
                crumb.isLast
                  ? "font-bold text-slate-800"
                  : "text-slate-400 font-medium hover:text-slate-600 transition-colors cursor-default"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell style={{ width: 17, height: 17 }} />
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"
            aria-hidden="true"
          />
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-700 leading-none">
              {session?.user?.name ?? "Admin"}
            </p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5 max-w-[120px] truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
