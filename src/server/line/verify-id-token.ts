import { lineConfig } from "./config";

export interface LineIdentity {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
}

export class LineAuthError extends Error {}

/**
 * LIFFから送られてきた ID Token をLINEのサーバーに照会して検証する。
 * クライアントが送ってきた lineUserId を無条件に信用しないこと
 * (なりすまし防止のため、必ずこの検証を経由したユーザーIDのみを使用する)。
 */
export async function verifyLineIdToken(idToken: string): Promise<LineIdentity> {
  if (!lineConfig.channelId) {
    throw new LineAuthError("LINEログイン(チャネルID)が設定されていません。");
  }
  if (!idToken) {
    throw new LineAuthError("IDトークンがありません。");
  }

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: lineConfig.channelId }),
  });

  if (!res.ok) {
    throw new LineAuthError("LINEログイン情報の検証に失敗しました。");
  }

  const data = (await res.json()) as { sub?: string; name?: string; picture?: string };
  if (!data.sub) {
    throw new LineAuthError("LINEユーザーIDを取得できませんでした。");
  }

  return { lineUserId: data.sub, displayName: data.name, pictureUrl: data.picture };
}

/** Authorization: Bearer <idToken> ヘッダーからLINE本人確認を行う共通ヘルパー。 */
export async function requireLineIdentity(req: Request): Promise<LineIdentity> {
  const auth = req.headers.get("authorization") ?? "";
  const idToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return verifyLineIdToken(idToken);
}
