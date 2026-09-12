// 時刻("HH:mm")・日付("YYYY-MM-DD")まわりの共通ユーティリティ。
// タイムゾーンをまたぐ複雑さを避けるため、日付・時刻は文字列で API 境界を統一する。

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/** 店舗の営業時間から刻み(interval)ごとのスロット("HH:mm"配列)を生成する。 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number
): string[] {
  const start = timeToMinutes(openTime);
  const end = timeToMinutes(closeTime);
  const slots: string[] = [];
  for (let t = start; t < end; t += intervalMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/** "YYYY-MM-DD" 文字列を UTC 正午の Date に変換する(DBの @db.Date 用、日付ズレ防止)。 */
export function dateStringToUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function dateToDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Date または ISO文字列を "YYYY-MM-DD" に整形する。
 * サーバーコンポーネントでは Prisma の Date インスタンスがそのまま渡ってくるため、
 * Date#toString() (ロケール依存の文字列) を誤って使わないようにする。
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function todayDateString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/** JS の Date#getDay 相当の曜日(0=日〜6=土)を "YYYY-MM-DD" 文字列から取得する。 */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return dateToDateString(date);
}

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const end = minutesToTime(timeToMinutes(startTime) + durationMinutes);
  return `${startTime}〜${end}`;
}
