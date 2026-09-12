import { NextRequest, NextResponse } from "next/server";
import { getCurrentStore } from "@/server/store";
import { computeAnalytics } from "@/server/analytics";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { addDaysToDateString, todayDateString } from "@/lib/time";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const to = req.nextUrl.searchParams.get("to") ?? todayDateString();
    const from = req.nextUrl.searchParams.get("from") ?? addDaysToDateString(to, -29);

    const result = await computeAnalytics(store.id, from, to);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
