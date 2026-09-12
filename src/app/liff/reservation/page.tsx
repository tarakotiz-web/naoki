"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiff } from "@/components/liff/use-liff";
import { LiffLoading, LiffNotConfigured, LiffError } from "@/components/liff/liff-status-guard";
import { formatTimeRange, todayDateString } from "@/lib/time";

interface CreatedReservation {
  reservationDate: string;
  startTime: string;
  durationMinutes: number;
  partySize: number;
}

function LiffReservationForm() {
  const liff = useLiff();
  // 複数店舗運用時、LIFFのURLに ?store=<slug> を付けて店舗を指定できる。
  const storeSlug = useSearchParams().get("store");

  const [reservationDate, setReservationDate] = useState(todayDateString());
  const [startTime, setStartTime] = useState("12:00");
  const [partySize, setPartySize] = useState(2);
  const [childCount, setChildCount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [allergyInfo, setAllergyInfo] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedReservation | null>(null);

  if (liff.status === "loading") return <LiffLoading />;
  if (liff.status === "not_configured") return <LiffNotConfigured />;
  if (liff.status === "error") return <LiffError message={liff.error ?? "不明なエラー"} />;

  if (result) {
    return (
      <div className="space-y-4">
        <div className="card p-6 text-center space-y-3">
          <p className="text-3xl">✅</p>
          <h1 className="text-lg font-bold">Cafe &amp; Restaurant NODE</h1>
          <p className="text-sm">ご予約を受け付けました。</p>
          <div className="text-2xl font-bold">
            {result.reservationDate.slice(5).replace("-", "月")}日
          </div>
          <div className="text-xl font-bold tabular-nums">
            {formatTimeRange(result.startTime, result.durationMinutes)}
          </div>
          <div className="text-lg">{result.partySize}名様</div>
          <p className="text-xs text-[var(--foreground-muted)]">
            予約状況: 予約受付(スタッフ確認後に確定します)
          </p>
        </div>
        <Link href="/liff/my-reservations" className="btn btn-primary h-12 w-full">
          予約内容を確認する
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/line/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${liff.idToken}`,
        },
        body: JSON.stringify({
          reservationDate,
          startTime,
          partySize,
          childCount: childCount ? Number(childCount) : undefined,
          customerName,
          phone,
          allergyInfo: allergyInfo || undefined,
          customerRequest: customerRequest || undefined,
          displayName: liff.profile?.displayName,
          store: storeSlug || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "予約に失敗しました。");
        if (data.suggestion) setSuggestion(data.suggestion);
        return;
      }
      setResult(data.reservation);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-center">ご予約フォーム</h1>
      <p className="text-center text-sm text-[var(--foreground-muted)]">Cafe &amp; Restaurant NODE</p>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        {error && (
          <div className="rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error}
            {suggestion && <div className="mt-1">おすすめの空き時間: {suggestion}</div>}
          </div>
        )}

        <Field label="希望日" required>
          <input
            type="date"
            required
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="希望時間" required>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="人数" required>
          <input
            type="number"
            required
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="input"
          />
        </Field>
        <Field label="お子様の人数">
          <input
            type="number"
            min={0}
            value={childCount}
            onChange={(e) => setChildCount(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="お名前" required>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input"
            placeholder={liff.profile?.displayName}
          />
        </Field>
        <Field label="電話番号" required>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="アレルギー">
          <input
            type="text"
            value={allergyInfo}
            onChange={(e) => setAllergyInfo(e.target.value)}
            className="input"
            placeholder="卵、小麦、ナッツなど"
          />
        </Field>
        <Field label="その他ご要望">
          <textarea
            value={customerRequest}
            onChange={(e) => setCustomerRequest(e.target.value)}
            className="input min-h-[70px]"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary h-12 w-full text-base disabled:opacity-60"
        >
          {submitting ? "送信中..." : "この内容で予約する"}
        </button>
      </form>
      <style jsx global>{`
        .input {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border);
          background: white;
          font-size: 15px;
        }
        textarea.input {
          height: auto;
          padding-top: 10px;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-azure);
        }
      `}</style>
    </div>
  );
}

export default function LiffReservationPage() {
  return (
    <Suspense>
      <LiffReservationForm />
    </Suspense>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">
        {label}
        {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
