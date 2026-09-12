import type { webhook } from "@line/bot-sdk";
import { replyLineMessage } from "./client";
import { lineConfig } from "./config";

function liffUrl(path: string): string {
  if (!lineConfig.liffId) return "";
  return `https://liff.line.me/${lineConfig.liffId}${path}`;
}

const RESERVE_URL = liffUrl("/reservation");
const MY_RESERVATIONS_URL = liffUrl("/my-reservations");

function guideMessage(): string {
  const lines = ["Cafe & Restaurant NODEの公式LINEです。"];
  if (RESERVE_URL) lines.push(`ご予約はこちら: ${RESERVE_URL}`);
  if (MY_RESERVATIONS_URL) lines.push(`予約の確認・変更・キャンセルはこちら: ${MY_RESERVATIONS_URL}`);
  if (!RESERVE_URL) lines.push("(LIFF未設定のため予約リンクは準備中です)");
  return lines.join("\n");
}

/**
 * LINEプラットフォームからのWebhookイベントを1件処理する。
 * この層は「返信する」ことだけに責務を絞り、予約データの読み書きは行わない
 * (予約の作成・変更・キャンセルはLIFF経由でReservation APIを直接呼ぶ構成)。
 */
export async function handleLineWebhookEvent(event: webhook.Event): Promise<void> {
  if (event.type === "follow" && event.replyToken) {
    await replyLineMessage(event.replyToken, [
      { type: "text", text: `友だち追加ありがとうございます!\n\n${guideMessage()}` },
    ]);
    return;
  }

  if (event.type === "message" && event.message.type === "text" && event.replyToken) {
    const text = event.message.text;
    if (text.includes("予約") || text.includes("キャンセル") || text.includes("確認")) {
      await replyLineMessage(event.replyToken, [{ type: "text", text: guideMessage() }]);
    } else {
      await replyLineMessage(event.replyToken, [
        {
          type: "text",
          text: "メッセージありがとうございます。ご予約・変更・キャンセルは下記からどうぞ。\n\n" + guideMessage(),
        },
      ]);
    }
    return;
  }

  if (event.type === "postback" && event.replyToken) {
    // リッチメニューのpostbackアクション例: "action=reserve" / "action=my_reservations"
    await replyLineMessage(event.replyToken, [{ type: "text", text: guideMessage() }]);
    return;
  }

  // unfollow等、返信不要なイベントは無視する
}
