import { NextRequest, NextResponse } from "next/server";
import { changeReservationStatus } from "@/server/reservations";
import { statusChangeSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";
import {
  notifyReservationConfirmed,
  notifyReservationCancelled,
} from "@/server/notifications";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    const { id } = await ctx.params;
    const body = await req.json();
    const input = statusChangeSchema.parse(body);

    const reservation = await changeReservationStatus(id, input.status, actor.email, {
      method: input.cancelMethod,
      reason: input.cancelReason,
    });

    if (input.status === "CONFIRMED") {
      notifyReservationConfirmed(reservation).catch((e) => console.error("[notify] failed", e));
    } else if (input.status === "CANCELLED" || input.status === "NO_SHOW") {
      notifyReservationCancelled(reservation).catch((e) => console.error("[notify] failed", e));
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    return handleApiError(error);
  }
}
