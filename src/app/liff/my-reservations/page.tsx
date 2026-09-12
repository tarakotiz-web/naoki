"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiff } from "@/components/liff/use-liff";
import { LiffLoading, LiffNotConfigured, LiffError } from "@/components/liff/liff-status-guard";
import { RESERVATION_STATUS_LABELS } from "@/lib/reservation-status";
import { formatTimeRange } from "@/lib/time";

interface MyReservation {
  id: string;
  reservationDate: string;
  startTime: string;
  durationMinutes: number;
  partySize: number;
  childCount: number | null;
  allergyInfo: string | null;
  customerRequest: string | null;
  status: keyof typeof RESERVATION_STATUS_LABELS;
}

const EDITABLE_STATUSES = new Set(["PENDING", "CONFIRMED"]);

function MyReservationsView() {
  const liff = useLiff();
  const storeSlug = useSearchParams().get("store");
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (liff.status !== "ready" || !liff.idToken) return;
    setLoading(true);
    const query = storeSlug ? `?store=${encodeURIComponent(storeSlug)}` : "";
    const res = await fetch(`/api/line/reservations${query}`, {
      headers: { Authorization: `Bearer ${liff.idToken}` },
    });
    const data = await res.json();
    setReservations(data.reservations ?? []);
    setLoading(false);
  }, [liff.status, liff.idToken, storeSlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (liff.status === "loading") return <LiffLoading />;
  if (liff.status === "not_configured") return <LiffNotConfigured />;
  if (liff.status === "error") return <LiffError message={liff.error ?? "不明なエラー"} />;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-center">ご予約の確認・変更</h1>

      {loading ? (
        <p className="text-center text-sm text-[var(--foreground-muted)] py-10">読み込み中...</p>
      ) : reservations.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[var(--foreground-muted)]">
          現在のご予約はありません。
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              idToken={liff.idToken!}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyReservationsPage() {
  return (
    <Suspense>
      <MyReservationsView />
    </Suspense>
  );
}

function ReservationCard({
  reservation,
  open,
  onToggle,
  idToken,
  onChanged,
}: {
  reservation: MyReservation;
  open: boolean;
  onToggle: () => void;
  idToken: string;
  onChanged: () => void;
}) {
  const editable = EDITABLE_STATUSES.has(reservation.status);

  const [reservationDate, setReservationDate] = useState(reservation.reservationDate.slice(0, 10));
  const [startTime, setStartTime] = useState(reservation.startTime);
  const [partySize, setPartySize] = useState(reservation.partySize);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/line/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ reservationDate, startTime, partySize }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "変更に失敗しました。");
      return;
    }
    onChanged();
  }

  async function handleCancel() {
    if (!confirm("この予約をキャンセルします。よろしいですか?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/line/reservations/${reservation.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ reason: "お客様によるLINEからのキャンセル" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "キャンセルに失敗しました。");
      return;
    }
    onChanged();
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-bold tabular-nums">
            {reservation.reservationDate.slice(5).replace("-", "/")}{" "}
            {formatTimeRange(reservation.startTime, reservation.durationMinutes)}
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">{reservation.partySize}名様</p>
        </div>
        <span className="badge bg-[var(--color-azure-light)] text-[var(--color-azure-dark)]">
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-4 space-y-3">
          {error && (
            <p className="rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)] px-3 py-2 text-sm">
              {error}
            </p>
          )}
          {reservation.allergyInfo && (
            <p className="rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)] px-3 py-2 text-sm font-bold">
              ⚠ アレルギー: {reservation.allergyInfo}
            </p>
          )}
          {!editable ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              このご予約は現在の状況(
              {RESERVATION_STATUS_LABELS[reservation.status]})のため、LINEからの変更はできません。
              お手数ですがお電話でお問い合わせください。
            </p>
          ) : (
            <>
              <label className="block">
                <span className="block text-xs font-semibold mb-1">日付</span>
                <input
                  type="date"
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold mb-1">時間</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold mb-1">人数</span>
                <input
                  type="number"
                  min={1}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="input"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="btn btn-primary h-11 flex-1 text-sm disabled:opacity-60"
                >
                  変更を保存
                </button>
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="btn btn-danger h-11 flex-1 text-sm disabled:opacity-60"
                >
                  キャンセルする
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <style jsx global>{`
        .input {
          width: 100%;
          height: 40px;
          padding: 0 10px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border);
          background: white;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
