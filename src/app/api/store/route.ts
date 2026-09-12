import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { requireActor, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const [tables, sources] = await Promise.all([
      prisma.table.findMany({ where: { storeId: store.id }, orderBy: { sortOrder: "asc" } }),
      prisma.reservationSource.findMany({
        where: { storeId: store.id, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    return NextResponse.json({ store, tables, sources });
  } catch (error) {
    return handleApiError(error);
  }
}
