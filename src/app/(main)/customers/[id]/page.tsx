import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerDetail } from "@/server/customers";
import { StatusBadge } from "@/components/status-badge";
import { formatTimeRange, formatDateOnly } from "@/lib/time";
import { NotesEditor } from "@/components/customers/notes-editor";
import { sourceIcon } from "@/lib/reservation-source";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  const cancelledReservations = customer.reservations.filter((r) => r.status === "CANCELLED");
  const noShowReservations = customer.reservations.filter((r) => r.status === "NO_SHOW");

  return (
    <div className="space-y-5">
      <Link href="/customers" className="text-sm text-[var(--color-azure)] hover:underline">
        ← 顧客検索に戻る
      </Link>

      <div className="card p-5 space-y-1">
        <h1 className="text-2xl font-bold">{customer.name} 様</h1>
        <p className="text-[var(--foreground-muted)]">{customer.phone}</p>
        {customer.lineUser && (
          <p className="text-sm text-[var(--color-success)] font-semibold">
            💬 LINE連携あり: {customer.lineUser.displayName ?? "表示名未取得"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="来店回数" value={`${customer.visitCount}回`} />
        <Stat label="初回来店日" value={formatDateOnly(customer.firstVisitAt)} />
        <Stat label="最終来店日" value={formatDateOnly(customer.lastVisitAt)} />
        <Stat
          label="キャンセル / 無断キャンセル"
          value={`${cancelledReservations.length} / ${noShowReservations.length}`}
        />
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold mb-3">顧客メモ</h2>
        <NotesEditor customerId={customer.id} initialNotes={customer.notes ?? ""} />
      </div>

      <div className="card overflow-hidden">
        <h2 className="text-sm font-bold px-5 pt-4 pb-2">過去の予約</h2>
        {customer.reservations.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-[var(--foreground-muted)]">予約履歴はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                <tr className="text-left">
                  <th className="px-5 py-2 font-semibold">日付</th>
                  <th className="px-4 py-2 font-semibold">時間</th>
                  <th className="px-4 py-2 font-semibold">人数</th>
                  <th className="px-4 py-2 font-semibold">経路</th>
                  <th className="px-4 py-2 font-semibold">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {customer.reservations.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="px-5 py-2">{formatDateOnly(r.reservationDate)}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatTimeRange(r.startTime, r.durationMinutes)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{r.partySize}名</td>
                    <td className="px-4 py-2">
                      {sourceIcon(r.source.code)} {r.source.label}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-xs text-[var(--foreground-muted)]">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
