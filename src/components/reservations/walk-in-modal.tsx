"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { Table } from "@prisma/client";

function nowTimeString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCHours().toString().padStart(2, "0")}:${jst.getUTCMinutes().toString().padStart(2, "0")}`;
}

export function WalkInModal({
  open,
  onClose,
  onSaved,
  tables,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tables: Table[];
}) {
  const [partySize, setPartySize] = useState(2);
  const [startTime, setStartTime] = useState(nowTimeString());
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPartySize(2);
      setStartTime(nowTimeString());
      setTableIds([]);
      setCustomerName("");
      setPhone("");
      setError(null);
    }
  }, [open]);

  function toggleTable(id: string) {
    setTableIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partySize,
          startTime,
          tableIds: tableIds.length > 0 ? tableIds : undefined,
          customerName: customerName || undefined,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました。");
        setSubmitting(false);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("通信エラーが発生しました。");
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="WALK-IN (予約なし来店)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-sm font-semibold mb-1.5">人数 *</span>
            <input
              type="number"
              required
              min={1}
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="w-full h-12 px-3 rounded-[var(--radius-control)] border border-[var(--border)] text-base"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold mb-1.5">入店時間 *</span>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-12 px-3 rounded-[var(--radius-control)] border border-[var(--border)] text-base"
            />
          </label>
        </div>

        <div>
          <span className="block text-sm font-semibold mb-1.5">テーブル</span>
          <div className="flex flex-wrap gap-2">
            {tables
              .filter((t) => t.isActive)
              .map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTable(t.id)}
                  className={`btn h-11 px-3 text-sm ${tableIds.includes(t.id) ? "btn-primary" : "btn-secondary"}`}
                >
                  {t.name}({t.maxSeats}名)
                </button>
              ))}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">お客様名(任意)</span>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full h-12 px-3 rounded-[var(--radius-control)] border border-[var(--border)] text-base"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">電話番号(任意)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-12 px-3 rounded-[var(--radius-control)] border border-[var(--border)] text-base"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary h-12 flex-1">
            キャンセル
          </button>
          <button type="submit" disabled={submitting} className="btn btn-gold h-12 flex-1 disabled:opacity-60">
            {submitting ? "登録中..." : "WALK-INを登録"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
