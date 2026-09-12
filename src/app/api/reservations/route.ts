import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { createReservation, AvailabilityError } from "@/server/reservations";
import { reservationCreateSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { dateStringToUTCDate, todayDateString } from "@/lib/time";
import { notifyReservationCreated } from "@/server/notifications";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const dateStr = req.nextUrl.searchParams.get("date") ?? todayDateString();

    const reservations = await prisma.reservation.findMany({
      where: {
        storeId: store.id,
        reservationDate: dateStringToUTCDate(dateStr),
      },
      include: {
        tables: { include: { table: true } },
        source: true,
        customer: true,
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ reservations, date: dateStr });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireActor();
    const store = await getCurrentStore();
    const body = await req.json();
    const input = reservationCreateSchema.parse(body);

    const reservation = await createReservation(store.id, input, actor.email);
    notifyReservationCreated(reservation).catch((e) => console.error("[notify] failed", e));
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof AvailabilityError) return handleApiError(error);
    return handleApiError(error);
  }
}
