import { prisma } from "@/lib/prisma";
import { dateStringToUTCDate, timeToMinutes, weekdayOf } from "@/lib/time";
import { CANCELLED_LIKE_STATUSES } from "@/lib/reservation-status";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export interface AnalyticsResult {
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

export async function computeAnalytics(
  storeId: string,
  fromStr: string,
  toStr: string
): Promise<AnalyticsResult> {
  const from = dateStringToUTCDate(fromStr);
  const to = dateStringToUTCDate(toStr);

  const reservations = await prisma.reservation.findMany({
    where: { storeId, reservationDate: { gte: from, lte: to } },
    select: {
      reservationDate: true,
      startTime: true,
      partySize: true,
      status: true,
      customerId: true,
      source: { select: { code: true, label: true } },
    },
  });

  const active = reservations.filter((r) => !CANCELLED_LIKE_STATUSES.includes(r.status));

  // 日別集計
  const dailyMap = new Map<string, { count: number; partySize: number }>();
  for (const r of active) {
    const key = r.reservationDate.toISOString().slice(0, 10);
    const entry = dailyMap.get(key) ?? { count: 0, partySize: 0 };
    entry.count += 1;
    entry.partySize += r.partySize;
    dailyMap.set(key, entry);
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 経路別集計
  const sourceMap = new Map<string, { label: string; count: number }>();
  for (const r of active) {
    const entry = sourceMap.get(r.source.code) ?? { label: r.source.label, count: 0 };
    entry.count += 1;
    sourceMap.set(r.source.code, entry);
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => b.count - a.count);

  // 曜日別集計
  const weekdayCounts = new Array(7).fill(0);
  for (const r of active) {
    weekdayCounts[weekdayOf(r.reservationDate.toISOString().slice(0, 10))] += 1;
  }
  const byWeekday = WEEKDAY_LABELS.map((label, i) => ({ label, count: weekdayCounts[i] }));

  // 時間帯別集計(1時間単位)
  const hourMap = new Map<number, number>();
  for (const r of active) {
    const hour = Math.floor(timeToMinutes(r.startTime) / 60);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  const byHour = Array.from(hourMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ label: `${hour}時`, count }));

  const totalPartySize = active.reduce((sum, r) => sum + r.partySize, 0);
  const lineCount = active.filter((r) => r.source.code === "line").length;
  const phoneCount = active.filter((r) => r.source.code === "phone").length;

  const cancelledCount = reservations.filter((r) => r.status === "CANCELLED").length;
  const noShowCount = reservations.filter((r) => r.status === "NO_SHOW").length;

  const customerIds = Array.from(new Set(reservations.map((r) => r.customerId).filter(Boolean))) as string[];
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, createdAt: true },
  });
  const newCustomers = customers.filter((c) => c.createdAt >= from && c.createdAt <= addOneDay(to)).length;
  const repeatCustomers = customers.length - newCustomers;

  return {
    from: fromStr,
    to: toStr,
    totals: {
      reservationCount: active.length,
      totalPartySize,
      avgPartySize: active.length > 0 ? Math.round((totalPartySize / active.length) * 10) / 10 : 0,
      lineCount,
      phoneCount,
      newCustomers,
      repeatCustomers,
      cancellationRate: reservations.length > 0 ? cancelledCount / reservations.length : 0,
      noShowRate: reservations.length > 0 ? noShowCount / reservations.length : 0,
    },
    daily,
    bySource,
    byWeekday,
    byHour,
  };
}

function addOneDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
