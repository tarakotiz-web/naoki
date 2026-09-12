/**
 * LINEリッチメニューのセットアップスクリプト。
 *
 * 実行すると
 *   1. ブランドカラー(Azure/ブラック/ゴールド)に沿ったリッチメニュー画像をSVG→PNGで生成
 *   2. LINE Messaging APIにリッチメニューを作成
 *   3. 画像をアップロード
 *   4. 全ユーザー向けデフォルトリッチメニューとして設定
 * まで行う。
 *
 * 実行には実際のLINEチャネルの LINE_CHANNEL_ACCESS_TOKEN と、
 * LIFF予約フォームの NEXT_PUBLIC_LINE_LIFF_ID が必要(.envを参照する)。
 * どちらも未設定の場合は何もせずエラーで終了する。
 *
 * 使い方:
 *   npx tsx scripts/setup-line-richmenu.ts
 *
 * 画像のレンダリングにはシステムに日本語フォント(Noto Sans JP / IPAGothic等)が
 * インストールされている必要がある(文字化け・トウフ表示になる場合はフォントを確認)。
 */
import "dotenv/config";
import sharp from "sharp";
import { messagingApi } from "@line/bot-sdk";

const WIDTH = 2500;
const HEIGHT = 1686;

const AZURE = "#0a7cff";
const BLACK = "#14171c";
const GOLD = "#b8912f";
const WHITE = "#ffffff";

export function buildSvg(): string {
  const half = WIDTH / 2;
  const fontFamily = "'Noto Sans JP','Hiragino Sans','IPAGothic','Yu Gothic',sans-serif";

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${half}" height="${HEIGHT}" fill="${AZURE}" />
  <rect x="${half}" y="0" width="${half}" height="${HEIGHT}" fill="${BLACK}" />
  <rect x="${half - 4}" y="0" width="8" height="${HEIGHT}" fill="${GOLD}" />

  <text x="${half / 2}" y="${HEIGHT / 2 - 60}" font-family="${fontFamily}" font-size="150" font-weight="700" fill="${WHITE}" text-anchor="middle">ご予約</text>
  <text x="${half / 2}" y="${HEIGHT / 2 + 70}" font-family="${fontFamily}" font-size="56" font-weight="500" fill="${WHITE}" fill-opacity="0.9" text-anchor="middle">空き状況を確認して予約する</text>

  <text x="${half + half / 2}" y="${HEIGHT / 2 - 60}" font-family="${fontFamily}" font-size="120" font-weight="700" fill="${GOLD}" text-anchor="middle">予約確認・変更</text>
  <text x="${half + half / 2}" y="${HEIGHT / 2 + 70}" font-family="${fontFamily}" font-size="56" font-weight="500" fill="${WHITE}" fill-opacity="0.85" text-anchor="middle">変更・キャンセルはこちら</text>

  <text x="${WIDTH / 2}" y="${HEIGHT - 60}" font-family="${fontFamily}" font-size="40" fill="${GOLD}" text-anchor="middle" fill-opacity="0.8">Cafe &amp; Restaurant NODE</text>
</svg>`;
}

async function main() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  if (!channelAccessToken) {
    throw new Error(
      "LINE_CHANNEL_ACCESS_TOKEN が未設定です。LINE Developersコンソールでチャネルを作成し、.envに設定してから実行してください。"
    );
  }
  if (!liffId) {
    throw new Error("NEXT_PUBLIC_LINE_LIFF_ID が未設定です。LIFFアプリを作成し、.envに設定してから実行してください。");
  }

  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  const blobClient = new messagingApi.MessagingApiBlobClient({ channelAccessToken });

  console.log("1/4: リッチメニュー画像を生成しています...");
  const svg = buildSvg();
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  console.log("2/4: リッチメニューを作成しています...");
  const { richMenuId } = await client.createRichMenu({
    size: { width: WIDTH, height: HEIGHT },
    selected: true,
    name: "NODE予約メニュー",
    chatBarText: "メニュー",
    areas: [
      {
        bounds: { x: 0, y: 0, width: WIDTH / 2, height: HEIGHT },
        action: { type: "uri", uri: `https://liff.line.me/${liffId}/reservation`, label: "ご予約する" },
      },
      {
        bounds: { x: WIDTH / 2, y: 0, width: WIDTH / 2, height: HEIGHT },
        action: {
          type: "uri",
          uri: `https://liff.line.me/${liffId}/my-reservations`,
          label: "予約確認・変更",
        },
      },
    ],
  });
  console.log(`   richMenuId = ${richMenuId}`);

  console.log("3/4: 画像をアップロードしています...");
  await blobClient.setRichMenuImage(richMenuId, new Blob([new Uint8Array(pngBuffer)], { type: "image/png" }));

  console.log("4/4: デフォルトリッチメニューとして設定しています...");
  await client.setDefaultRichMenu(richMenuId);

  console.log("\n完了しました。LINEアプリでトーク画面を開き直すとメニューが表示されます。");
}

main().catch((error) => {
  console.error("リッチメニューのセットアップに失敗しました:", error);
  process.exit(1);
});
