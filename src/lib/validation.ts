import { z } from "zod";

// スタッフ手入力・LINE予約(将来)の両方から使う共通スキーマ。
// 別々のバリデーション/判定ロジックを作らないこと(要件21)。
export const reservationCreateSchema = z.object({
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間形式が不正です"),
  durationMinutes: z.number().int().min(15).max(480),
  partySize: z.number().int().min(1).max(200),
  adultCount: z.number().int().min(0).optional(),
  childCount: z.number().int().min(0).optional(),
  customerName: z.string().min(1, "顧客名は必須です").max(100),
  phone: z.string().min(1, "電話番号は必須です").max(30),
  tableIds: z.array(z.string()).optional(),
  sourceCode: z.string().min(1),
  menu: z.string().max(500).optional().nullable(),
  allergyInfo: z.string().max(500).optional().nullable(),
  hasStroller: z.boolean().optional(),
  isAnniversary: z.boolean().optional(),
  anniversaryNote: z.string().max(200).optional().nullable(),
  customerRequest: z.string().max(1000).optional().nullable(),
  staffMemo: z.string().max(1000).optional().nullable(),
  status: z
    .enum(["PENDING", "CONFIRMED", "ARRIVED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  lineUserId: z.string().optional().nullable(),
});
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;

export const reservationUpdateSchema = reservationCreateSchema.partial();
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;

export const walkInSchema = z.object({
  partySize: z.number().int().min(1).max(200),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  tableIds: z.array(z.string()).optional(),
  customerName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});
export type WalkInInput = z.infer<typeof walkInSchema>;

export const statusChangeSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "ARRIVED",
    "SEATED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  cancelMethod: z.enum(["STAFF", "LINE", "PHONE", "OTHER"]).optional(),
  cancelReason: z.string().max(500).optional(),
});
export type StatusChangeInput = z.infer<typeof statusChangeSchema>;

// LIFF予約フォーム用の入力スキーマ。項目はスタッフ用より少ないが、
// 最終的には reservationCreateSchema 相当のデータに変換して
// createReservation() を呼び出す(判定ロジック・登録経路を分けない)。
export const lineReservationCreateSchema = z.object({
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が不正です"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間形式が不正です"),
  partySize: z.number().int().min(1).max(200),
  childCount: z.number().int().min(0).optional(),
  customerName: z.string().min(1, "お名前は必須です").max(100),
  phone: z.string().min(1, "電話番号は必須です").max(30),
  allergyInfo: z.string().max(500).optional().nullable(),
  customerRequest: z.string().max(1000).optional().nullable(),
  displayName: z.string().max(100).optional(),
});
export type LineReservationCreateInput = z.infer<typeof lineReservationCreateSchema>;

export const lineReservationUpdateSchema = z.object({
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(200).optional(),
  childCount: z.number().int().min(0).optional(),
  allergyInfo: z.string().max(500).optional().nullable(),
  customerRequest: z.string().max(1000).optional().nullable(),
});
export type LineReservationUpdateInput = z.infer<typeof lineReservationUpdateSchema>;

export const tableInputSchema = z.object({
  name: z.string().min(1).max(50),
  maxSeats: z.number().int().min(1).max(100),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
