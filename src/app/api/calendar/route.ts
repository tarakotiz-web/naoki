import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { CANCELLED_LIKE_STATUSES } from "@/lib/reservation-status";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const year = Number(req.nextUrl.searchParams.get("year"));
    const month = Number(req.nextUrl.searchParams.get("month")); // 1-12
    if (!year || !month) {
      return NextResponse.json({ error: "year, month は必須です。" }, { status: 400 });
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const reservations = await prisma.reservation.findMany({
      where: {
        storeId: store.id,
        reservationDate: { gte: start, lt: end },
      },
      select: { reservationDate: true, partySize: true, status: true },
    });

    const byDate = new Map<string, { reservationCount: number; partySize: number }>();
    for (const r of reservations) {
      if (CANCELLED_LIKE_STATUSES.includes(r.status)) continue;
      const key = r.reservationDate.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { reservationCount: 0, partySize: 0 };
      entry.reservationCount += 1;
      entry.partySize += r.partySize;
      byDate.set(key, entry);
    }

    return NextResponse.json({
      year,
      month,
      days: Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
