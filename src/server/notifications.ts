// 予約ライフサイクルの通知処理。
// 要件24: 通知処理と予約本体のロジックは分離すること。
// そのため src/server/reservations.ts はこのファイルを一切importしない。
// API route層が「予約を更新する」→「通知する」の2手順を明示的に呼び出す構成にしている。

import { prisma } from "@/lib/prisma";
import { pushLineMessage } from "@/server/line/client";
import { RESERVATION_STATUS_LABELS } from "@/lib/reservation-status";
import { formatTimeRange } from "@/lib/time";
import type { ReservationDetail } from "@/types/reservation";

type NotifiableReservation = Pick<
  ReservationDetail,
  | "id"
  | "customerId"
  | "lineUserId"
  | "customerName"
  | "reservationDate"
  | "startTime"
  | "durationMinutes"
  | "partySize"
  | "status"
>;

function formatDateJapanese(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

/** 通知先のLINEユーザー(実際のLINEプラットフォームID)を解決する。 */
async function resolveLineTarget(reservation: NotifiableReservation): Promise<string | null> {
  if (reservation.lineUserId) {
    const lineUser = await prisma.lineUser.findUnique({ where: { id: reservation.lineUserId } });
    if (lineUser) return lineUser.lineUserId;
  }
  if (reservation.customerId) {
    const lineUser = await prisma.lineUser.findUnique({
      where: { customerId: reservation.customerId },
    });
    if (lineUser) return lineUser.lineUserId;
  }
  return null;
}

function buildSummaryMessage(reservation: NotifiableReservation, headline: string) {
  const lines = [
    "Cafe & Restaurant NODE",
    "",
    headline,
    "",
    formatDateJapanese(reservation.reservationDate),
    formatTimeRange(reservation.startTime, reservation.durationMinutes),
    `${reservation.partySize}名様`,
    "",
    "予約状況:",
    RESERVATION_STATUS_LABELS[reservation.status],
  ];
  return lines.join("\n");
}

async function send(reservation: NotifiableReservation, headline: string) {
  const target = await resolveLineTarget(reservation);
  if (!target) return; // LINE未連携の顧客には送らない
  await pushLineMessage(target, [{ type: "text", text: buildSummaryMessage(reservation, headline) }]);
}

export async function notifyReservationCreated(reservation: NotifiableReservation) {
  await send(reservation, "ご予約を受け付けました。");
}

export async function notifyReservationConfirmed(reservation: NotifiableReservation) {
  await send(reservation, "ご予約が確定しました。");
}

export async function notifyReservationChanged(reservation: NotifiableReservation) {
  await send(reservation, "ご予約内容を変更しました。");
}

export async function notifyReservationCancelled(reservation: NotifiableReservation) {
  await send(reservation, "ご予約をキャンセルしました。");
}

export async function notifyReservationReminder(
  reservation: NotifiableReservation,
  kind: "前日" | "当日"
) {
  await send(reservation, `【${kind}リマインド】ご来店をお待ちしております。`);
}
