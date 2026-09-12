"use client";

import { useEffect, useState } from "react";
import type { Table } from "@prisma/client";

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [maxSeats, setMaxSeats] = useState(2);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tables");
    const data = await res.json();
    setTables(data.tables ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, maxSeats }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "追加に失敗しました。");
      return;
    }
    setName("");
    setMaxSeats(2);
    load();
  }

  async function toggleActive(t: Table) {
    await fetch(`/api/tables/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  }

  async function updateSeats(t: Table, maxSeatsValue: number) {
    await fetch(`/api/tables/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxSeats: maxSeatsValue }),
    });
    load();
  }

  const totalSeats = tables.filter((t) => t.isActive).reduce((s, t) => s + t.maxSeats, 0);

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold">テーブル管理</h1>
      <p className="text-sm text-[var(--foreground-muted)]">
        現在の利用可能席数合計:{" "}
        <span className="font-bold text-[var(--foreground)]">{totalSeats}席</span>
        (店舗設定の総席数とは別に、実際に稼働しているテーブルの合計です)
      </p>

      <form onSubmit={addTable} className="card p-4 flex flex-wrap items-end gap-3">
        {error && <p className="text-sm text-[var(--color-danger)] w-full">{error}</p>}
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">テーブル名</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border)]"
            placeholder="T9"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">最大人数</span>
          <input
            type="number"
            required
            min={1}
            value={maxSeats}
            onChange={(e) => setMaxSeats(Number(e.target.value))}
            className="h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border)] w-24"
          />
        </label>
        <button type="submit" className="btn btn-primary h-11 px-5">
          テーブルを追加
        </button>
      </form>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-[var(--foreground-muted)]">読み込み中...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">テーブル名</th>
                <th className="px-4 py-3 font-semibold">最大人数</th>
                <th className="px-4 py-3 font-semibold">状態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      defaultValue={t.maxSeats}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== t.maxSeats) updateSeats(t, v);
                      }}
                      className="h-9 w-20 px-2 rounded-[var(--radius-control)] border border-[var(--border)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${t.isActive ? "bg-[var(--color-success-light)] text-[var(--color-success)]" : "bg-[var(--color-neutral-light)] text-[var(--color-neutral)]"}`}
                    >
                      {t.isActive ? "利用可能" : "利用不可"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(t)} className="btn btn-secondary h-9 px-3 text-xs">
                      {t.isActive ? "利用不可にする" : "利用可能にする"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
