import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateReservation } from "@/server/reservations";
import { reservationUpdateSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireActor();
    const { id } = await ctx.params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        tables: { include: { table: true } },
        source: true,
        customer: true,
        lineUser: true,
        logs: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!reservation) {
      return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ reservation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    const { id } = await ctx.params;
    const body = await req.json();
    const patch = reservationUpdateSchema.parse(body);
    const reservation = await updateReservation(id, patch, actor.email);
    return NextResponse.json({ reservation });
  } catch (error) {
    return handleApiError(error);
  }
}
