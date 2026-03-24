"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Users,
  Tags,
  Shirt,
  FileText,
  CircleDollarSign,
  Store,
  BarChart
} from "lucide-react";
import clsx from "clsx";

const navigation = [
  { name: "Purchasing", href: "/admin/purchasing", icon: ShoppingCart },
  { name: "Suppliers", href: "/admin/suppliers", icon: Users },
  { name: "Categories", href: "/admin/categories", icon: Tags },
];

const inactiveTabs = [
  { name: "Orders", icon: FileText },
  { name: "Costing", icon: CircleDollarSign },
  { name: "Shop 1", icon: Store },
  { name: "Shop 2", icon: Store },
  { name: "Shop 3", icon: Store },
  { name: "Summary", icon: BarChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-[var(--color-border)] h-full shadow-sm z-10 hidden md:flex">
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Active Modules
          </p>
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-md shadow-green-200"
                    : "text-gray-600 hover:bg-green-50 hover:text-[var(--color-primary)]",
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out"
                )}
              >
                <item.icon
                  className={clsx(
                    isActive ? "text-white" : "text-gray-400 group-hover:text-[var(--color-primary)]",
                    "flex-shrink-0 mr-3 h-5 w-5 transition-colors"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}

          <div className="mt-8">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Coming Soon
            </p>
            <div className="space-y-1">
              {inactiveTabs.map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-400 cursor-not-allowed opacity-70"
                >
                  <Shirt className="flex-shrink-0 mr-3 h-5 w-5 text-gray-300" aria-hidden="true" />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
