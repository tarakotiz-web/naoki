"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Store } from "@prisma/client";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(0);
  const [openTime, setOpenTime] = useState("11:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [closedWeekdays, setClosedWeekdays] = useState<number[]>([]);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(30);
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(90);

  useEffect(() => {
    fetch("/api/store/settings")
      .then((r) => r.json())
      .then((data) => {
        const s: Store = data.store;
        setStore(s);
        setName(s.name);
        setPhone(s.phone ?? "");
        setAddress(s.address ?? "");
        setSeatsTotal(s.seatsTotal);
        setOpenTime(s.openTime);
        setCloseTime(s.closeTime);
        setClosedWeekdays(s.closedWeekdays);
        setSlotIntervalMinutes(s.slotIntervalMinutes);
        setDefaultDurationMinutes(s.defaultDurationMinutes);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleWeekday(day: number) {
    setClosedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/store/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone: phone || null,
        address: address || null,
        seatsTotal,
        openTime,
        closeTime,
        closedWeekdays,
        slotIntervalMinutes,
        defaultDurationMinutes,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました。");
      return;
    }
    setStore(data.store);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return <div className="card p-10 text-center text-[var(--foreground-muted)]">読み込み中...</div>;
  }
  if (!store) {
    return <div className="card p-10 text-center text-[var(--color-danger)]">店舗情報を取得できませんでした。</div>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">店舗設定</h1>
      <p className="text-sm text-[var(--foreground-muted)]">
        営業時間・定休日・席数などはここで一元管理します。他店舗を展開する場合もこの画面(または `stores`
        テーブル)に行を追加するだけで対応できます。
      </p>

      {!isAdmin && (
        <div className="rounded-xl bg-[var(--color-warning-light)] text-[var(--color-warning)] px-4 py-3 text-sm font-medium">
          店舗設定の変更は管理者(ADMIN)権限が必要です。内容の閲覧のみ可能です。
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        {error && (
          <p className="rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)] px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-lg bg-[var(--color-success-light)] text-[var(--color-success)] px-3 py-2 text-sm">
            保存しました。
          </p>
        )}

        <fieldset disabled={!isAdmin} className="space-y-4 disabled:opacity-70">
          <Field label="店舗名" required>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="電話番号">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </Field>
            <Field label="総席数" required>
              <input
                type="number"
                min={1}
                value={seatsTotal}
                onChange={(e) => setSeatsTotal(Number(e.target.value))}
                required
                className="input"
              />
            </Field>
          </div>
          <Field label="住所">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="開店時刻" required>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label="閉店時刻" required>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
                className="input"
              />
            </Field>
          </div>
          <div>
            <span className="block text-sm font-semibold mb-1.5">定休日</span>
            <div className="flex gap-2 flex-wrap">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  type="button"
                  key={i}
                  disabled={!isAdmin}
                  onClick={() => toggleWeekday(i)}
                  className={`btn h-10 w-14 text-sm ${
                    closedWeekdays.includes(i) ? "btn-danger" : "btn-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="予約スロット間隔(分)" required>
              <input
                type="number"
                min={5}
                step={5}
                value={slotIntervalMinutes}
                onChange={(e) => setSlotIntervalMinutes(Number(e.target.value))}
                required
                className="input"
              />
            </Field>
            <Field label="デフォルト利用時間(分)" required>
              <input
                type="number"
                min={15}
                step={15}
                value={defaultDurationMinutes}
                onChange={(e) => setDefaultDurationMinutes(Number(e.target.value))}
                required
                className="input"
              />
            </Field>
          </div>
        </fieldset>

        {isAdmin && (
          <button type="submit" disabled={saving} className="btn btn-primary h-12 px-6 disabled:opacity-60">
            {saving ? "保存中..." : "設定を保存"}
          </button>
        )}
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
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-azure);
        }
      `}</style>
    </div>
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
