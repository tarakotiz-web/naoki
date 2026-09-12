import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * 電話番号を基本キーに顧客を照合する。
 * 既存顧客が見つかった場合はそのまま返し(氏名の自動上書きはしない)、
 * 見つからない場合は新規顧客レコードを作成する。
 * スタッフ手入力・LINE予約(将来)のどちらもこの関数を経由すること。
 */
export async function findOrCreateCustomerByPhone(
  storeId: string,
  phone: string,
  name: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const normalizedPhone = normalizePhone(phone);
  const existing = await tx.customer.findUnique({
    where: { storeId_phone: { storeId, phone: normalizedPhone } },
  });
  if (existing) return existing;

  return tx.customer.create({
    data: { storeId, phone: normalizedPhone, name },
  });
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** 予約が「来店(ARRIVED)」に変わった際の来店統計更新。 */
export async function recordCustomerVisit(
  customerId: string,
  visitedAt: Date,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const customer = await tx.customer.findUnique({ where: { id: customerId } });
  if (!customer) return;

  await tx.customer.update({
    where: { id: customerId },
    data: {
      visitCount: { increment: 1 },
      firstVisitAt: customer.firstVisitAt ?? visitedAt,
      lastVisitAt: visitedAt,
    },
  });
}

export interface CustomerSearchParams {
  storeId: string;
  name?: string;
  phone?: string;
  reservationDate?: Date; // dateOnly (UTC正午)
}

export async function searchCustomers(params: CustomerSearchParams) {
  const { storeId, name, phone, reservationDate } = params;

  if (reservationDate) {
    const reservations = await prisma.reservation.findMany({
      where: {
        storeId,
        reservationDate,
        ...(name ? { customerName: { contains: name, mode: "insensitive" } } : {}),
        ...(phone ? { phone: { contains: normalizePhone(phone) } } : {}),
      },
      include: { customer: true },
      orderBy: { startTime: "asc" },
    });
    const seen = new Map<string, (typeof reservations)[number]>();
    for (const r of reservations) {
      if (r.customerId && !seen.has(r.customerId)) seen.set(r.customerId, r);
    }
    return Array.from(seen.values())
      .filter((r) => r.customer)
      .map((r) => r.customer!);
  }

  return prisma.customer.findMany({
    where: {
      storeId,
      ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
      ...(phone ? { phone: { contains: normalizePhone(phone) } } : {}),
    },
    orderBy: { lastVisitAt: "desc" },
    take: 100,
  });
}

export async function getCustomerDetail(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      lineUser: true,
      reservations: {
        orderBy: [{ reservationDate: "desc" }, { startTime: "desc" }],
        include: { tables: { include: { table: true } }, source: true },
      },
    },
  });
}
