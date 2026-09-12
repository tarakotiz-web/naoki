import { NextResponse } from "next/server";
import { requireExternalApiKey } from "@/lib/external-auth";
import { getDefaultStoreForPublicAccess } from "@/server/store";
import { handleApiError } from "@/lib/api-utils";

/**
 * SORA FOOD PORTAL等の外部システム向け店舗情報API。
 * `x-api-key` ヘッダーでの認証が必要(EXTERNAL_API_KEY環境変数)。
 */
export async function GET(req: Request) {
  try {
    requireExternalApiKey(req);
    const store = await getDefaultStoreForPublicAccess();
    return NextResponse.json({
      id: store.id,
      name: store.name,
      phone: store.phone,
      address: store.address,
      seatsTotal: store.seatsTotal,
      openTime: store.openTime,
      closeTime: store.closeTime,
      closedWeekdays: store.closedWeekdays,
      timezone: store.timezone,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
