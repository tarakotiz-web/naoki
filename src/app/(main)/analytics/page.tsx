"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { StatTile } from "@/components/analytics/stat-tile";
import { VerticalBarChart } from "@/components/analytics/vertical-bar-chart";
import { HorizontalBarChart } from "@/components/analytics/horizontal-bar-chart";
import { addDaysToDateString, todayDateString } from "@/lib/time";

interface AnalyticsData {
  from: string;
  to: string;
  totals: {
    reservationCount: number;
    totalPartySize: number;
    avgPartySize: number;
    lineCount: number;
    phoneCount: number;
    newCustomers: number;
    repeatCustomers: number;
    cancellationRate: number;
    noShowRate: number;
  };
  daily: { date: string; count: number; partySize: number }[];
  bySource: { label: string; code: string; count: number }[];
  byWeekday: { label: string; count: number }[];
  byHour: { label: string; count: number }[];
}

const PRESETS = [
  { label: "過去7日間", days: 7 },
  { label: "過去30日間", days: 30 },
  { label: "過去90日間", days: 90 },
];

function pct(v: number): string {
  return `${Math.round(v * 1000) / 10}%`;
}

export default function AnalyticsPage() {
  const today = todayDateString();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refetching, setRefetching] = useState(false);

  const load = useCallback(async (rangeDays: number) => {
    setRefetching(true);
    const from = addDaysToDateString(today, -(rangeDays - 1));
    const res = await fetch(`/api/analytics?from=${from}&to=${today}`);
    const json = await res.json();
    setData(json);
    setRefetching(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">分析ダッシュボード</h1>
        <div className="flex gap-1 bg-[var(--surface-muted)] rounded-full p-1">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={clsx(
                "px-4 h-9 rounded-full text-sm font-semibold transition-colors",
                days === p.days ? "bg-[var(--surface)] shadow-sm" : "text-[var(--foreground-muted)]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="card p-10 text-center text-[var(--foreground-muted)]">読み込み中...</div>
      ) : (
        <div className={clsx("space-y-5 transition-opacity", refetching && "opacity-60")}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatTile label="予約件数" value={data.totals.reservationCount} unit="件" />
            <StatTile label="予約人数" value={data.totals.totalPartySize} unit="名" />
            <StatTile label="平均予約人数" value={data.totals.avgPartySize} unit="名/件" />
            <StatTile label="LINE予約数" value={data.totals.lineCount} unit="件" />
            <StatTile label="電話予約数" value={data.totals.phoneCount} unit="件" />
            <StatTile label="新規顧客" value={data.totals.newCustomers} unit="名" />
            <StatTile label="リピーター" value={data.totals.repeatCustomers} unit="名" />
            <StatTile
              label="キャンセル率"
              value={pct(data.totals.cancellationRate)}
              tone={data.totals.cancellationRate > 0.15 ? "danger" : data.totals.cancellationRate > 0.05 ? "warning" : "good"}
            />
            <StatTile
              label="無断キャンセル率"
              value={pct(data.totals.noShowRate)}
              tone={data.totals.noShowRate > 0.05 ? "danger" : data.totals.noShowRate > 0.01 ? "warning" : "good"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="日別予約件数">
              <VerticalBarChart
                data={data.daily.map((d) => ({ label: d.date.slice(5), value: d.count }))}
                valueSuffix="件"
              />
            </ChartCard>
            <ChartCard title="日別予約人数">
              <VerticalBarChart
                data={data.daily.map((d) => ({ label: d.date.slice(5), value: d.partySize }))}
                valueSuffix="名"
              />
            </ChartCard>
            <ChartCard title="予約経路別件数">
              <HorizontalBarChart
                data={data.bySource.map((s) => ({ label: s.label, value: s.count }))}
                valueSuffix="件"
              />
            </ChartCard>
            <ChartCard title="曜日別予約数">
              <VerticalBarChart
                data={data.byWeekday.map((w) => ({ label: w.label, value: w.count }))}
                valueSuffix="件"
              />
            </ChartCard>
            <ChartCard title="時間帯別予約数">
              <VerticalBarChart
                data={data.byHour.map((h) => ({ label: h.label, value: h.count }))}
                valueSuffix="件"
              />
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="text-sm font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}
