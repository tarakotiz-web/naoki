"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/status-badge";
import type { ReservationDetail } from "@/types/reservation";
import type { ReservationStatus, CancelMethod } from "@prisma/client";
import {
  ALLOWED_STATUS_TRANSITIONS,
  RESERVATION_STATUS_LABELS,
  CANCEL_METHOD_LABELS,
} from "@/lib/reservation-status";
import { formatTimeRange } from "@/lib/time";
import { sourceIcon } from "@/lib/reservation-source";
import Link from "next/link";

export function ReservationDetailModal({
  reservationId,
  open,
  onClose,
  onChanged,
  onEdit,
}: {
  reservationId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (reservation: ReservationDetail) => void;
}) {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelMethod, setCancelMethod] = useState<CancelMethod>("STAFF");
  const [cancelReason, setCancelReason] = useState("");
  const [asNoShow, setAsNoShow] = useState(false);

  useEffect(() => {
    if (!open || !reservationId) return;
    setLoading(true);
    setShowCancelForm(false);
    fetch(`/api/reservations/${reservationId}`)
      .then((r) => r.json())
      .then((data) => setReservation(data.reservation))
      .finally(() => setLoading(false));
  }, [open, reservationId]);

  async function changeStatus(status: ReservationStatus, cancelInfo?: { cancelMethod: CancelMethod; cancelReason: string }) {
    if (!reservation) return;
    setError(null);
    const res = await fetch(`/api/reservations/${reservation.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...cancelInfo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "更新に失敗しました。");
      return;
    }
    setReservation(data.reservation);
    onChanged();
  }

  function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    changeStatus(asNoShow ? "NO_SHOW" : "CANCELLED", { cancelMethod, cancelReason });
    setShowCancelForm(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="予約詳細" wide>
      {loading && <p className="text-sm text-[var(--foreground-muted)]">読み込み中...</p>}
      {!loading && reservation && (
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {reservation.allergyInfo && (
            <div className="rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] px-4 py-3 text-sm font-bold flex items-center gap-2">
              ⚠ アレルギー情報あり: {reservation.allergyInfo}
            </div>
          )}

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-2xl font-bold">{reservation.customerName} 様</p>
              <p className="text-[var(--foreground-muted)] text-sm mt-0.5">
                {reservation.phone || "電話番号未登録"}
              </p>
            </div>
            <StatusBadge status={reservation.status} className="text-sm px-3 py-1.5" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <InfoItem label="予約日" value={reservation.reservationDate.toString().slice(0, 10)} />
            <InfoItem
              label="時間"
              value={formatTimeRange(reservation.startTime, reservation.durationMinutes)}
            />
            <InfoItem label="人数" value={`${reservation.partySize}名`} />
            {(reservation.adultCount || reservation.childCount) && (
              <InfoItem
                label="内訳"
                value={`大人${reservation.adultCount ?? 0}・子ども${reservation.childCount ?? 0}`}
              />
            )}
            <InfoItem
              label="テーブル"
              value={reservation.tables.map((t) => t.table.name).join(", ") || "未割当"}
            />
            <InfoItem
              label="予約経路"
              value={`${sourceIcon(reservation.source.code)} ${reservation.source.label}`}
            />
            {reservation.menu && <InfoItem label="メニュー" value={reservation.menu} />}
            {reservation.hasStroller && <InfoItem label="ベビーカー" value="あり" />}
            {reservation.isAnniversary && (
              <InfoItem label="記念日" value={reservation.anniversaryNote || "あり"} />
            )}
          </div>

          {reservation.customerRequest && (
            <InfoBlock label="顧客からの要望" value={reservation.customerRequest} />
          )}
          {reservation.staffMemo && <InfoBlock label="店舗スタッフ用メモ" value={reservation.staffMemo} />}

          {reservation.customerId && (
            <Link
              href={`/customers/${reservation.customerId}`}
              className="inline-block text-sm font-semibold text-[var(--color-azure)] hover:underline"
            >
              顧客詳細を見る →
            </Link>
          )}

          {reservation.status === "CANCELLED" || reservation.status === "NO_SHOW" ? (
            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm">
              <p className="font-semibold">キャンセル情報</p>
              <p>日時: {reservation.cancelledAt?.toString().slice(0, 16).replace("T", " ")}</p>
              <p>方法: {reservation.cancelMethod && CANCEL_METHOD_LABELS[reservation.cancelMethod]}</p>
              {reservation.cancelReason && <p>理由: {reservation.cancelReason}</p>}
            </div>
          ) : (
            <section>
              <p className="text-sm font-semibold mb-2">ステータス変更</p>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_STATUS_TRANSITIONS[reservation.status]
                  .filter((s) => s !== "CANCELLED" && s !== "NO_SHOW")
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      className="btn btn-primary h-11 px-4 text-sm"
                    >
                      {RESERVATION_STATUS_LABELS[s]}へ
                    </button>
                  ))}
                <button
                  onClick={() => onEdit(reservation)}
                  className="btn btn-secondary h-11 px-4 text-sm"
                >
                  編集
                </button>
                <button
                  onClick={() => setShowCancelForm((v) => !v)}
                  className="btn btn-danger h-11 px-4 text-sm"
                >
                  キャンセル/無断キャンセル
                </button>
              </div>
            </section>
          )}

          {showCancelForm && (
            <form onSubmit={handleCancelSubmit} className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={!asNoShow}
                    onChange={() => setAsNoShow(false)}
                  />
                  キャンセル
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="radio" checked={asNoShow} onChange={() => setAsNoShow(true)} />
                  無断キャンセル
                </label>
              </div>
              <div>
                <span className="block text-sm font-semibold mb-1.5">キャンセル方法</span>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(CANCEL_METHOD_LABELS) as CancelMethod[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setCancelMethod(m)}
                      className={`btn h-9 px-3 text-xs ${cancelMethod === m ? "btn-primary" : "btn-secondary"}`}
                    >
                      {CANCEL_METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-sm font-semibold mb-1.5">理由(任意)</span>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full min-h-[60px] rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <button type="submit" className="btn btn-danger h-11 px-5 text-sm">
                確定する
              </button>
            </form>
          )}

          <section>
            <p className="text-sm font-semibold mb-2">変更履歴</p>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto text-xs text-[var(--foreground-muted)]">
              {reservation.logs.map((log) => (
                <li key={log.id} className="flex gap-2">
                  <span className="tabular-nums shrink-0">
                    {log.createdAt.toString().slice(0, 16).replace("T", " ")}
                  </span>
                  <span>
                    {log.changeType} {log.changedBy ? `by ${log.changedBy}` : ""}{" "}
                    {log.note ? `(${log.note})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Modal>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--foreground-muted)] text-xs">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm">
      <p className="text-[var(--foreground-muted)] text-xs mb-1">{label}</p>
      <p>{value}</p>
    </div>
  );
}
