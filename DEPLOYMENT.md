# 公開・LINE連携セットアップ手順(店舗オーナー様向け)

このドキュメントは、開発側での実装が完了した後、**実際にインターネット上で公開し、LINE公式アカウントと連携するために店舗側で行っていただく作業**をまとめたものです。アカウント作成や環境変数の入力はご本人の情報・権限に紐づくため、こちらの作業は開発側では代行できません。

---

## STEP 1: Vercelにデプロイする(所要時間 目安10分)

Next.jsを作っている会社が提供する無料のホスティングサービスです。クレジットカード登録なしで始められます。

1. https://vercel.com/signup を開く
2. 「Continue with GitHub」を選び、GitHubアカウントでログイン(GitHubアカウントがなければ先に https://github.com/signup で作成)
3. ログイン後、「Add New...」→「Project」をクリック
4. 「Import Git Repository」の一覧から `tarakotiz-web/naoki` を探して「Import」をクリック
   - 一覧に出てこない場合は「Configure GitHub App」からVercelにこのリポジトリへのアクセスを許可してください
5. 「Environment Variables」欄に、後述のSTEP 2・3で取得する値を入力します(この時点では `DATABASE_URL` と `AUTH_SECRET` だけ仮で構いません)
6. 「Deploy」をクリック → 数分で `https://naoki-xxxx.vercel.app` のようなURLが発行されます

### データベースも必要です
このアプリはPostgreSQLというデータベースを使います。Vercelの「Storage」タブから「Postgres」を追加するか、[Neon](https://neon.tech)や[Supabase](https://supabase.com)の無料枠でPostgreSQLを作成し、接続文字列を `DATABASE_URL` に設定してください。

- `AUTH_SECRET` には適当なランダム文字列(32文字以上)を設定してください。以下のコマンドで生成できます。
  ```bash
  openssl rand -base64 32
  ```

デプロイ後、初回のみ以下を実行してデータベースの初期化を行う必要があります(Vercelの「Deployments」→ 該当デプロイ→「...」→「Redeploy」ではなく、ローカルからリモートDBに向けて実行します)。

```bash
DATABASE_URL="<Vercelに設定したものと同じ値>" npx prisma migrate deploy
DATABASE_URL="<Vercelに設定したものと同じ値>" npm run db:seed
```

---

## STEP 2: LINE公式アカウント(チャネル)を作る(所要時間 目安15分)

1. https://developers.line.biz/console/ を開き、お持ちのLINEアカウントでログイン
2. 「新規プロバイダー作成」→ 好きな名前(例: 店舗名やお店の運営会社名)を入力
3. 作成したプロバイダーの中で「Messaging API」チャネルを新規作成
   - チャネル名: 例「Cafe & Restaurant NODE」
   - チャネル説明: 自由に入力
   - 業種: 飲食店を選択
4. 作成後、チャネルの「Messaging API設定」タブを開き、以下をメモする
   - **チャネルシークレット**(「チャネル基本設定」タブにあります)
   - **チャネルアクセストークン**(「Messaging API設定」タブの下部、「発行」ボタンを押す)

---

## STEP 3: LIFFアプリを作る(所要時間 目安5分)

1. 同じチャネルの「LIFF」タブを開き、「追加」をクリック
2. 以下を入力
   - LIFFアプリ名: 「予約」など
   - サイズ: Full
   - エンドポイントURL: STEP 1で発行された `https://naoki-xxxx.vercel.app/liff/reservation`
   - Scope: `profile`, `openid` にチェック
3. 作成すると **LIFF ID**(`xxxxxxxxxx-yyyyyyyy` のような文字列)が発行されるのでメモする

---

## STEP 4: Webhookを設定する

1. チャネルの「Messaging API設定」タブに戻る
2. 「Webhook URL」に `https://naoki-xxxx.vercel.app/api/line/webhook` を入力し、「更新」
3. 「Webhookの利用」をオンにする
4. 「応答メッセージ」はオフにする(Bot側で案内メッセージを返すため、LINE公式の自動応答と重複させない)

---

## STEP 5: Vercelに環境変数を追加する

Vercelのプロジェクト画面 →「Settings」→「Environment Variables」で以下を追加し、再デプロイ(「Deployments」タブ→最新デプロイの「...」→「Redeploy」)してください。

| キー | 値 |
|---|---|
| `LINE_CHANNEL_ID` | チャネルの「チャネルID」(基本設定タブに記載) |
| `LINE_CHANNEL_SECRET` | STEP 2でメモしたチャネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | STEP 2でメモしたチャネルアクセストークン |
| `NEXT_PUBLIC_LINE_LIFF_ID` | STEP 3でメモしたLIFF ID |
| `CRON_SECRET` | 適当なランダム文字列(前日/当日リマインド送信の認証用) |
| `EXTERNAL_API_KEY` | 適当なランダム文字列(外部連携用。使わないなら空でも可) |

**環境変数の値は、このチャット上ではなく必ずVercelの画面に直接入力してください。** チャット履歴に残さないための安全な進め方です。

---

## STEP 6: リッチメニューを登録する

ローカル(自分のPC)のプロジェクトフォルダで、`.env` に上記と同じLINE関連の値を設定した上で以下を実行してください。

```bash
npm run line:setup-richmenu
```

---

## STEP 7: 実際にLINEアプリで試す

1. チャネルの「Messaging API設定」タブにあるQRコードを、スマホのLINEアプリで読み取って友だち追加
2. リッチメニューから「ご予約」をタップ → フォームに入力して送信
3. スタッフ側の予約台帳(`https://naoki-xxxx.vercel.app/reservations`)に反映されるか確認

---

## うまくいかない時は

各STEPで発行された値(URLやID)をお伝えいただければ、こちらでコード側の設定や動作確認を行います。パスワードやアクセストークンそのものは、Vercelの画面に直接入力していただき、チャットでは共有しないようにお願いします。
