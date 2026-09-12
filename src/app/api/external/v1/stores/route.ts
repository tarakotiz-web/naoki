import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireExternalApiKey } from "@/lib/external-auth";
import { handleApiError } from "@/lib/api-utils";

/**
 * 複数店舗運用時、外部システム(SORA FOOD PORTAL等)が店舗一覧を取得するためのAPI。
 * 個々の店舗の詳細・予約は `?store=<slug>` を付けて他の external API を呼び出す。
 */
export async function GET(req: Request) {
  try {
    requireExternalApiKey(req);
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, seatsTotal: true, openTime: true, closeTime: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ stores });
  } catch (error) {
    return handleApiError(error);
  }
}
