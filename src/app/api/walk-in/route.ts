import { NextRequest, NextResponse } from "next/server";
import { getCurrentStore } from "@/server/store";
import { createWalkIn } from "@/server/reservations";
import { walkInSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireActor();
    const store = await getCurrentStore();
    const body = await req.json();
    const input = walkInSchema.parse(body);

    const reservation = await createWalkIn(store.id, input, actor.email);
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
