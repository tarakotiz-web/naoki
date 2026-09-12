export function StatTile({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "default" | "good" | "warning" | "danger";
}) {
  const color =
    tone === "good"
      ? "text-[var(--color-success)]"
      : tone === "warning"
        ? "text-[var(--color-warning)]"
        : tone === "danger"
          ? "text-[var(--color-danger)]"
          : "text-[var(--foreground)]";

  return (
    <div className="card px-4 py-3.5 flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--foreground-muted)]">{label}</span>
      <span className={`text-2xl font-semibold ${color}`}>
        {value}
        {unit && <span className="text-sm font-medium ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
