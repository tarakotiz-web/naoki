import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerDetail } from "@/server/customers";
import { requireActor, handleApiError } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireActor();
    const { id } = await ctx.params;
    const customer = await getCustomerDetail(id);
    if (!customer) return NextResponse.json({ error: "顧客が見つかりません。" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({ notes: z.string().max(2000).optional() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireActor();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const customer = await prisma.customer.update({ where: { id }, data: body });
    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}
