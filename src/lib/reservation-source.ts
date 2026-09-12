// 予約経路の初期シードデータ。DB(reservation_sources)で管理するため、
// ここは「新規店舗を作る際の初期投入データ」と「コード→絵文字アイコン」の対応のみを持つ。
export const DEFAULT_RESERVATION_SOURCES = [
  { code: "phone", label: "電話", sortOrder: 1 },
  { code: "line", label: "公式LINE", sortOrder: 2 },
  { code: "instagram", label: "Instagram", sortOrder: 3 },
  { code: "google", label: "Google", sortOrder: 4 },
  { code: "walk_in", label: "店頭", sortOrder: 5 },
  { code: "manual", label: "手入力", sortOrder: 6 },
  { code: "other", label: "その他", sortOrder: 7 },
] as const;

export const SOURCE_ICONS: Record<string, string> = {
  phone: "📞",
  line: "💬",
  instagram: "📷",
  google: "🔍",
  walk_in: "🚶",
  manual: "⌨️",
  other: "📝",
};

export function sourceIcon(code: string): string {
  return SOURCE_ICONS[code] ?? "📝";
}
