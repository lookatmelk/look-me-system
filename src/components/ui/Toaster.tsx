"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(type: ToastType, message: string) {
  const toast: Toast = { id: Math.random().toString(36).slice(2), type, message };
  toastListeners.forEach((listener) => listener(toast));
}

export function Toaster() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => {
    setMounted(true);
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            toast.type === 'success'
              ? 'bg-white border-green-200 text-green-800'
              : 'bg-white border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          }
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
