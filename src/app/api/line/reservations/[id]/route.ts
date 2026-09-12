import { NextRequest, NextResponse } from "next/server";
import { requireLineIdentity } from "@/server/line/verify-id-token";
import { updateLineReservation } from "@/server/line/reservations";
import { lineReservationUpdateSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";
import { notifyReservationChanged } from "@/server/notifications";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireLineIdentity(req);
    const { id } = await ctx.params;
    const patch = lineReservationUpdateSchema.parse(await req.json());
    const reservation = await updateLineReservation(identity, id, patch);
    notifyReservationChanged(reservation).catch((e) => console.error("[notify] failed", e));
    return NextResponse.json({ reservation });
  } catch (error) {
    return handleApiError(error);
  }
}
