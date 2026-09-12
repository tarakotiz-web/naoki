import { prisma } from "@/lib/prisma";
import { checkAvailability } from "@/server/availability";
import { findOrCreateCustomerByPhone, normalizePhone, recordCustomerVisit } from "@/server/customers";
import { dateStringToUTCDate } from "@/lib/time";
import type { ReservationCreateInput, ReservationUpdateInput, WalkInInput } from "@/lib/validation";
import type { CancelMethod, ReservationStatus } from "@prisma/client";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/reservation-status";
import { todayDateString } from "@/lib/time";

export class AvailabilityError extends Error {
  code: string;
  suggestion?: string;
  conflictingTableIds?: string[];
  constructor(message: string, code: string, suggestion?: string, conflictingTableIds?: string[]) {
    super(message);
    this.code = code;
    this.suggestion = suggestion;
    this.conflictingTableIds = conflictingTableIds;
  }
}

export class InvalidTransitionError extends Error {}

const RESERVATION_INCLUDE = {
  tables: { include: { table: true } },
  source: true,
  customer: true,
  lineUser: true,
  logs: { orderBy: { createdAt: "desc" } },
} as const;

export async function createReservation(
  storeId: string,
  input: ReservationCreateInput,
  actor: string
) {
  const source = await prisma.reservationSource.findUnique({
    where: { storeId_code: { storeId, code: input.sourceCode } },
  });
  if (!source) throw new Error(`不明な予約経路です: ${input.sourceCode}`);

  const availability = await checkAvailability({
    storeId,
    dateStr: input.reservationDate,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    partySize: input.partySize,
    tableIds: input.tableIds,
  });
  if (!availability.ok) {
    throw new AvailabilityError(
      availability.reason ?? "予約できません",
      availability.code ?? "UNKNOWN",
      availability.suggestion,
      availability.conflictingTableIds
    );
  }

  const defaultStatus: ReservationStatus =
    input.status ?? (input.sourceCode === "line" ? "PENDING" : "CONFIRMED");

  const reservation = await prisma.$transaction(async (tx) => {
    const customer = await findOrCreateCustomerByPhone(
      storeId,
      input.phone,
      input.customerName,
      tx
    );

    const created = await tx.reservation.create({
      data: {
        storeId,
        customerId: customer.id,
        lineUserId: input.lineUserId ?? null,
        sourceId: source.id,
        reservationDate: dateStringToUTCDate(input.reservationDate),
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        partySize: input.partySize,
        adultCount: input.adultCount ?? null,
        childCount: input.childCount ?? null,
        customerName: input.customerName,
        phone: normalizePhone(input.phone),
        menu: input.menu ?? null,
        allergyInfo: input.allergyInfo ?? null,
        hasStroller: input.hasStroller ?? false,
        isAnniversary: input.isAnniversary ?? false,
        anniversaryNote: input.anniversaryNote ?? null,
        customerRequest: input.customerRequest ?? null,
        staffMemo: input.staffMemo ?? null,
        status: defaultStatus,
        createdBy: actor,
        updatedBy: actor,
        tables: input.tableIds
          ? { create: input.tableIds.map((tableId) => ({ tableId })) }
          : undefined,
        ...(defaultStatus === "ARRIVED" ? { checkedInAt: new Date() } : {}),
        ...(defaultStatus === "SEATED" ? { checkedInAt: new Date(), seatedAt: new Date() } : {}),
      },
      include: RESERVATION_INCLUDE,
    });

    await tx.reservationLog.create({
      data: {
        reservationId: created.id,
        changeType: "CREATED",
        changedBy: actor,
        after: serializeReservation(created),
      },
    });

    if (defaultStatus === "ARRIVED" || defaultStatus === "SEATED") {
      await recordCustomerVisit(customer.id, new Date(), tx);
    }

    return created;
  });

  return reservation;
}

export async function updateReservation(
  reservationId: string,
  patch: ReservationUpdateInput,
  actor: string
) {
  const existing = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    include: RESERVATION_INCLUDE,
  });

  const merged = {
    reservationDate: patch.reservationDate ?? dateOnlyToString(existing.reservationDate),
    startTime: patch.startTime ?? existing.startTime,
    durationMinutes: patch.durationMinutes ?? existing.durationMinutes,
    partySize: patch.partySize ?? existing.partySize,
    tableIds: patch.tableIds ?? existing.tables.map((t) => t.tableId),
  };

  const timeOrTableChanged =
    patch.reservationDate !== undefined ||
    patch.startTime !== undefined ||
    patch.durationMinutes !== undefined ||
    patch.partySize !== undefined ||
    patch.tableIds !== undefined;

  if (timeOrTableChanged) {
    const availability = await checkAvailability({
      storeId: existing.storeId,
      dateStr: merged.reservationDate,
      startTime: merged.startTime,
      durationMinutes: merged.durationMinutes,
      partySize: merged.partySize,
      tableIds: merged.tableIds,
      excludeReservationId: reservationId,
    });
    if (!availability.ok) {
      throw new AvailabilityError(
        availability.reason ?? "変更できません",
        availability.code ?? "UNKNOWN",
        availability.suggestion,
        availability.conflictingTableIds
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (patch.tableIds !== undefined) {
      await tx.reservationTable.deleteMany({ where: { reservationId } });
    }

    const result = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        ...(patch.reservationDate !== undefined
          ? { reservationDate: dateStringToUTCDate(patch.reservationDate) }
          : {}),
        ...(patch.startTime !== undefined ? { startTime: patch.startTime } : {}),
        ...(patch.durationMinutes !== undefined
          ? { durationMinutes: patch.durationMinutes }
          : {}),
        ...(patch.partySize !== undefined ? { partySize: patch.partySize } : {}),
        ...(patch.adultCount !== undefined ? { adultCount: patch.adultCount } : {}),
        ...(patch.childCount !== undefined ? { childCount: patch.childCount } : {}),
        ...(patch.customerName !== undefined ? { customerName: patch.customerName } : {}),
        ...(patch.phone !== undefined ? { phone: normalizePhone(patch.phone) } : {}),
        ...(patch.menu !== undefined ? { menu: patch.menu } : {}),
        ...(patch.allergyInfo !== undefined ? { allergyInfo: patch.allergyInfo } : {}),
        ...(patch.hasStroller !== undefined ? { hasStroller: patch.hasStroller } : {}),
        ...(patch.isAnniversary !== undefined ? { isAnniversary: patch.isAnniversary } : {}),
        ...(patch.anniversaryNote !== undefined
          ? { anniversaryNote: patch.anniversaryNote }
          : {}),
        ...(patch.customerRequest !== undefined
          ? { customerRequest: patch.customerRequest }
          : {}),
        ...(patch.staffMemo !== undefined ? { staffMemo: patch.staffMemo } : {}),
        updatedBy: actor,
        ...(patch.tableIds !== undefined
          ? { tables: { create: patch.tableIds.map((tableId) => ({ tableId })) } }
          : {}),
      },
      include: RESERVATION_INCLUDE,
    });

    await tx.reservationLog.create({
      data: {
        reservationId,
        changeType: primaryChangeType(patch),
        changedBy: actor,
        before: serializeReservation(existing),
        after: serializeReservation(result),
      },
    });

    return result;
  });

  return updated;
}

export async function changeReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  actor: string,
  cancelInfo?: { method?: CancelMethod; reason?: string }
) {
  const existing = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    include: RESERVATION_INCLUDE,
  });

  if (
    existing.status !== newStatus &&
    !ALLOWED_STATUS_TRANSITIONS[existing.status].includes(newStatus)
  ) {
    throw new InvalidTransitionError(
      `ステータスを「${existing.status}」から「${newStatus}」へ変更できません。`
    );
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: newStatus,
        updatedBy: actor,
        ...(newStatus === "ARRIVED" && !existing.checkedInAt ? { checkedInAt: now } : {}),
        ...(newStatus === "SEATED" ? { seatedAt: now } : {}),
        ...(newStatus === "COMPLETED" ? { completedAt: now } : {}),
        ...(newStatus === "CANCELLED" || newStatus === "NO_SHOW"
          ? {
              cancelledAt: now,
              cancelMethod: cancelInfo?.method ?? "STAFF",
              cancelReason: cancelInfo?.reason ?? null,
            }
          : {}),
      },
      include: RESERVATION_INCLUDE,
    });

    if (newStatus === "ARRIVED" && !existing.checkedInAt && existing.customerId) {
      await recordCustomerVisit(existing.customerId, now, tx);
    }

    await tx.reservationLog.create({
      data: {
        reservationId,
        changeType: newStatus === "CANCELLED" || newStatus === "NO_SHOW" ? "CANCELLED" : "STATUS_CHANGED",
        changedBy: actor,
        before: { status: existing.status },
        after: { status: newStatus, ...cancelInfo },
        note: cancelInfo?.reason,
      },
    });

    return result;
  });

  return updated;
}

export async function cancelReservation(
  reservationId: string,
  method: CancelMethod,
  reason: string | undefined,
  actor: string,
  noShow = false
) {
  return changeReservationStatus(reservationId, noShow ? "NO_SHOW" : "CANCELLED", actor, {
    method,
    reason,
  });
}

/** WALK-IN登録: 最低限「人数・入店時間・テーブル」だけで登録できる簡易フロー。 */
export async function createWalkIn(storeId: string, input: WalkInInput, actor: string) {
  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  const source = await prisma.reservationSource.findUnique({
    where: { storeId_code: { storeId, code: "walk_in" } },
  });
  if (!source) throw new Error("予約経路「walk_in」が見つかりません。seedを実行してください。");

  const dateStr = todayDateString();

  const availability = await checkAvailability({
    storeId,
    dateStr,
    startTime: input.startTime,
    durationMinutes: store.defaultDurationMinutes,
    partySize: input.partySize,
    tableIds: input.tableIds,
  });
  if (!availability.ok) {
    throw new AvailabilityError(
      availability.reason ?? "登録できません",
      availability.code ?? "UNKNOWN",
      availability.suggestion,
      availability.conflictingTableIds
    );
  }

  const now = new Date();
  const reservation = await prisma.$transaction(async (tx) => {
    const customer = input.phone
      ? await findOrCreateCustomerByPhone(
          storeId,
          input.phone,
          input.customerName || "WALK-IN",
          tx
        )
      : null;

    const hasTable = input.tableIds && input.tableIds.length > 0;

    const created = await tx.reservation.create({
      data: {
        storeId,
        customerId: customer?.id ?? null,
        sourceId: source.id,
        reservationDate: dateStringToUTCDate(dateStr),
        startTime: input.startTime,
        durationMinutes: store.defaultDurationMinutes,
        partySize: input.partySize,
        customerName: input.customerName || "WALK-IN",
        phone: input.phone ? normalizePhone(input.phone) : "",
        status: hasTable ? "SEATED" : "ARRIVED",
        checkedInAt: now,
        seatedAt: hasTable ? now : null,
        createdBy: actor,
        updatedBy: actor,
        tables: input.tableIds
          ? { create: input.tableIds.map((tableId) => ({ tableId })) }
          : undefined,
      },
      include: RESERVATION_INCLUDE,
    });

    await tx.reservationLog.create({
      data: {
        reservationId: created.id,
        changeType: "CREATED",
        changedBy: actor,
        after: serializeReservation(created),
        note: "WALK-IN",
      },
    });

    if (customer) {
      await recordCustomerVisit(customer.id, now, tx);
    }

    return created;
  });

  return reservation;
}

function primaryChangeType(patch: ReservationUpdateInput) {
  if (patch.startTime !== undefined || patch.reservationDate !== undefined)
    return "TIME_CHANGED" as const;
  if (patch.tableIds !== undefined) return "TABLE_CHANGED" as const;
  if (patch.partySize !== undefined) return "PARTY_SIZE_CHANGED" as const;
  if (patch.menu !== undefined) return "MENU_CHANGED" as const;
  if (patch.staffMemo !== undefined || patch.customerRequest !== undefined)
    return "NOTE_ADDED" as const;
  return "OTHER" as const;
}

function dateOnlyToString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeReservation(r: any) {
  return JSON.parse(JSON.stringify(r));
}
