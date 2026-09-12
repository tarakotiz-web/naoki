"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/reservations", label: "予約台帳" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/customers", label: "顧客管理" },
  { href: "/tables", label: "テーブル管理" },
];

export function TopNav({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur border-b border-[var(--border)]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[var(--foreground)] text-[var(--color-gold)] flex items-center justify-center font-bold">
            N
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">{storeName}</p>
            <p className="text-[11px] text-[var(--foreground-muted)] leading-tight">予約台帳</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-azure-light)] text-[var(--color-azure-dark)]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-[var(--foreground-muted)] truncate max-w-[140px]">
            {session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-secondary h-9 px-4 text-sm"
          >
            ログアウト
          </button>
          <button
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border)]"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="メニュー"
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-[var(--border)] px-4 py-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  "px-4 py-3 rounded-xl text-sm font-medium",
                  active
                    ? "bg-[var(--color-azure-light)] text-[var(--color-azure-dark)]"
                    : "text-[var(--foreground-muted)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
