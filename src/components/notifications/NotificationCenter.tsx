"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  User,
  Clock,
  Inbox,
} from "lucide-react";
import clsx from "clsx";
import { format, formatDistanceToNow } from "date-fns";
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

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onCountChange,
}: NotificationCenterProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen]);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/notifications");
      const data: NotificationItem[] = res.data.data || [];
      setNotifications(data);
      onCountChange?.(data.filter((n) => n.status !== "READ").length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      setMarkingRead(id);
      try {
        await axios.patch(`/api/notifications/${id}/read`);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        onCountChange?.(
          notifications.filter((n) => n._id !== id && n.status !== "READ")
            .length
        );
      } catch {
        // silent
      } finally {
        setMarkingRead(null);
      }
    },
    [notifications, onCountChange]
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingRead("all");
    try {
      await axios.patch("/api/notifications/read-all");
      setNotifications([]);
      onCountChange?.(0);
    } catch {
      // silent
    } finally {
      setMarkingRead(null);
    }
  }, [onCountChange]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(n);

  if (!mounted) return null;
  if (!isOpen && !visible) return null;

  const unreadItems = notifications.filter((n) => n.status !== "READ");
  const displayedItems = activeTab === "unread" ? unreadItems : notifications;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          "relative z-10 flex flex-col h-full w-full max-w-[420px] bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex flex-col px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0 bg-white">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(5,150,105,0.08) 100%)",
                }}
              >
                <Bell
                  className="text-green-600"
                  style={{ width: 18, height: 18 }}
                />
              </div>
              <div>
                <h2
                  id="notification-center-title"
                  className="text-base font-bold text-slate-900 leading-snug"
                >
                  Inbox
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {unreadItems.length > 0
                    ? `${unreadItems.length} unread`
                    : "All caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadItems.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingRead === "all"}
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck style={{ width: 16, height: 16 }} />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close notifications"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100/70 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={clsx(
                "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={clsx(
                "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5",
                activeTab === "unread"
                  ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              Unread
              {unreadItems.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unreadItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(226,232,240,0.5) 0%, rgba(241,245,249,0.8) 100%)",
                }}
              >
                <Inbox
                  className="text-slate-300"
                  style={{ width: 36, height: 36 }}
                />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">
                You&apos;re all caught up!
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                No pending payment reminders. New cheque payment alerts will
                appear here.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {displayedItems.map((notification, index) => {
                const isUrgent = notification.daysBefore === 1;
                const isUnread = notification.status !== "READ";
                const supplierName =
                  notification.purchaseRecordId?.supplierId?.name ??
                  "Unknown Supplier";
                const description =
                  notification.purchaseRecordId?.description ?? "Payment";

                return (
                  <div
                    key={notification._id}
                    className={clsx(
                      "relative px-6 py-4 transition-all duration-200 group border-b border-slate-100",
                      isUnread
                        ? "bg-white hover:bg-slate-50/80"
                        : "bg-slate-50/50 hover:bg-slate-100/50 opacity-70 hover:opacity-100"
                    )}
                  >
                    {/* Unread indicator */}
                    {isUnread && (
                      <span
                        className={clsx(
                          "absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ring-2 ring-white shadow-sm",
                          isUrgent ? "bg-red-500" : "bg-orange-500"
                        )}
                      />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={clsx(
                          "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                          isUnread
                            ? isUrgent
                              ? "bg-red-50 text-red-500"
                              : "bg-orange-50 text-orange-500"
                            : "bg-slate-200 text-slate-400"
                        )}
                      >
                        <CreditCard style={{ width: 16, height: 16 }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className={clsx(
                              "text-sm leading-snug truncate",
                              isUnread
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-700"
                            )}
                          >
                            {notification.title}
                          </p>
                          <span
                            className={clsx(
                              "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0",
                              isUnread
                                ? isUrgent
                                  ? "bg-red-100 text-red-600"
                                  : "bg-orange-100 text-orange-600"
                                : "bg-slate-200 text-slate-500"
                            )}
                          >
                            {isUrgent
                              ? "Urgent"
                              : `${notification.daysBefore}d left`}
                          </span>
                        </div>

                        {/* Details row */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-1.5">
                          <span className="flex items-center gap-1 truncate">
                            <User style={{ width: 11, height: 11 }} />
                            {supplierName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar style={{ width: 11, height: 11 }} />
                            {format(
                              new Date(notification.paymentDate),
                              "dd MMM"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p
                            className={clsx(
                              "text-sm font-black transition-colors",
                              isUnread
                                ? isUrgent
                                  ? "text-red-600"
                                  : "text-orange-600"
                                : "text-slate-500"
                            )}
                          >
                            {formatCurrency(notification.amount)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock style={{ width: 10, height: 10 }} />
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                            {isUnread && (
                              <button
                                onClick={() => handleMarkRead(notification._id)}
                                disabled={
                                  markingRead === notification._id ||
                                  markingRead === "all"
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-green-600 p-1.5 rounded-md hover:bg-green-100"
                                title="Mark as read"
                              >
                                {markingRead === notification._id ? (
                                  <span className="h-3.5 w-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin block" />
                                ) : (
                                  <Check style={{ width: 14, height: 14 }} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description sub-line */}
                        <p className={clsx("text-[11px] mt-1.5 line-clamp-2", isUnread ? "text-slate-500" : "text-slate-400")}>
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {displayedItems.length > 0 && (
          <div className="flex-shrink-0 border-t border-slate-100 px-6 py-3 bg-white">
            <p className="text-[11px] font-medium text-slate-400 text-center">
              Showing {displayedItems.length} {activeTab === "unread" ? "unread " : ""}notification
              {displayedItems.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
