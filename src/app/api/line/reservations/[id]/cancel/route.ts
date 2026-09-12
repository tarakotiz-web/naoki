import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireLineIdentity } from "@/server/line/verify-id-token";
import { cancelLineReservation } from "@/server/line/reservations";
import { handleApiError } from "@/lib/api-utils";
import { notifyReservationCancelled } from "@/server/notifications";

const schema = z.object({ reason: z.string().max(500).optional() });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireLineIdentity(req);
    const { id } = await ctx.params;
    const { reason } = schema.parse(await req.json().catch(() => ({})));
    const reservation = await cancelLineReservation(identity, id, reason);
    notifyReservationCancelled(reservation).catch((e) => console.error("[notify] failed", e));
    return NextResponse.json({ reservation });
  } catch (error) {
    return handleApiError(error);
  }
}
