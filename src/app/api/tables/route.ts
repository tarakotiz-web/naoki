import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStore } from "@/server/store";
import { tableInputSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const tables = await prisma.table.findMany({
      where: { storeId: store.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ tables });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const input = tableInputSchema.parse(await req.json());
    const count = await prisma.table.count({ where: { storeId: store.id } });
    const table = await prisma.table.create({
      data: { storeId: store.id, ...input, sortOrder: input.sortOrder ?? count },
    });
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
