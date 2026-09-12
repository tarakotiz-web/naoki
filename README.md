# Cafe & Restaurant NODE — 予約管理システム

飲食店向け予約管理システム(PHASE 1〜10実装済み)。将来的に SORA FOOD PORTAL の一機能として統合する前提で設計している。

## 技術スタック

- Next.js 16 (App Router, TypeScript, Turbopack)
- PostgreSQL + Prisma 6
- NextAuth v5 (Credentials + JWTセッション、スタッフ用)
- LINE Messaging API / LIFF (`@line/bot-sdk`, `@line/liff`、お客様用)
- Tailwind CSS v4(Azure / ホワイト / ブラック / ゴールドのデザインシステム)

## セットアップ

```bash
npm install
cp .env.example .env   # DATABASE_URL, AUTH_SECRET を設定
npx prisma migrate dev
npm run db:seed        # 店舗・テーブル・予約経路・スタッフアカウントの初期データ投入
npm run dev
```

シードで作成されるログイン情報:

| メール | パスワード | ロール |
| --- | --- | --- |
| admin@node-cafe.example | password123 | ADMIN |
| staff@node-cafe.example | password123 | STAFF |

## ディレクトリ構成

```
prisma/schema.prisma        DBスキーマ(stores/tables/customers/reservations/...)
prisma/seed.ts              初期データ投入スクリプト
src/server/                 サーバーサイドのビジネスロジック
  availability.ts           予約可能判定・キャパシティ計算(唯一のロジック)
  reservations.ts           予約CRUD・ステータス変更(LINEもスタッフもここを呼ぶ)
  customers.ts               顧客照合(電話番号キー)
  analytics.ts               分析集計
  line/                      LINE連携サービス層(予約本体から疎結合)
    config.ts                 環境変数まとめ
    client.ts                 push/reply送信(未設定時はconsole.logにフォールバック)
    verify-id-token.ts        LIFF IDトークン検証
    customer-link.ts           LINEユーザー⇄顧客の紐付け
    reservations.ts             LINE予約の作成/一覧/変更/キャンセル
    webhook-handler.ts          Webhookイベントへの返信ロジック
  notifications.ts           予約ライフサイクル通知(reservations.tsからは呼ばれない。要件24)
src/lib/                    共通ユーティリティ・バリデーション・定数
src/app/api/                REST APIルート
  reservations/, customers/, tables/, calendar/, walk-in/   スタッフUI向け(要NextAuthログイン)
  line/                      LIFF/Webhook向け(要LIFF IDトークン or 署名検証)
  cron/reminders/            前日/当日リマインド送信(要CRON_SECRET)
  external/v1/               外部連携向け読み取り専用API(要EXTERNAL_API_KEY)
src/app/(main)/              スタッフ向け画面(予約台帳・カレンダー・顧客管理・テーブル管理・分析)
src/app/liff/                お客様向けLIFF画面(予約フォーム・予約確認/変更/キャンセル)
src/components/             UIコンポーネント
```

## 設計上の要点

- **店舗情報はDB管理**: `stores` テーブルに営業時間・定休日・席数・タイムゾーンを保持。ハードコーディングなし。多店舗展開時は `stores` に行を追加し、`users.storeId` でスタッフを割り当てるだけで対応可能。
- **予約可能判定ロジックは単一**: `src/server/availability.ts` の `checkAvailability()` が唯一の判定ロジック。スタッフ手入力・WALK-IN・LINE予約はすべて `src/server/reservations.ts` の `createReservation()` / `updateReservation()` を経由する。判定ロジックを二重実装しないこと。
- **顧客情報とLINE情報を分離**: `customers` テーブルと `line_users` テーブルを分離し、電話番号を基本キーに顧客照合する。LINEユーザーIDのみに依存しない(`src/server/line/customer-link.ts`)。
- **予約変更履歴**: `reservation_logs` にすべての変更(作成・時間変更・ステータス変更・キャンセル)を記録。
- **予約経路(source)はDB管理**: `reservation_sources` テーブルで管理し、将来のチャネル追加に対応。
- **通知は予約本体と疎結合**: `src/server/notifications.ts` は `reservations.ts` から一切importされない。API route層が「予約を更新する→通知する」の2手順を明示的に呼び出す構成(要件24)。

## LINE連携(PHASE 7〜9)

### 必要な準備(店舗側)

1. [LINE Developersコンソール](https://developers.line.biz/console/)でプロバイダー・チャネル(Messaging API)を作成
2. チャネルシークレット・チャネルアクセストークンを取得
3. LIFFアプリを2つ作成し、それぞれのエンドポイントURLを設定
   - 予約フォーム: `https://<デプロイ先ドメイン>/liff/reservation`
   - 予約確認・変更: `https://<デプロイ先ドメイン>/liff/my-reservations`
   - (どちらも同じLIFF IDを使う場合は、アプリ内でパスを見て出し分ける形でも可。現状は1つの `NEXT_PUBLIC_LINE_LIFF_ID` を共通で使う設計)
4. Webhook URLに `https://<デプロイ先ドメイン>/api/line/webhook` を設定し、Webhookを有効化
5. `.env` に以下を設定

```bash
LINE_CHANNEL_ID="..."
LINE_CHANNEL_SECRET="..."
LINE_CHANNEL_ACCESS_TOKEN="..."
NEXT_PUBLIC_LINE_LIFF_ID="..."
```

これらが空のままでも動作する(Webhookは黙って200を返し、push/reply送信はconsole.logへのフォールバックになり、LIFFページは「LINE連携は準備中です」を表示する)。**したがってこの環境では実際のLINEアプリからの疎通確認はできていない。** 上記の値を設定し、実機のLINEアプリからWebhook/LIFFにアクセスして初めて実際の送受信を確認できる。

### データフロー

```
LINEアプリ(お客様)
  ↓ リッチメニュー/トークで案内 → LIFFを開く
LIFF (src/app/liff/*)
  ↓ liff.getIDToken() で本人確認用トークン取得
Reservation API (src/app/api/line/reservations/*)
  ↓ verifyLineIdToken() でLINE本人確認 → 同じ createReservation()/checkAvailability() を呼ぶ
Database (Prisma)
```

Webhook(`src/app/api/line/webhook/route.ts`)は署名検証をして「予約する」等のガイド返信のみを行い、予約データの読み書きはしない(常にLIFF経由でReservation APIを呼ぶ)。

### 予約変更・キャンセル

`/liff/my-reservations` から、ステータスが「予約受付」「予約確定」の間のみ日時・人数の変更とキャンセルができる。すべて `updateReservation()` / `cancelReservation()` を経由するため、スタッフ側の予約台帳にも即時反映される。

## 通知(PHASE 10)

`src/server/notifications.ts` が予約作成・確定・変更・キャンセル時にLINE連携済みの顧客へpushメッセージを送る(LINE未連携の顧客には何も送らない)。

前日/当日リマインドはアプリ内蔵のスケジューラを持たないため、外部のcron(例: GitHub Actions の `schedule` トリガー、Vercel Cron、サーバーのcrontab)から1日数回、以下を呼び出す運用を想定している。

```bash
curl -X POST https://<デプロイ先ドメイン>/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 分析ダッシュボード(PHASE 10)

`/analytics` (スタッフログイン後) で期間別の予約件数・予約人数・平均人数・LINE/電話予約数・新規/リピーター顧客数・キャンセル率・無断キャンセル率・日別/曜日別/時間帯別グラフ・経路別ランキングを確認できる。集計ロジックは `src/server/analytics.ts`。

## 外部連携API(SORA FOOD PORTAL / Google Calendar 等 向け、PHASE 10)

`src/app/api/external/v1/*` に読み取り専用のAPIを用意している。`x-api-key` ヘッダーに `EXTERNAL_API_KEY` の値を付けて呼び出す。

```bash
curl https://<デプロイ先ドメイン>/api/external/v1/store -H "x-api-key: $EXTERNAL_API_KEY"
curl "https://<デプロイ先ドメイン>/api/external/v1/reservations?from=2026-09-01&to=2026-09-30" -H "x-api-key: $EXTERNAL_API_KEY"
```

将来的にSORA FOOD PORTAL・Google Calendar・Instagram連携を追加する場合は、この `external/v1` 配下にエンドポイントを増やしていく想定。書き込み系(予約の作成等)を外部連携に開放する場合も、必ず `createReservation()` 等の共通ロジックを経由すること。

## 未確認・今後の課題

- 実際のLINE Developersチャネルでの疎通確認(Webhook受信・push配信・LIFFログイン)は本セッションでは実施できていない。
- リッチメニューの作成(画像アップロード・タップ領域設定)はLINE公式アカウントマネージャーまたは`@line/bot-sdk`のRichMenu APIで別途行う必要がある。
- 複数店舗対応は`stores`テーブル自体は用意済みだが、LIFF/外部APIは現状「先頭のアクティブな店舗」を暗黙に使う実装(`getDefaultStoreForPublicAccess()`)。複数店舗が実在する場合はLIFFのクエリパラメータ等で店舗を指定できるよう拡張が必要。
