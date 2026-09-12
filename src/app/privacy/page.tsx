import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Cafe & Restaurant NODE",
  description: "Cafe & Restaurant NODE プライバシーポリシー",
};

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "1. 事業者情報",
    body: (
      <p>
        Cafe &amp; Restaurant NODE(以下「当店」といいます)は、当店が提供する予約管理システムおよびLINE公式アカウントを通じたご予約サービス(以下「本サービス」といいます)における、お客様の個人情報の取り扱いについて、以下のとおりプライバシーポリシー(以下「本ポリシー」といいます)を定めます。
      </p>
    ),
  },
  {
    heading: "2. 取得する情報",
    body: (
      <>
        <p>本サービスのご利用にあたり、当店は以下の情報を取得します。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>LINEアカウントの表示名・プロフィール画像・LINEユーザーID(LINEでご予約いただいた場合)</li>
          <li>ご予約時にご入力いただくお名前・電話番号・来店希望日時・人数・お子様の有無・アレルギー情報・ご要望等</li>
          <li>ご来店・ご予約に関する履歴情報</li>
        </ul>
      </>
    ),
  },
  {
    heading: "3. 利用目的",
    body: (
      <>
        <p>取得した情報は、以下の目的の範囲内で利用します。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>ご予約の受付・管理・確認のため</li>
          <li>ご予約内容の変更・キャンセルへの対応のため</li>
          <li>ご予約確定・変更・リマインド等に関するご連絡のため</li>
          <li>アレルギー等、安全なご提供に配慮したサービス品質向上のため</li>
          <li>お問い合わせへの対応のため</li>
        </ul>
      </>
    ),
  },
  {
    heading: "4. 第三者提供",
    body: (
      <p>
        当店は、法令に基づく場合を除き、お客様の同意なく取得した個人情報を第三者に提供することはありません。本サービスの提供に必要な範囲でシステムの開発・運用を委託する場合がありますが、その場合も適切な管理を求めます。
      </p>
    ),
  },
  {
    heading: "5. 保管・管理",
    body: (
      <p>
        取得した個人情報は、利用目的の達成に必要な期間、適切な安全管理措置を講じたうえで保管します。ご予約をキャンセルされた場合も、記録として一定期間保持することがあります。
      </p>
    ),
  },
  {
    heading: "6. お問い合わせ窓口",
    body: (
      <p>
        本ポリシーに関するお問い合わせ、または個人情報の開示・訂正・削除等のご希望については、当店LINE公式アカウントのトークよりご連絡ください。
      </p>
    ),
  },
  {
    heading: "7. 改定",
    body: (
      <p>
        当店は、必要に応じて本ポリシーの内容を変更することがあります。変更後の内容は、本ページに掲載した時点から効力を生じるものとします。
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <h1 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
          プライバシーポリシー
        </h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Cafe &amp; Restaurant NODE
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {section.heading}
              </h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-[var(--foreground-muted)]">制定日: 2026年9月12日</p>
      </div>
    </div>
  );
}
