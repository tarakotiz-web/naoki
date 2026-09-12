import type { DashboardSummary } from "@/types/reservation";

function Card({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number | string;
  unit?: string;
  accent?: "azure" | "gold" | "danger" | "success";
}) {
  const accentColor =
    accent === "azure"
      ? "text-[var(--color-azure)]"
      : accent === "gold"
        ? "text-[var(--color-gold)]"
        : accent === "danger"
          ? "text-[var(--color-danger)]"
          : accent === "success"
            ? "text-[var(--color-success)]"
            : "text-[var(--foreground)]";

  return (
    <div className="card px-4 py-3.5 flex flex-col gap-1 min-w-[120px] flex-1">
      <span className="text-xs font-medium text-[var(--foreground-muted)]">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${accentColor}`}>
        {value}
        {unit && <span className="text-sm font-medium ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      <Card label="予約件数" value={summary.reservationCount} unit="件" accent="azure" />
      <Card label="予約人数" value={summary.totalPartySize} unit="名" accent="azure" />
      <Card label="来店中" value={summary.currentlySeatedCount} unit="名" accent="gold" />
      <Card label="今後の予約人数" value={summary.upcomingPartySize} unit="名" />
      <Card label="キャンセル" value={summary.cancelledCount} unit="件" accent="danger" />
      <Card
        label="現在の空席"
        value={`${summary.availableSeatsNow}/${summary.seatsTotal}`}
        unit="席"
        accent={summary.availableSeatsNow <= 4 ? "danger" : "success"}
      />
    </div>
  );
}
