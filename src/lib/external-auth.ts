// SORA FOOD PORTAL など、外部システムからこのAPIを利用するための簡易APIキー認証。
// 将来的に店舗ごと・連携先ごとにキーを発行する場合は、ここをDBテーブル参照に差し替える。

export class ExternalAuthError extends Error {}

export function requireExternalApiKey(req: Request): void {
  const expected = process.env.EXTERNAL_API_KEY;
  if (!expected) {
    throw new ExternalAuthError("EXTERNAL_API_KEYが未設定のため、外部連携APIは無効化されています。");
  }
  const provided = req.headers.get("x-api-key") ?? "";
  if (provided !== expected) {
    throw new ExternalAuthError("APIキーが正しくありません。");
  }
}
