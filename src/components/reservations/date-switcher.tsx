"use client";

import { addDaysToDateString, todayDateString } from "@/lib/time";

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getUTCDay()];
  return `${y}年${m}月${d}日(${weekday})`;
}

export function DateSwitcher({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const isToday = date === todayDateString();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        aria-label="前日"
        onClick={() => onChange(addDaysToDateString(date, -1))}
        className="btn btn-secondary h-11 w-11 text-lg shrink-0"
      >
        ‹
      </button>

      <div className="relative">
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-white font-semibold text-base"
        />
      </div>

      <button
        aria-label="翌日"
        onClick={() => onChange(addDaysToDateString(date, 1))}
        className="btn btn-secondary h-11 w-11 text-lg shrink-0"
      >
        ›
      </button>

      {!isToday && (
        <button
          onClick={() => onChange(todayDateString())}
          className="btn btn-primary h-11 px-4 text-sm shrink-0"
        >
          今日へ戻る
        </button>
      )}

      <span className="text-sm sm:text-base font-semibold text-[var(--foreground-muted)] ml-1">
        {formatDisplayDate(date)}
      </span>
    </div>
  );
}
