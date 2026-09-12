"use client";

import type { ReservationWithRelations } from "@/types/reservation";
import { StatusBadge, AllergyBadge } from "@/components/status-badge";
import { formatTimeRange } from "@/lib/time";
import { sourceIcon } from "@/lib/reservation-source";
import clsx from "clsx";

export function ReservationList({
  reservations,
  onSelect,
}: {
  reservations: ReservationWithRelations[];
  onSelect: (r: ReservationWithRelations) => void;
}) {
  if (reservations.length === 0) {
    return (
      <div className="card p-10 text-center text-[var(--foreground-muted)]">
        この日の予約はありません。
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scroll-touch">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">時間</th>
              <th className="px-4 py-3 font-semibold">顧客名</th>
              <th className="px-4 py-3 font-semibold">人数</th>
              <th className="px-4 py-3 font-semibold">電話番号</th>
              <th className="px-4 py-3 font-semibold">テーブル</th>
              <th className="px-4 py-3 font-semibold">経路</th>
              <th className="px-4 py-3 font-semibold">メニュー</th>
              <th className="px-4 py-3 font-semibold">ステータス</th>
              <th className="px-4 py-3 font-semibold">備考</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r)}
                className={clsx(
                  "border-t border-[var(--border)] cursor-pointer hover:bg-[var(--color-azure-light)]/40 active:bg-[var(--color-azure-light)]",
                  (r.status === "CANCELLED" || r.status === "NO_SHOW") && "opacity-50"
                )}
              >
                <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">
                  {formatTimeRange(r.startTime, r.durationMinutes)}
                </td>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1.5">
                    {r.customerName}
                    {r.allergyInfo && <AllergyBadge text={r.allergyInfo} />}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{r.partySize}名</td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">{r.phone || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.tables.map((t) => t.table.name).join(", ") || "未割当"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {sourceIcon(r.source.code)} {r.source.label}
                </td>
                <td className="px-4 py-3 max-w-[160px] truncate">{r.menu || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate text-[var(--foreground-muted)]">
                  {r.staffMemo || r.customerRequest || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
