"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, subtitle, children }: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen && !visible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative z-10 flex flex-col h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 id="drawer-title" className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full p-1 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
