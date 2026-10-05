# 引き継ぎメモ: プロジェクト状態・決定事項・注意点

最終更新: 2026-10-05。別PCへの作業引き継ぎ用にまとめたもの。

## プロジェクト概要

Cafe & Restaurant NODE(38席、11:00-18:00営業、月曜定休)向けの予約管理システム。PHASE 1〜10実装済み、本番稼働中。詳細は `README.md` を参照。

## 本番環境

- **アプリ**: Vercel(team: `tarakotiz-web`, project: `naoki`)、本番URL `https://naoki-umber.vercel.app`
- **DB**: Neon Postgres(project名「green-hat-72763176」)。Neonの「SQL Editor」(Web)から操作してきた(ローカルCLI不使用)
- **GitHub**: `tarakotiz-web/naoki`、ブランチ `claude/node-reservation-system-mynd7d`(= このリポジトリのデフォルトブランチ。他に`main`等は存在しない)

## ログイン情報(シード)

| メール | パスワード | ロール |
|---|---|---|
| admin@node-cafe.example | password123 | ADMIN |
| staff@node-cafe.example | password123 | STAFF |

パスワード変更画面は未実装。本番運用前に変更したい場合は追加実装が必要(DBを直接更新するか、画面を作るか)。

## 守るべき設計上の決定(勝手に変えないこと)

- **予約可否判定ロジックは `src/server/availability.ts` の `checkAvailability()` のみ**。スタッフ手入力・WALK-IN・LINE予約すべてがこれを経由する(`src/server/reservations.ts`の`createReservation()`/`updateReservation()`)。二重実装しない
- **通知(`src/server/notifications.ts`)は `reservations.ts` から一切importしない**。疎結合を保つ(要件24)。通知はAPI route層で明示的に呼び出す
- **顧客照合は電話番号がキー**。LINEユーザーIDのみに依存しない(`src/server/line/customer-link.ts`)
- **店舗情報は`stores`テーブル管理、ハードコーディングなし**。多店舗展開時は行を追加するだけで対応できる設計

## LINE連携の現状(2026-10-05時点)

- **Messaging APIチャネル「Node」**(プロバイダ「node」、チャネルID `2011571613`): 既存の公式アカウント本体。フォロワー約4,852人
  - **Webhookはオーナーが意図的にOFFにしている**(2026-09-18、「予約」とメッセージを送ったらテスト返信が来てしまったため停止)。再開するだけなら、LINE Developersコンソール → Node → Messaging API設定 → 「Webhookの利用」をONに戻すだけでよい。**コード側の変更は不要**(一時対応としてコードで止める案も検討したが、結局コンソール側のトグルで止めたのでコードは未変更のまま)
- **LINEログインチャネル「cafe node」**(同じく「node」プロバイダ内、チャネルID `2011571685`): LIFF専用チャネル。顧客からは見えない裏方(友だち追加等は一切できない)
  - LIFFアプリ「予約」作成済み。**LIFF ID: `2011571685-8oIng4oI`**
  - **要確認タスク1**: エンドポイントURLを `https://naoki-umber.vercel.app/liff/reservation` から **`https://naoki-umber.vercel.app/liff`** に修正したか未確認。修正しないと、リッチメニューの2つ目のボタン(予約確認・変更)やLIFF URLへの追加パス付与が二重パスになり404になる
  - **要確認タスク2**: チャネルの公開申請が完了したか未確認。「テスト中」のままだと一般ユーザー(非デベロッパー)がLIFFを開くと `400 Bad Request / This channel is now developing status` エラーになる。公開には**プライバシーポリシーURL**が必須で、`https://naoki-umber.vercel.app/privacy` を用意済み(このURLを入力して公開手続きを行う)
- **リッチメニュー**: ブランドカラー(Azure/黒/ゴールド)のメニュー画像は生成済み・ユーザーに送付済みだが、LINE公式アカウントマネージャー(manager.line.biz)での登録作業はまだ未完了。画像は `scripts/setup-line-richmenu.ts` の `buildSvg()` から再生成可能(`npx tsx` + `sharp`で、日本語フォント`Noto Sans JP`/`IPAGothic`が必要)
  - 登録時のリンク設定(エンドポイントURL修正後の想定):
    - 左ボタン(ご予約): `https://liff.line.me/2011571685-8oIng4oI/reservation`
    - 右ボタン(予約確認・変更): `https://liff.line.me/2011571685-8oIng4oI/my-reservations`
  - **公開は即座に全フォロワーに影響する**ため、先に表示期間を遅らせる、または自分のLINEトークに直接LIFFリンクを送って動作確認してから「すべての友だち」に公開する運用にしていた
- Messaging APIアクセストークンが過去に(デプロイ作業中の)スクリーンショットで一度チャット上に表示されてしまったことがある。実害は確認されていないが、念のため**再発行を推奨**(未実施)

## 未完了・要フォローアップ一覧

1. 「cafe node」LIFFエンドポイントURL修正の確認(上記タスク1)
2. 「cafe node」チャネルの公開申請完了の確認(上記タスク2)
3. リッチメニューのLINE公式アカウントマネージャーでの登録・公開
4. GitHubリポジトリの非公開化 — オーナーに依頼済みだが完了未確認。Settings → Danger Zone → Change repository visibility から**オーナー自身が行う必要がある**(Claude側に実行する権限・ツールがない)
5. Messaging APIアクセストークンの再発行(推奨、未実施)
6. スタッフのパスワード変更機能(未実装、必要なら追加実装)

## 環境変数・秘密情報について

このリポジトリの `.env` はローカル開発専用で**Gitには含まれない**(`.gitignore`で除外)。本番の正となる値は **Vercelダッシュボードの Settings → Environment Variables にのみ存在する**。別PCで作業を再開する場合、このマシンのファイルをコピーする必要はなく、以下の各サービスにログインできれば作業を継続できる。

- Vercel(team: `tarakotiz-web`, project: `naoki`)
- Neon(project: 「green-hat-72763176」)
- LINE Developers Console / LINE公式アカウントマネージャー(同じLINEアカウントでログイン、プロバイダ「node」)
- GitHub(`tarakotiz-web/naoki`)

必要な環境変数キー一覧(値はVercelを参照。`.env.example` にキーとコメントのみ記載済み):

```
DATABASE_URL
AUTH_SECRET
NEXTAUTH_URL
LINE_CHANNEL_ID
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
NEXT_PUBLIC_LINE_LIFF_ID
CRON_SECRET
EXTERNAL_API_KEY
```

## 運用上の注意(標準方針)

- Vercel・LINE・Neonの認証情報(トークン・パスワード等)の値そのものはチャットに貼り付けない。誤って一度表示してしまった場合は念のため再発行する
- リッチメニュー公開・Webhook有効化・チャネル公開など、**全顧客に即座に影響する変更は、実行前に必ずオーナーに確認する**
- データ・セキュリティ・個人情報漏洩に関わる操作は、必ずオーナーの許可を得てから進める(2026年9月、オーナーからの指示)
