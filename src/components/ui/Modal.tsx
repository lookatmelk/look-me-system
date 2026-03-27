"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, subtitle, size = 'md', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll & handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (typeof window === 'undefined' || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          'relative z-10 w-full bg-white shadow-2xl flex flex-col',
          'max-h-[92dvh] sm:max-h-[90vh]',
          // Mobile: bottom sheet rounding; Desktop: floating card rounding
          'rounded-t-2xl sm:rounded-2xl',
          sizeClasses[size],
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900 leading-snug">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
