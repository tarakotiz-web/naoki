import { prisma } from "@/lib/prisma";
import { SEAT_HOLDING_STATUSES } from "@/lib/reservation-status";
import {
  generateTimeSlots,
  rangesOverlap,
  timeToMinutes,
  weekdayOf,
} from "@/lib/time";
import type { Store } from "@prisma/client";

export interface AvailabilityCheckInput {
  storeId: string;
  dateStr: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  durationMinutes: number;
  partySize: number;
  tableIds?: string[];
  /** 編集時: 自分自身の予約は重複判定から除外する */
  excludeReservationId?: string;
}

export interface AvailabilityCheckResult {
  ok: boolean;
  reason?: string;
  code?:
    | "CLOSED_DAY"
    | "OUTSIDE_HOURS"
    | "OVER_CAPACITY"
    | "TABLE_CONFLICT"
    | "TABLE_TOO_SMALL"
    | "TABLE_INACTIVE";
  conflictingTableIds?: string[];
  suggestion?: string;
}

/**
 * 予約可能判定の唯一のロジック。
 * スタッフ手入力・LINE予約(将来)のどちらもこの関数を経由すること。
 * 別々の判定ロジックを重複実装しないこと(要件21)。
 */
export async function checkAvailability(
  input: AvailabilityCheckInput
): Promise<AvailabilityCheckResult> {
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: input.storeId },
  });

  // 1. 定休日チェック
  const weekday = weekdayOf(input.dateStr);
  if (store.closedWeekdays.includes(weekday)) {
    return {
      ok: false,
      code: "CLOSED_DAY",
      reason: "選択された日付は定休日です。",
    };
  }

  // 2. 営業時間チェック
  const startMinutes = timeToMinutes(input.startTime);
  const endMinutes = startMinutes + input.durationMinutes;
  const openMinutes = timeToMinutes(store.openTime);
  const closeMinutes = timeToMinutes(store.closeTime);
  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return {
      ok: false,
      code: "OUTSIDE_HOURS",
      reason: `営業時間(${store.openTime}〜${store.closeTime})外の予約はできません。`,
    };
  }

  // 3. 既存予約(自分以外・有効ステータスのみ)を取得
  const existing = await prisma.reservation.findMany({
    where: {
      storeId: input.storeId,
      reservationDate: dateOnlyEquals(input.dateStr),
      status: { in: SEAT_HOLDING_STATUSES },
      ...(input.excludeReservationId ? { NOT: { id: input.excludeReservationId } } : {}),
    },
    include: { tables: true },
  });

  const overlapping = existing.filter((r) => {
    const rStart = timeToMinutes(r.startTime);
    const rEnd = rStart + r.durationMinutes;
    return rangesOverlap(startMinutes, endMinutes, rStart, rEnd);
  });

  // 4. 全体キャパシティチェック(店舗全体の席数)
  const reservedSeats = overlapping.reduce((sum, r) => sum + r.partySize, 0);
  if (reservedSeats + input.partySize > store.seatsTotal) {
    const nextSlot = await suggestNextAvailableSlot(store, input);
    return {
      ok: false,
      code: "OVER_CAPACITY",
      reason: `この時間帯は満席に近く、ご希望人数(${input.partySize}名)分の席数が確保できません。(空き: ${Math.max(
        store.seatsTotal - reservedSeats,
        0
      )}席)`,
      suggestion: nextSlot,
    };
  }

  // 5. テーブル指定がある場合: テーブルの有効性・定員・重複チェック
  if (input.tableIds && input.tableIds.length > 0) {
    const tables = await prisma.table.findMany({
      where: { id: { in: input.tableIds }, storeId: input.storeId },
    });
    const inactiveTable = tables.find((t) => !t.isActive);
    if (inactiveTable) {
      return {
        ok: false,
        code: "TABLE_INACTIVE",
        reason: `テーブル「${inactiveTable.name}」は現在利用できません。`,
      };
    }
    const totalMaxSeats = tables.reduce((sum, t) => sum + t.maxSeats, 0);
    if (totalMaxSeats < input.partySize) {
      return {
        ok: false,
        code: "TABLE_TOO_SMALL",
        reason: `選択したテーブルの最大席数(${totalMaxSeats}席)がご予約人数(${input.partySize}名)を下回っています。`,
      };
    }

    const conflictingTableIds = new Set<string>();
    for (const r of overlapping) {
      for (const rt of r.tables) {
        if (input.tableIds.includes(rt.tableId)) {
          conflictingTableIds.add(rt.tableId);
        }
      }
    }
    if (conflictingTableIds.size > 0) {
      const names = tables
        .filter((t) => conflictingTableIds.has(t.id))
        .map((t) => t.name)
        .join("、");
      return {
        ok: false,
        code: "TABLE_CONFLICT",
        reason: `同一時間帯にテーブル「${names}」はすでに別の予約が入っています。`,
        conflictingTableIds: Array.from(conflictingTableIds),
      };
    }
  }

  return { ok: true };
}

function dateOnlyEquals(dateStr: string) {
  // reservationDate は @db.Date のため UTC正午で保存している値と一致させる
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

async function suggestNextAvailableSlot(
  store: Store,
  input: AvailabilityCheckInput
): Promise<string | undefined> {
  const slots = generateTimeSlots(store.openTime, store.closeTime, store.slotIntervalMinutes);
  const laterSlots = slots.filter((s) => timeToMinutes(s) > timeToMinutes(input.startTime));

  for (const slot of laterSlots) {
    const result = await checkAvailability({ ...input, startTime: slot, tableIds: undefined });
    if (result.ok) return slot;
  }
  return undefined;
}

export interface CapacitySlot {
  time: string;
  reservedSeats: number;
  availableSeats: number;
  capacityRatio: number; // 0-1
}

/** 時間帯ごとの予約人数・空席数を計算する(要件8: キャパシティ管理)。 */
export async function computeCapacityForDate(
  storeId: string,
  dateStr: string
): Promise<CapacitySlot[]> {
  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  const slots = generateTimeSlots(store.openTime, store.closeTime, store.slotIntervalMinutes);

  const reservations = await prisma.reservation.findMany({
    where: {
      storeId,
      reservationDate: dateOnlyEquals(dateStr),
      status: { in: SEAT_HOLDING_STATUSES },
    },
    select: { startTime: true, durationMinutes: true, partySize: true },
  });

  return slots.map((slot) => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + store.slotIntervalMinutes;
    const reservedSeats = reservations
      .filter((r) => {
        const rStart = timeToMinutes(r.startTime);
        const rEnd = rStart + r.durationMinutes;
        return rangesOverlap(slotStart, slotEnd, rStart, rEnd);
      })
      .reduce((sum, r) => sum + r.partySize, 0);

    return {
      time: slot,
      reservedSeats,
      availableSeats: Math.max(store.seatsTotal - reservedSeats, 0),
      capacityRatio: store.seatsTotal > 0 ? reservedSeats / store.seatsTotal : 0,
    };
  });
}
