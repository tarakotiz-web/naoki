"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface DayData {
  date: string;
  reservationCount: number;
  partySize: number;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [days, setDays] = useState<DayData[]>([]);
  const [closedWeekdays, setClosedWeekdays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/store")
      .then((r) => r.json())
      .then((data) => setClosedWeekdays(data.store?.closedWeekdays ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => setDays(data.days ?? []))
      .finally(() => setLoading(false));
  }, [year, month]);

  const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const startWeekday = firstOfMonth.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const result: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) result.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ date, day: d });
    }
    return result;
  }, [year, month]);

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">
          {year}年{month}月
        </h1>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="btn btn-secondary h-10 w-10">
            ‹
          </button>
          <button
            onClick={() => {
              setYear(now.getFullYear());
              setMonth(now.getMonth() + 1);
            }}
            className="btn btn-secondary h-10 px-4 text-sm"
          >
            今月
          </button>
          <button onClick={() => changeMonth(1)} className="btn btn-secondary h-10 w-10">
            ›
          </button>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-7 text-center text-xs font-bold text-[var(--foreground-muted)] mb-2">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={w}
              className={clsx(closedWeekdays.includes(i) && "text-[var(--color-danger)]")}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell.date) return <div key={i} />;
            const data = dayMap.get(cell.date);
            const weekday = new Date(cell.date + "T00:00:00Z").getUTCDay();
            const isClosed = closedWeekdays.includes(weekday);
            return (
              <button
                key={cell.date}
                onClick={() => router.push(`/reservations?date=${cell.date}`)}
                disabled={loading}
                className={clsx(
                  "aspect-square sm:aspect-auto sm:h-24 rounded-xl border p-2 flex flex-col items-start text-left transition-colors",
                  isClosed
                    ? "bg-[var(--surface-muted)] border-[var(--border)] opacity-60"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--color-azure)] hover:bg-[var(--color-azure-light)]/40"
                )}
              >
                <span className="text-sm font-bold">{cell.day}</span>
                {isClosed ? (
                  <span className="text-[10px] text-[var(--color-danger)] mt-auto">定休日</span>
                ) : data ? (
                  <div className="mt-auto text-[11px] leading-tight">
                    <p className="font-semibold text-[var(--color-azure-dark)]">{data.reservationCount}件</p>
                    <p className="text-[var(--foreground-muted)]">{data.partySize}名</p>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
