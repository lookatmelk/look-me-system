"use client";

import React from "react";
import clsx from "clsx";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

export function Kbd({ children, className, variant = "default" }: KbdProps) {
  return (
    <kbd
      className={clsx(
        "inline-flex items-center justify-center px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all select-none",
        variant === "default" && "bg-white border border-slate-200 text-slate-900 shadow-[0_1.5px_0_rgba(0,0,0,0.08)]",
        variant === "outline" && "bg-transparent border border-white/20 text-white/60",
        variant === "ghost" && "bg-white/5 border border-white/10 text-white/40",
        className
      )}
    >
      {children}
    </kbd>
  );
}
