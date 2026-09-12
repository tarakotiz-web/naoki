import { NextRequest, NextResponse } from "next/server";
import { getCurrentStore } from "@/server/store";
import { searchCustomers } from "@/server/customers";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { dateStringToUTCDate } from "@/lib/time";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const params = req.nextUrl.searchParams;
    const name = params.get("name") ?? undefined;
    const phone = params.get("phone") ?? undefined;
    const dateStr = params.get("date") ?? undefined;

    const customers = await searchCustomers({
      storeId: store.id,
      name,
      phone,
      reservationDate: dateStr ? dateStringToUTCDate(dateStr) : undefined,
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}
