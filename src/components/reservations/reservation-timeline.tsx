"use client";

import type { ReservationWithRelations } from "@/types/reservation";
import type { Table } from "@prisma/client";
import { generateTimeSlots, timeToMinutes, todayDateString } from "@/lib/time";
import { RESERVATION_STATUS_STYLES } from "@/lib/reservation-status";
import clsx from "clsx";
import { useEffect, useState } from "react";

const ROW_HEIGHT = 64;
const HOUR_WIDTH = 120; // 1時間あたりの幅(px)。iPadでも視認しやすい横幅を確保する。

export function ReservationTimeline({
  reservations,
  tables,
  store,
  date,
  onSelect,
}: {
  reservations: ReservationWithRelations[];
  tables: Table[];
  store: { openTime: string; closeTime: string; slotIntervalMinutes: number };
  date: string;
  onSelect: (r: ReservationWithRelations) => void;
}) {
  const dayStart = timeToMinutes(store.openTime);
  const dayEnd = timeToMinutes(store.closeTime);
  const totalMinutes = dayEnd - dayStart;
  const totalWidth = (totalMinutes / 60) * HOUR_WIDTH;
  const hourSlots = generateTimeSlots(store.openTime, store.closeTime, 60);

  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  useEffect(() => {
    if (date !== todayDateString()) {
      setNowMinutes(null);
      return;
    }
    const update = () => {
      const now = new Date();
      const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      setNowMinutes(jst.getUTCHours() * 60 + jst.getUTCMinutes());
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);

  const assigned = reservations.filter((r) => r.tables.length > 0);
  const unassigned = reservations.filter((r) => r.tables.length === 0);

  function pctLeft(startTime: string) {
    return ((timeToMinutes(startTime) - dayStart) / totalMinutes) * 100;
  }
  function pctWidth(durationMinutes: number) {
    return (durationMinutes / totalMinutes) * 100;
  }

  const rows: { table: Table | null; label: string; items: ReservationWithRelations[] }[] = [
    ...(unassigned.length > 0
      ? [{ table: null, label: "未割当", items: unassigned }]
      : []),
    ...tables.map((t) => ({
      table: t,
      label: t.name,
      items: assigned.filter((r) => r.tables.some((rt) => rt.tableId === t.id)),
    })),
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scroll-touch">
        <div style={{ minWidth: totalWidth + 96 }}>
          {/* ヘッダー: 時刻軸 */}
          <div className="flex sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)]">
            <div className="w-24 shrink-0 border-r border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--foreground-muted)]">
              テーブル
            </div>
            <div className="relative flex-1" style={{ width: totalWidth, height: 36 }}>
              {hourSlots.map((slot) => (
                <div
                  key={slot}
                  className="absolute top-0 bottom-0 border-l border-[var(--border)] text-[11px] font-semibold text-[var(--foreground-muted)] pl-1.5 pt-2"
                  style={{ left: `${pctLeft(slot)}%` }}
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>

          {/* テーブル行 */}
          <div className="relative">
            {rows.map((row) => (
              <div
                key={row.table?.id ?? "unassigned"}
                className="flex border-b border-[var(--border)] last:border-b-0"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="w-24 shrink-0 border-r border-[var(--border)] px-3 py-2 flex flex-col justify-center bg-[var(--surface-muted)]/50">
                  <span className="text-sm font-bold truncate">{row.label}</span>
                  {row.table && (
                    <span className="text-[11px] text-[var(--foreground-muted)]">
                      定員{row.table.maxSeats}名
                    </span>
                  )}
                </div>
                <div className="relative flex-1" style={{ width: totalWidth }}>
                  {/* 時間グリッド線 */}
                  {hourSlots.map((slot) => (
                    <div
                      key={slot}
                      className="absolute top-0 bottom-0 border-l border-[var(--border)]/70"
                      style={{ left: `${pctLeft(slot)}%` }}
                    />
                  ))}
                  {nowMinutes !== null && nowMinutes >= dayStart && nowMinutes <= dayEnd && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-[var(--color-danger)] z-10"
                      style={{ left: `${((nowMinutes - dayStart) / totalMinutes) * 100}%` }}
                    />
                  )}
                  {row.items.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onSelect(r)}
                      className={clsx(
                        "absolute top-1.5 bottom-1.5 rounded-lg px-2 py-1 text-left overflow-hidden shadow-sm border",
                        "hover:brightness-95 active:scale-[0.98] transition-transform",
                        r.status === "CANCELLED" || r.status === "NO_SHOW"
                          ? "opacity-40 border-dashed"
                          : "border-transparent",
                        RESERVATION_STATUS_STYLES[r.status]
                      )}
                      style={{
                        left: `${pctLeft(r.startTime)}%`,
                        width: `calc(${pctWidth(r.durationMinutes)}% - 4px)`,
                        minWidth: 64,
                      }}
                      title={`${r.startTime} ${r.customerName} ${r.partySize}名`}
                    >
                      <div className="flex items-center gap-1 text-[12px] font-bold truncate">
                        <span className="tabular-nums">{r.startTime}</span>
                        <span className="truncate">{r.customerName}</span>
                        {r.allergyInfo && <span title="アレルギーあり">⚠</span>}
                      </div>
                      <div className="text-[11px] truncate opacity-80">
                        {r.partySize}名 ・ {r.durationMinutes}分
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
