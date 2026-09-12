import { prisma } from "@/lib/prisma";
import { getDefaultStoreForPublicAccess } from "@/server/store";
import { findOrCreateCustomerByPhone } from "@/server/customers";
import { findOrCreateLineUser, linkLineUserToCustomerIfUnset, reservationBelongsToLineUser } from "./customer-link";
import { createReservation, updateReservation, cancelReservation } from "@/server/reservations";
import type { LineReservationCreateInput, LineReservationUpdateInput } from "@/lib/validation";
import type { LineIdentity } from "./verify-id-token";
import type { Prisma } from "@prisma/client";

export class LineReservationAccessError extends Error {}

const LINE_RESERVATION_INCLUDE = {
  tables: { include: { table: true } },
  source: true,
  customer: true,
} as const;

/**
 * LIFFからの新規予約。スタッフ手入力と完全に同じ createReservation() /
 * checkAvailability() を経由するため、判定ロジックが二重管理になることはない。
 */
export async function createLineReservation(
  identity: LineIdentity,
  input: LineReservationCreateInput
) {
  const store = await getDefaultStoreForPublicAccess();

  const lineUser = await findOrCreateLineUser(
    identity.lineUserId,
    input.displayName ?? identity.displayName,
    identity.pictureUrl
  );
  const customer = await findOrCreateCustomerByPhone(store.id, input.phone, input.customerName);
  await linkLineUserToCustomerIfUnset(lineUser.id, customer.id);

  return createReservation(
    store.id,
    {
      reservationDate: input.reservationDate,
      startTime: input.startTime,
      durationMinutes: store.defaultDurationMinutes,
      partySize: input.partySize,
      childCount: input.childCount,
      customerName: input.customerName,
      phone: input.phone,
      sourceCode: "line",
      allergyInfo: input.allergyInfo,
      customerRequest: input.customerRequest,
      lineUserId: lineUser.id,
      status: "PENDING",
    },
    `LINE:${identity.lineUserId}`
  );
}

export async function listLineReservations(identity: LineIdentity) {
  const store = await getDefaultStoreForPublicAccess();
  const lineUser = await prisma.lineUser.findUnique({ where: { lineUserId: identity.lineUserId } });
  if (!lineUser) return [];

  const or: Prisma.ReservationWhereInput[] = [{ lineUserId: lineUser.id }];
  if (lineUser.customerId) or.push({ customerId: lineUser.customerId });

  return prisma.reservation.findMany({
    where: { storeId: store.id, OR: or },
    include: LINE_RESERVATION_INCLUDE,
    orderBy: [{ reservationDate: "desc" }, { startTime: "desc" }],
  });
}

async function assertOwnership(identity: LineIdentity, reservationId: string) {
  const lineUser = await prisma.lineUser.findUnique({ where: { lineUserId: identity.lineUserId } });
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!lineUser || !reservation) {
    throw new LineReservationAccessError("予約が見つかりません。");
  }
  if (!reservationBelongsToLineUser(reservation, lineUser.id, lineUser.customerId)) {
    throw new LineReservationAccessError("この予約を操作する権限がありません。");
  }
  return reservation;
}

export async function updateLineReservation(
  identity: LineIdentity,
  reservationId: string,
  patch: LineReservationUpdateInput
) {
  await assertOwnership(identity, reservationId);
  return updateReservation(
    reservationId,
    {
      reservationDate: patch.reservationDate,
      startTime: patch.startTime,
      partySize: patch.partySize,
      childCount: patch.childCount,
      allergyInfo: patch.allergyInfo,
      customerRequest: patch.customerRequest,
    },
    `LINE:${identity.lineUserId}`
  );
}

export async function cancelLineReservation(
  identity: LineIdentity,
  reservationId: string,
  reason: string | undefined
) {
  await assertOwnership(identity, reservationId);
  return cancelReservation(reservationId, "LINE", reason, `LINE:${identity.lineUserId}`);
}
