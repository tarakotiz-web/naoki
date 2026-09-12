import { ReservationStatus } from "@prisma/client";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "予約受付",
  CONFIRMED: "予約確定",
  ARRIVED: "来店済",
  SEATED: "利用中",
  COMPLETED: "会計済",
  CANCELLED: "キャンセル",
  NO_SHOW: "無断キャンセル",
};

// Tailwind の badge 用クラス。カラー方針: Azure=進行中, ゴールド=要確認, 緑=完了, 赤=キャンセル系
export const RESERVATION_STATUS_STYLES: Record<ReservationStatus, string> = {
  PENDING: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  CONFIRMED: "bg-[var(--color-azure-light)] text-[var(--color-azure-dark)]",
  ARRIVED: "bg-[var(--color-info-light)] text-[var(--color-info)]",
  SEATED: "bg-[var(--color-gold-light)] text-[var(--color-gold)]",
  COMPLETED: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  CANCELLED: "bg-[var(--color-neutral-light)] text-[var(--color-neutral)]",
  NO_SHOW: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
};

// 来店中(=席が占有されている)とみなすステータス
export const ACTIVE_SEATING_STATUSES: ReservationStatus[] = ["ARRIVED", "SEATED"];

// 空席計算・重複判定の対象になる(=席を確保している)ステータス
export const SEAT_HOLDING_STATUSES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ARRIVED",
  "SEATED",
];

export const FUTURE_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED"];

export const CANCELLED_LIKE_STATUSES: ReservationStatus[] = ["CANCELLED", "NO_SHOW"];

export const STATUS_ORDER: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ARRIVED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

// ステータス遷移: どのステータスから何に変更できるか(UI上の選択肢の制御に使用)
export const ALLOWED_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "ARRIVED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["ARRIVED", "CANCELLED", "NO_SHOW", "PENDING"],
  ARRIVED: ["SEATED", "COMPLETED", "CONFIRMED"],
  SEATED: ["COMPLETED", "ARRIVED"],
  COMPLETED: [],
  CANCELLED: ["PENDING", "CONFIRMED"],
  NO_SHOW: ["PENDING", "CONFIRMED"],
};

export const CANCEL_METHOD_LABELS: Record<string, string> = {
  STAFF: "スタッフ操作",
  LINE: "公式LINE",
  PHONE: "電話",
  OTHER: "その他",
};
