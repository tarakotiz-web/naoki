import { NextRequest, NextResponse } from "next/server";
import { computeCapacityForDate } from "@/server/availability";
import { getCurrentStore } from "@/server/store";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { todayDateString } from "@/lib/time";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const dateStr = req.nextUrl.searchParams.get("date") ?? todayDateString();
    const slots = await computeCapacityForDate(store.id, dateStr);
    return NextResponse.json({ date: dateStr, seatsTotal: store.seatsTotal, slots });
  } catch (error) {
    return handleApiError(error);
  }
}
