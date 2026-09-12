import { NextRequest, NextResponse } from "next/server";
import { validateSignature, type webhook } from "@line/bot-sdk";
import { lineConfig, isLineMessagingConfigured } from "@/server/line/config";
import { handleLineWebhookEvent } from "@/server/line/webhook-handler";

/**
 * LINE Messaging APIのWebhook受信エンドポイント。
 * 署名検証 → イベント処理 のみを行い、予約データの操作はしない
 * (予約本体はReservation API/LIFF経由の同じロジックで行う。要件20)。
 */
export async function POST(req: NextRequest) {
  if (!isLineMessagingConfigured()) {
    // チャネル未設定環境ではWebhookの検証ができないため、常に200を返して黙って無視する。
    return NextResponse.json({ ok: true, note: "LINE未設定" });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!validateSignature(rawBody, lineConfig.channelSecret, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let events: webhook.Event[] = [];
  try {
    events = JSON.parse(rawBody).events ?? [];
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await Promise.all(
    events.map((event) =>
      handleLineWebhookEvent(event).catch((e) => console.error("[LINE webhook] event失敗", e))
    )
  );

  return NextResponse.json({ ok: true });
}
