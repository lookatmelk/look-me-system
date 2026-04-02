"use client";

import { Keyboard } from "lucide-react";
import { Kbd } from "./Kbd";

type FormKeyboardHintsProps = {
  className?: string;
};

export function FormKeyboardHints({ className = "" }: FormKeyboardHintsProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-8 gap-y-3 px-1 py-2 ${className}`}
      role="note"
      aria-label="Keyboard shortcuts"
    >
      <div className="flex items-center gap-2 text-slate-400 mr-1">
        <Keyboard className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">Workflow</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Kbd>Enter</Kbd>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Kbd>Shift</Kbd>
          <span className="text-[10px] text-slate-300 font-black">+</span>
          <Kbd>Enter</Kbd>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Back</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Kbd>⌘</Kbd>
          <span className="text-[10px] text-slate-300 font-black">+</span>
          <Kbd>Enter</Kbd>
        </div>
        <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.05em]">Quick Save</span>
      </div>
    </div>
  );
}
