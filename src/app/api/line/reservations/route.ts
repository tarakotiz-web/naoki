import { NextRequest, NextResponse } from "next/server";
import { requireLineIdentity } from "@/server/line/verify-id-token";
import { createLineReservation, listLineReservations } from "@/server/line/reservations";
import { lineReservationCreateSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";
import { notifyReservationCreated } from "@/server/notifications";

export async function GET(req: Request) {
  try {
    const identity = await requireLineIdentity(req);
    const reservations = await listLineReservations(identity);
    return NextResponse.json({ reservations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await requireLineIdentity(req);
    const input = lineReservationCreateSchema.parse(await req.json());
    const reservation = await createLineReservation(identity, input);
    notifyReservationCreated(reservation).catch((e) => console.error("[notify] failed", e));
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
