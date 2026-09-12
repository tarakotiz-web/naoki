"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Customer } from "@prisma/client";

export default function CustomersPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (phone) params.set("phone", phone);
    if (date) params.set("date", date);
    const res = await fetch(`/api/customers?${params.toString()}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">顧客管理</h1>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="顧客名(部分一致)"
            className="h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border)]"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="電話番号(部分一致)"
            className="h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border)]"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 px-3 rounded-[var(--radius-control)] border border-[var(--border)]"
          />
          <button onClick={search} className="btn btn-primary h-11">
            検索
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-[var(--foreground-muted)]">検索中...</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-center text-[var(--foreground-muted)]">該当する顧客がいません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">氏名</th>
                  <th className="px-4 py-3 font-semibold">電話番号</th>
                  <th className="px-4 py-3 font-semibold">来店回数</th>
                  <th className="px-4 py-3 font-semibold">初回来店</th>
                  <th className="px-4 py-3 font-semibold">最終来店</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-semibold text-[var(--color-azure)] hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.phone}</td>
                    <td className="px-4 py-3 tabular-nums">{c.visitCount}回</td>
                    <td className="px-4 py-3">
                      {c.firstVisitAt ? c.firstVisitAt.toString().slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {c.lastVisitAt ? c.lastVisitAt.toString().slice(0, 10) : "—"}
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
