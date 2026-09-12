import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireExternalApiKey } from "@/lib/external-auth";
import { getDefaultStoreForPublicAccess } from "@/server/store";
import { handleApiError } from "@/lib/api-utils";
import { dateStringToUTCDate, todayDateString } from "@/lib/time";

/**
 * SORA FOOD PORTAL等の外部システムから予約状況を参照するための読み取り専用API。
 * `x-api-key` ヘッダーでの認証が必要(EXTERNAL_API_KEY環境変数)。
 * 将来的にGoogle Calendar連携やポータル側ダッシュボードから利用する想定の土台。
 */
export async function GET(req: NextRequest) {
  try {
    requireExternalApiKey(req);
    const store = await getDefaultStoreForPublicAccess(req.nextUrl.searchParams.get("store"));
    const from = req.nextUrl.searchParams.get("from") ?? todayDateString();
    const to = req.nextUrl.searchParams.get("to") ?? from;

    const reservations = await prisma.reservation.findMany({
      where: {
        storeId: store.id,
        reservationDate: { gte: dateStringToUTCDate(from), lte: dateStringToUTCDate(to) },
      },
      select: {
        id: true,
        reservationDate: true,
        startTime: true,
        durationMinutes: true,
        partySize: true,
        status: true,
        source: { select: { code: true } },
      },
      orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      store: store.name,
      from,
      to,
      reservations: reservations.map((r) => ({
        id: r.id,
        date: r.reservationDate.toISOString().slice(0, 10),
        startTime: r.startTime,
        durationMinutes: r.durationMinutes,
        partySize: r.partySize,
        status: r.status,
        source: r.source.code,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
