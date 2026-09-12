import type { ReservationStatus } from "@prisma/client";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_STYLES } from "@/lib/reservation-status";
import clsx from "clsx";

export function StatusBadge({ status, className }: { status: ReservationStatus; className?: string }) {
  return (
    <span className={clsx("badge", RESERVATION_STATUS_STYLES[status], className)}>
      {RESERVATION_STATUS_LABELS[status]}
    </span>
  );
}

export function AllergyBadge({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <span
      className="badge bg-[var(--color-danger-light)] text-[var(--color-danger)]"
      title={text}
    >
      ⚠ アレルギー
    </span>
  );
}
