"use client";

import { Search, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function TopHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-sm z-20 border-b border-[var(--color-border)] px-6 flex items-center justify-between h-16 sticky top-0">
      {/* Logo */}
      <div className="flex items-center space-x-2 w-56 flex-shrink-0">
        <div className="h-8 w-8 bg-[var(--color-primary)] text-white flex items-center justify-center font-bold font-sans rounded shadow-[0_2px_8px_rgba(22,163,74,0.3)]">
          <span className="text-xl leading-none font-black">@</span>
        </div>
        <span className="text-xl font-black tracking-tighter text-gray-900">
          LOOK<span className="text-[var(--color-primary)]">@</span>ME
        </span>
      </div>

      {/* Search Bar */}
      <div className="flex-1 flex px-6 max-w-2xl mx-auto hidden sm:flex">
        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            className="block w-full border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 bg-gray-50/50 rounded-full focus:outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all shadow-inner"
            placeholder="Search records, suppliers, categories..."
            type="search"
          />
        </div>
      </div>

      {/* User & Logout */}
      <div className="flex items-center gap-3 ml-4">
        {session?.user && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
              <User className="h-4 w-4 text-green-700" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {session.user.name || session.user.email}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Sign out</span>
        </button>
      </div>
    </header>
  );
}
