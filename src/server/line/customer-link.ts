import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * LINEユーザー情報(line_users)を顧客情報(customers)とは独立して管理しつつ、
 * 必要に応じて紐付ける。電話番号による顧客照合(findOrCreateCustomerByPhone)を
 * 正としており、LINEユーザーIDだけに依存しない(要件17)。
 */
export async function findOrCreateLineUser(
  lineUserId: string,
  displayName: string | undefined,
  pictureUrl: string | undefined,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const existing = await tx.lineUser.findUnique({ where: { lineUserId } });
  if (existing) {
    if (displayName && displayName !== existing.displayName) {
      return tx.lineUser.update({ where: { id: existing.id }, data: { displayName, pictureUrl } });
    }
    return existing;
  }
  return tx.lineUser.create({
    data: { lineUserId, displayName, pictureUrl },
  });
}

/** 初回のみ customerId を紐付ける(既存のリンクは上書きしない)。 */
export async function linkLineUserToCustomerIfUnset(
  lineUserRowId: string,
  customerId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const lineUser = await tx.lineUser.findUnique({ where: { id: lineUserRowId } });
  if (lineUser && !lineUser.customerId) {
    await tx.lineUser.update({ where: { id: lineUserRowId }, data: { customerId } });
  }
}

/**
 * ある予約がこのLINEユーザー本人のものかどうかを判定する。
 * reservation.lineUserId が一致する、または reservation.customer が
 * このLINEユーザーに紐付いた顧客と一致する場合に本人とみなす。
 */
export function reservationBelongsToLineUser(
  reservation: { lineUserId: string | null; customerId: string | null },
  lineUserRowId: string,
  linkedCustomerId: string | null
): boolean {
  if (reservation.lineUserId === lineUserRowId) return true;
  if (linkedCustomerId && reservation.customerId === linkedCustomerId) return true;
  return false;
}
