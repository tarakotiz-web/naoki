import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { dateStringToUTCDate, timeToMinutes, todayDateString } from "@/lib/time";
import {
  ACTIVE_SEATING_STATUSES,
  CANCELLED_LIKE_STATUSES,
  FUTURE_STATUSES,
} from "@/lib/reservation-status";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const dateStr = req.nextUrl.searchParams.get("date") ?? todayDateString();
    const isToday = dateStr === todayDateString();

    const reservations = await prisma.reservation.findMany({
      where: { storeId: store.id, reservationDate: dateStringToUTCDate(dateStr) },
      select: { status: true, partySize: true, startTime: true },
    });

    const active = reservations.filter((r) => !CANCELLED_LIKE_STATUSES.includes(r.status));
    const cancelled = reservations.filter((r) => CANCELLED_LIKE_STATUSES.includes(r.status));

    const currentlySeated = reservations.filter((r) =>
      ACTIVE_SEATING_STATUSES.includes(r.status)
    );

    const nowMinutes = isToday ? timeToMinutes(nowTimeString()) : null;
    const upcoming = active.filter((r) => {
      if (!FUTURE_STATUSES.includes(r.status)) return false;
      if (nowMinutes === null) return true; // 過去日は0扱いにするため後段でフィルタ
      return timeToMinutes(r.startTime) >= nowMinutes;
    });

    const seatedPartySize = currentlySeated.reduce((sum, r) => sum + r.partySize, 0);

    return NextResponse.json({
      date: dateStr,
      isToday,
      reservationCount: active.length,
      totalPartySize: active.reduce((sum, r) => sum + r.partySize, 0),
      currentlySeatedCount: seatedPartySize,
      upcomingPartySize: dateStr < todayDateString() ? 0 : upcoming.reduce((s, r) => s + r.partySize, 0),
      cancelledCount: cancelled.length,
      seatsTotal: store.seatsTotal,
      availableSeatsNow: Math.max(store.seatsTotal - seatedPartySize, 0),
      storeName: store.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function nowTimeString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCHours().toString().padStart(2, "0")}:${jst
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}
