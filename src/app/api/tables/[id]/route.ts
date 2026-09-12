import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tableInputSchema } from "@/lib/validation";
import { requireActor, handleApiError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireActor();
    const { id } = await ctx.params;
    const input = tableInputSchema.partial().parse(await req.json());
    const table = await prisma.table.update({ where: { id }, data: input });
    return NextResponse.json({ table });
  } catch (error) {
    return handleApiError(error);
  }
}
