import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_RESERVATION_SOURCES } from "../src/lib/reservation-source";

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.upsert({
    where: { slug: "node" },
    update: {},
    create: {
      slug: "node",
      name: "Cafe & Restaurant NODE",
      seatsTotal: 38,
      openTime: "11:00",
      closeTime: "18:00",
      closedWeekdays: [1], // 月曜定休
      timezone: "Asia/Tokyo",
      slotIntervalMinutes: 30,
      defaultDurationMinutes: 90,
    },
  });

  const tableDefs = [
    { name: "T1", maxSeats: 2 },
    { name: "T2", maxSeats: 2 },
    { name: "T3", maxSeats: 2 },
    { name: "T4", maxSeats: 4 },
    { name: "T5", maxSeats: 4 },
    { name: "T6", maxSeats: 4 },
    { name: "T7", maxSeats: 6 },
    { name: "T8", maxSeats: 6 },
    { name: "カウンター", maxSeats: 8 },
  ];
  for (const [i, t] of tableDefs.entries()) {
    await prisma.table.upsert({
      where: { storeId_name: { storeId: store.id, name: t.name } },
      update: {},
      create: { storeId: store.id, name: t.name, maxSeats: t.maxSeats, sortOrder: i },
    });
  }

  for (const s of DEFAULT_RESERVATION_SOURCES) {
    await prisma.reservationSource.upsert({
      where: { storeId_code: { storeId: store.id, code: s.code } },
      update: {},
      create: { storeId: store.id, code: s.code, label: s.label, sortOrder: s.sortOrder },
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@node-cafe.example" },
    update: {},
    create: {
      storeId: store.id,
      name: "管理者",
      email: "admin@node-cafe.example",
      passwordHash,
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "staff@node-cafe.example" },
    update: {},
    create: {
      storeId: store.id,
      name: "スタッフ",
      email: "staff@node-cafe.example",
      passwordHash,
      role: "STAFF",
    },
  });

  console.log("Seed completed:", { storeId: store.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
