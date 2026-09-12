"use client";

import type { CapacitySlot } from "@/types/reservation";
import clsx from "clsx";
import { useState } from "react";

function ratioColor(ratio: number): string {
  if (ratio >= 0.9) return "bg-[var(--color-danger)]";
  if (ratio >= 0.7) return "bg-[var(--color-warning)]";
  return "bg-[var(--color-success)]";
}

export function CapacityStrip({ slots }: { slots: CapacitySlot[] }) {
  const [hovered, setHovered] = useState<CapacitySlot | null>(null);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">時間帯別 空席状況</h3>
        {hovered && (
          <span className="text-xs font-semibold text-[var(--foreground-muted)]">
            {hovered.time} — 予約{hovered.reservedSeats}名 / 空席{hovered.availableSeats}席
          </span>
        )}
      </div>
      <div className="flex gap-[3px] h-10 items-end">
        {slots.map((slot) => (
          <button
            key={slot.time}
            onMouseEnter={() => setHovered(slot)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(slot)}
            className="flex-1 min-w-[6px] rounded-t-sm bg-[var(--surface-muted)] relative group"
            style={{ height: "100%" }}
            aria-label={`${slot.time} 空席${slot.availableSeats}席`}
          >
            <span
              className={clsx("absolute bottom-0 left-0 right-0 rounded-t-sm transition-all", ratioColor(slot.capacityRatio))}
              style={{ height: `${Math.min(slot.capacityRatio, 1) * 100}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-[var(--foreground-muted)]">
        <span>{slots[0]?.time}</span>
        <span>{slots[slots.length - 1]?.time}</span>
      </div>
    </div>
  );
}
