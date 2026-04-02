"use client";

import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  useGlobalShortcuts();
  return <>{children}</>;
}
