import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultStoreForPublicAccess } from "@/server/store";
import { dateStringToUTCDate, addDaysToDateString, todayDateString } from "@/lib/time";
import { notifyReservationReminder } from "@/server/notifications";

/**
 * 前日/当日リマインドを送信するエンドポイント。
 * Next.jsにはアプリ内蔵のスケジューラがないため、外部のcron
 * (Vercel Cron / GitHub Actions scheduled workflow / OSのcron等)から
 * 1日1回、 `Authorization: Bearer <CRON_SECRET>` を付けて呼び出す想定。
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRETが未設定です。" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "認証に失敗しました。" }, { status: 401 });
  }

  const store = await getDefaultStoreForPublicAccess();
  const today = todayDateString();
  const tomorrow = addDaysToDateString(today, 1);

  const [todayReservations, tomorrowReservations] = await Promise.all([
    findRemindableReservations(store.id, today),
    findRemindableReservations(store.id, tomorrow),
  ]);

  await Promise.all([
    ...todayReservations.map((r) =>
      notifyReservationReminder(r, "当日").catch((e) => console.error("[reminder] failed", e))
    ),
    ...tomorrowReservations.map((r) =>
      notifyReservationReminder(r, "前日").catch((e) => console.error("[reminder] failed", e))
    ),
  ]);

  return NextResponse.json({
    ok: true,
    todayCount: todayReservations.length,
    tomorrowCount: tomorrowReservations.length,
  });
}

function findRemindableReservations(storeId: string, dateStr: string) {
  return prisma.reservation.findMany({
    where: {
      storeId,
      reservationDate: dateStringToUTCDate(dateStr),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
}
