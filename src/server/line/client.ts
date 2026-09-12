import { messagingApi } from "@line/bot-sdk";
import { lineConfig, isLineMessagingConfigured } from "./config";

let cachedClient: messagingApi.MessagingApiClient | null = null;

function getClient(): messagingApi.MessagingApiClient | null {
  if (!isLineMessagingConfigured()) return null;
  if (!cachedClient) {
    cachedClient = new messagingApi.MessagingApiClient({
      channelAccessToken: lineConfig.channelAccessToken,
    });
  }
  return cachedClient;
}

/**
 * LINEユーザーへメッセージをプッシュ送信する。
 * チャネル未設定の環境(ローカル検証時など)ではエラーにせず、送信内容をログ出力するだけに留める。
 */
export async function pushLineMessage(to: string, messages: messagingApi.Message[]): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log("[LINE] 未設定のためpush送信をスキップしました:", to, JSON.stringify(messages));
    return;
  }
  try {
    await client.pushMessage({ to, messages });
  } catch (error) {
    console.error("[LINE] push送信に失敗しました:", error);
  }
}

export async function replyLineMessage(
  replyToken: string,
  messages: messagingApi.Message[]
): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log("[LINE] 未設定のため返信をスキップしました:", replyToken, JSON.stringify(messages));
    return;
  }
  try {
    await client.replyMessage({ replyToken, messages });
  } catch (error) {
    console.error("[LINE] 返信に失敗しました:", error);
  }
}
