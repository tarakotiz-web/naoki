export function LiffLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="h-8 w-8 border-2 border-[var(--color-azure)] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--foreground-muted)]">LINEと連携しています...</p>
    </div>
  );
}

export function LiffNotConfigured() {
  return (
    <div className="card p-6 text-center space-y-2">
      <p className="text-2xl">🔧</p>
      <p className="font-bold">LINE連携は準備中です</p>
      <p className="text-sm text-[var(--foreground-muted)]">
        店舗の公式LINEアカウント設定が完了すると、ここからご予約いただけるようになります。
      </p>
    </div>
  );
}

export function LiffError({ message }: { message: string }) {
  return (
    <div className="card p-6 text-center space-y-2">
      <p className="text-2xl">⚠️</p>
      <p className="font-bold">エラーが発生しました</p>
      <p className="text-sm text-[var(--foreground-muted)]">{message}</p>
    </div>
  );
}
