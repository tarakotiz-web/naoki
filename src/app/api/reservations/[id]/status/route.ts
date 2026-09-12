import { NextRequest, NextResponse } from "next/server";
import { changeReservationStatus } from "@/server/reservations";
import { statusChangeSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";

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
    return NextResponse.json({ reservation });
  } catch (error) {
    return handleApiError(error);
  }
}
