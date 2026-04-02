"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Search, Keyboard } from "lucide-react";
import NotificationCenter from "./notifications/NotificationCenter";
import { Kbd } from "./ui/Kbd";
import { Modal } from "./ui/Modal";

export default function TopHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' key if not already focusing an input
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <header
        className={`h-16 flex items-center justify-between px-8 border-b transition-all duration-200 z-30 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md border-slate-200 shadow-sm"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 group focus-within:border-green-500 focus-within:bg-white transition-all w-72">
            <Search className="w-4 h-4 group-focus-within:text-green-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Quick search..."
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-full text-slate-600 placeholder:text-slate-400"
            />
            <Kbd variant="default" className="ml-auto opacity-50 group-focus-within:opacity-100 uppercase">
              /
            </Kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          
          <div className="h-8 w-px bg-slate-100 mx-1" />
          
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            
            <NotificationCenter 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)}
              onCountChange={setUnreadCount}
            />
          </div>
        </div>
      </header>

      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Keyboard Shortcuts"
      >
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Navigation</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "D", label: "Dashboard" },
                { key: "P", label: "Purchasing" },
                { key: "C", label: "Costing" },
                { key: "O", label: "Orders" },
                { key: "S", label: "Shops" },
                { key: "Q", label: "Logout" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <Kbd>Alt</Kbd>
                    <span className="text-[10px] text-slate-300 font-bold">+</span>
                    <Kbd>{item.key}</Kbd>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Data Entry</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Next Field</span>
                <Kbd>Enter</Kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Previous Field</span>
                <div className="flex items-center gap-1.5">
                  <Kbd>Shift</Kbd>
                  <span className="text-[10px] text-slate-300 font-bold">+</span>
                  <Kbd>Enter</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Submit / Save Form</span>
                <div className="flex items-center gap-1.5">
                  <Kbd>⌘</Kbd>
                  <span className="text-[10px] text-slate-300 font-bold">+</span>
                  <Kbd>Enter</Kbd>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Table Controls</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Select Row</span>
                <div className="flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Open Record</span>
                <Kbd>Enter</Kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Delete Record</span>
                <Kbd>Delete</Kbd>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Global</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-50">
                <span className="text-sm font-medium text-slate-600">Focus Search</span>
                <Kbd>/</Kbd>
              </div>
            </div>
          </section>
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium italic">
            Excel-style workflow for maximum productivity.
          </p>
        </div>
      </Modal>
    </>
  );
}
