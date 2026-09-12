import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { storeSettingsSchema } from "@/lib/validation";
import { requireActor, requireAdminActor, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireActor();
    const store = await getCurrentStore();
    return NextResponse.json({ store });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminActor();
    const store = await getCurrentStore();
    const input = storeSettingsSchema.parse(await req.json());

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: input,
    });
    return NextResponse.json({ store: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
