"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function showToast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
};

const styleMap: Record<ToastType, string> = {
  success: "bg-white border-l-4 border-green-500",
  error:   "bg-white border-l-4 border-red-500",
  warning: "bg-white border-l-4 border-amber-500",
};

const iconColorMap: Record<ToastType, string> = {
  success: "text-green-500",
  error:   "text-red-500",
  warning: "text-amber-500",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={clsx(
              "flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg pointer-events-auto animate-slide-toast",
              styleMap[toast.type]
            )}
          >
            <Icon className={clsx("h-5 w-5 flex-shrink-0 mt-0.5", iconColorMap[toast.type])} />
            <p className="text-sm font-medium text-slate-800 flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
