# Cafe & Restaurant NODE — 予約管理システム

飲食店向け予約管理システム(PHASE 1〜6実装済み)。将来的に SORA FOOD PORTAL の一機能として統合する前提で設計している。

## 技術スタック

- Next.js 16 (App Router, TypeScript, Turbopack)
- PostgreSQL + Prisma 6
- NextAuth v5 (Credentials + JWTセッション)
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
src/server/                 サーバーサイドのビジネスロジック(予約可能判定・予約CRUD・顧客照合)
src/lib/                    共通ユーティリティ・バリデーション・定数
src/app/api/                REST APIルート(スタッフUI・将来のLINE連携が両方ここを利用する)
src/app/(main)/              スタッフ向け画面(予約台帳・カレンダー・顧客管理・テーブル管理)
src/components/             UIコンポーネント
```

## 設計上の要点

- **店舗情報はDB管理**: `stores` テーブルに営業時間・定休日・席数・タイムゾーンを保持。ハードコーディングなし。多店舗展開時は `stores` に行を追加し、`users.storeId` でスタッフを割り当てるだけで対応可能。
- **予約可能判定ロジックは単一**: `src/server/availability.ts` の `checkAvailability()` が唯一の判定ロジック。スタッフ手入力・WALK-IN・将来のLINE予約はすべてこの関数と `src/server/reservations.ts` の `createReservation()` / `updateReservation()` を経由する。判定ロジックを二重実装しないこと。
- **顧客情報とLINE情報を分離**: `customers` テーブルと `line_users` テーブルを分離し、電話番号を基本キーに顧客照合する。LINEユーザーIDのみに依存しない。
- **予約変更履歴**: `reservation_logs` にすべての変更(作成・時間変更・ステータス変更・キャンセル)を記録。
- **予約経路(source)はDB管理**: `reservation_sources` テーブルで管理し、将来のチャネル追加(LINE, Instagram等)に対応。

## 未実装(PHASE 7〜10)

LINE公式アカウント連携(LIFF予約フォーム・Messaging API Webhook)、分析ダッシュボード、通知機能、SORA FOOD PORTAL統合は未実装。設計方針:

- LINE関連処理は `src/app/api/line/*` のような独立ルートに分離し、`src/server/reservations.ts` の既存関数(`createReservation` 等)を呼び出す構成にする(予約本体と密結合させない)。
- Webhook受信 → 署名検証 → 同じ `checkAvailability` / `createReservation` を呼ぶ、という流れを守ることで「スタッフ手入力とLINE予約で別々の予約システムを作らない」という要件を満たす。
