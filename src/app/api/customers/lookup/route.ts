import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { normalizePhone } from "@/server/customers";
import { requireActor, handleApiError } from "@/lib/api-utils";

/** 予約登録フォームで電話番号入力時に既存顧客を即座に照会するためのAPI。 */
export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const phone = req.nextUrl.searchParams.get("phone");
    if (!phone) return NextResponse.json({ customer: null });

    const customer = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId: store.id, phone: normalizePhone(phone) } },
      include: {
        lineUser: true,
        reservations: {
          orderBy: [{ reservationDate: "desc" }, { startTime: "desc" }],
          take: 5,
        },
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}
