"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} sm:rounded-2xl rounded-t-2xl bg-[var(--surface)] shadow-[var(--shadow-float)] max-h-[92vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[var(--surface-muted)] text-lg"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto scroll-touch px-5 py-4 flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
