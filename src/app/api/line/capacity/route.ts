import { NextRequest, NextResponse } from "next/server";
import { computeCapacityForDate } from "@/server/availability";
import { getDefaultStoreForPublicAccess } from "@/server/store";
import { handleApiError } from "@/lib/api-utils";
import { todayDateString } from "@/lib/time";

/**
 * LIFF予約フォームで希望日の空き状況を見せるための公開エンドポイント。
 * 座席数の集計のみを返し、個人情報は含まない。
 */
export async function GET(req: NextRequest) {
  try {
    const store = await getDefaultStoreForPublicAccess();
    const dateStr = req.nextUrl.searchParams.get("date") ?? todayDateString();
    const slots = await computeCapacityForDate(store.id, dateStr);
    return NextResponse.json({
      date: dateStr,
      storeName: store.name,
      openTime: store.openTime,
      closeTime: store.closeTime,
      closedWeekdays: store.closedWeekdays,
      slots,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
