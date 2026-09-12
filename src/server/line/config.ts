// LINE連携の設定値。実際のLINE Developersアカウント(チャネル)を作成するまでは
// すべて空文字のままで動作し、送信系の処理は console.log にフォールバックする。

export const lineConfig = {
  channelId: process.env.LINE_CHANNEL_ID ?? "",
  channelSecret: process.env.LINE_CHANNEL_SECRET ?? "",
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
  // クライアント(LIFFページ)からも同じ値を参照するため NEXT_PUBLIC_ 接頭辞を使う。
  liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID ?? "",
};

/** Messaging API(push/reply送信・Webhook署名検証)が使える状態か。 */
export function isLineMessagingConfigured(): boolean {
  return Boolean(lineConfig.channelSecret && lineConfig.channelAccessToken);
}

/** LIFF IDトークン検証(ログイン確認)が使える状態か。 */
export function isLineLoginConfigured(): boolean {
  return Boolean(lineConfig.channelId);
}
