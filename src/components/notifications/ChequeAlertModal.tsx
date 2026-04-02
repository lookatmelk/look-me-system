"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  User,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import axios from "axios";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  amount: number;
  paymentDate: string;
  daysBefore: number;
  status: string;
  createdAt: string;
  purchaseRecordId?: {
    _id: string;
    description: string;
    supplierId?: { name: string };
  };
}

interface ChequeAlertModalProps {
  notifications: NotificationItem[];
  onAcknowledged: () => void;
}

export default function ChequeAlertModal({
  notifications,
  onAcknowledged,
}: ChequeAlertModalProps) {
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      setAcknowledging(id);
      try {
        await axios.patch(`/api/notifications/${id}/acknowledge`);
        const remaining = items.filter((n) => n._id !== id);
        setItems(remaining);
        if (remaining.length === 0) {
          onAcknowledged();
        }
      } catch {
        // silent
      } finally {
        setAcknowledging(null);
      }
    },
    [items, onAcknowledged]
  );

  const handleAcknowledgeAll = useCallback(async () => {
    setAcknowledging("all");
    try {
      await Promise.all(
        items.map((n) => axios.patch(`/api/notifications/${n._id}/acknowledge`))
      );
      setItems([]);
      onAcknowledged();
    } catch {
      // silent
    } finally {
      setAcknowledging(null);
    }
  }, [items, onAcknowledged]);

  const handleClose = useCallback(() => {
    handleAcknowledgeAll();
  }, [handleAcknowledgeAll]);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        panel.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleAcknowledgeAll();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [handleAcknowledgeAll]);

  if (items.length === 0) return null;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(n);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 opacity-100"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cheque-alert-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={clsx(
          "relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden",
          "max-h-[92dvh] sm:max-h-[85vh]",
          "rounded-t-2xl sm:rounded-2xl",
          "transition-all duration-300 ease-out",
          "translate-y-0 scale-100"
        )}
      >
        {/* Gradient header accent */}
        <div
          className="h-1.5 w-full flex-shrink-0"
          style={{
            background:
              "linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #f59e0b 100%)",
          }}
        />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start gap-4 flex-shrink-0">
          {/* Warning icon with pulse */}
          <div className="relative flex-shrink-0">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.10) 100%)",
              }}
            >
              <AlertTriangle
                className="text-amber-500"
                style={{ width: 22, height: 22 }}
              />
            </div>
            {/* Pulse ring */}
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 ring-[3px] ring-white flex items-center justify-center">
              <span className="text-[8px] font-bold text-white leading-none">
                {items.length}
              </span>
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="cheque-alert-title"
              className="text-lg font-black text-slate-900 leading-snug"
            >
              Payment{items.length > 1 ? "s" : ""} Reminder
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {items.length} upcoming cheque payment{items.length > 1 ? "s" : ""}{" "}
              require{items.length === 1 ? "s" : ""} your attention
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Dismiss all"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">
          <div className="space-y-3">
            {items.map((notification, index) => {
              const isUrgent = notification.daysBefore === 1;
              const supplierName =
                notification.purchaseRecordId?.supplierId?.name ??
                "Unknown Supplier";
              const description =
                notification.purchaseRecordId?.description ?? "Payment";

              return (
                <div
                  key={notification._id}
                  className={clsx(
                    "rounded-xl border p-4 transition-all duration-300",
                    isUrgent
                      ? "border-red-200 bg-red-50/50"
                      : "border-amber-200 bg-amber-50/40"
                  )}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    animationFillMode: "both",
                  }}
                >
                  {/* Urgency badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        isUrgent
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {isUrgent ? "⚡ Due Tomorrow" : `${notification.daysBefore} Days Left`}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(notification.createdAt), "dd MMM, h:mm a")}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard
                        className="text-slate-400 flex-shrink-0"
                        style={{ width: 14, height: 14 }}
                      />
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <User
                        className="text-slate-400 flex-shrink-0"
                        style={{ width: 14, height: 14 }}
                      />
                      <p className="text-xs text-slate-500">{supplierName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar
                          className="text-slate-400 flex-shrink-0"
                          style={{ width: 14, height: 14 }}
                        />
                        <p className="text-xs text-slate-500">
                          {format(new Date(notification.paymentDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <p
                        className={clsx(
                          "text-sm font-black",
                          isUrgent ? "text-red-700" : "text-amber-700"
                        )}
                      >
                        {formatCurrency(notification.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Acknowledge button */}
                  <button
                    onClick={() => handleAcknowledge(notification._id)}
                    disabled={acknowledging === notification._id || acknowledging === "all"}
                    className={clsx(
                      "mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      isUrgent
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-amber-500 hover:bg-amber-600 text-white",
                      (acknowledging === notification._id || acknowledging === "all") &&
                        "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {acknowledging === notification._id ? (
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check style={{ width: 15, height: 15 }} />
                    )}
                    Acknowledge
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {items.length > 1 && (
          <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4">
            <button
              onClick={handleAcknowledgeAll}
              disabled={acknowledging === "all"}
              className={clsx(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                "bg-slate-900 hover:bg-slate-800 text-white",
                acknowledging === "all" && "opacity-60 cursor-not-allowed"
              )}
            >
              {acknowledging === "all" ? (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check style={{ width: 15, height: 15 }} />
                  Acknowledge All ({items.length})
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
