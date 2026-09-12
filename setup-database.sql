-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ARRIVED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CancelMethod" AS ENUM ('STAFF', 'LINE', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReservationChangeType" AS ENUM ('CREATED', 'TIME_CHANGED', 'PARTY_SIZE_CHANGED', 'TABLE_CHANGED', 'MENU_CHANGED', 'NOTE_ADDED', 'STATUS_CHANGED', 'CANCELLED', 'OTHER');

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "seatsTotal" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "closedWeekdays" INTEGER[],
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "defaultDurationMinutes" INTEGER NOT NULL DEFAULT 90,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_sources" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_users" (
    "id" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "lineUserId" TEXT,
    "sourceId" TEXT NOT NULL,
    "reservationDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 90,
    "partySize" INTEGER NOT NULL,
    "adultCount" INTEGER,
    "childCount" INTEGER,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "menu" TEXT,
    "allergyInfo" TEXT,
    "hasStroller" BOOLEAN NOT NULL DEFAULT false,
    "isAnniversary" BOOLEAN NOT NULL DEFAULT false,
    "anniversaryNote" TEXT,
    "customerRequest" TEXT,
    "staffMemo" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "cancelledAt" TIMESTAMP(3),
    "cancelMethod" "CancelMethod",
    "cancelReason" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_tables" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_logs" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "changeType" "ReservationChangeType" NOT NULL,
    "changedBy" TEXT,
    "before" JSONB,
    "after" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tables_storeId_name_key" ON "tables"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_sources_storeId_code_key" ON "reservation_sources"("storeId", "code");

-- CreateIndex
CREATE INDEX "customers_storeId_name_idx" ON "customers"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_storeId_phone_key" ON "customers"("storeId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "line_users_lineUserId_key" ON "line_users"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "line_users_customerId_key" ON "line_users"("customerId");

-- CreateIndex
CREATE INDEX "reservations_storeId_reservationDate_idx" ON "reservations"("storeId", "reservationDate");

-- CreateIndex
CREATE INDEX "reservations_storeId_reservationDate_status_idx" ON "reservations"("storeId", "reservationDate", "status");

-- CreateIndex
CREATE INDEX "reservation_tables_tableId_idx" ON "reservation_tables"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_tables_reservationId_tableId_key" ON "reservation_tables"("reservationId", "tableId");

-- CreateIndex
CREATE INDEX "reservation_logs_reservationId_idx" ON "reservation_logs"("reservationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_sources" ADD CONSTRAINT "reservation_sources_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_users" ADD CONSTRAINT "line_users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_lineUserId_fkey" FOREIGN KEY ("lineUserId") REFERENCES "line_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "reservation_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_tables" ADD CONSTRAINT "reservation_tables_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_tables" ADD CONSTRAINT "reservation_tables_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_logs" ADD CONSTRAINT "reservation_logs_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== 初期データ投入(店舗・テーブル・予約経路・スタッフアカウント) =====

INSERT INTO "stores" ("id","slug","name","phone","address","seatsTotal","openTime","closeTime","closedWeekdays","timezone","slotIntervalMinutes","defaultDurationMinutes","isActive","createdAt","updatedAt")
VALUES ('store_node','node','Cafe & Restaurant NODE',NULL,NULL,38,'11:00','18:00',ARRAY[1],'Asia/Tokyo',30,90,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "tables" ("id","storeId","name","maxSeats","sortOrder","isActive","createdAt","updatedAt") VALUES
('table_t1','store_node','T1',2,0,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t2','store_node','T2',2,1,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t3','store_node','T3',2,2,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t4','store_node','T4',4,3,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t5','store_node','T5',4,4,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t6','store_node','T6',4,5,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t7','store_node','T7',6,6,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_t8','store_node','T8',6,7,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('table_counter','store_node','カウンター',8,8,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "reservation_sources" ("id","storeId","code","label","sortOrder","isActive","createdAt") VALUES
('src_phone','store_node','phone','電話',1,true,CURRENT_TIMESTAMP),
('src_line','store_node','line','公式LINE',2,true,CURRENT_TIMESTAMP),
('src_instagram','store_node','instagram','Instagram',3,true,CURRENT_TIMESTAMP),
('src_google','store_node','google','Google',4,true,CURRENT_TIMESTAMP),
('src_walkin','store_node','walk_in','店頭',5,true,CURRENT_TIMESTAMP),
('src_manual','store_node','manual','手入力',6,true,CURRENT_TIMESTAMP),
('src_other','store_node','other','その他',7,true,CURRENT_TIMESTAMP);

-- パスワードは両方とも: password123
INSERT INTO "users" ("id","storeId","name","email","passwordHash","role","isActive","createdAt","updatedAt") VALUES
('user_admin','store_node','管理者','admin@node-cafe.example','$2b$10$gBblo2vLKaYw9sqbs2/1texk5huaY5ncKdIXek05zJ9sCfO96jn/S','ADMIN',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('user_staff','store_node','スタッフ','staff@node-cafe.example','$2b$10$gBblo2vLKaYw9sqbs2/1texk5huaY5ncKdIXek05zJ9sCfO96jn/S','STAFF',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- ===== Prisma管理テーブル(将来 `npx prisma migrate deploy` を実行しても
--       このマイグレーションを再実行しようとしないようにするための記録) =====

CREATE TABLE "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","started_at","applied_steps_count")
VALUES ('6dabdd7f-a874-448f-ad86-569ae8e64439','61f930b76c6c419b6c2afdeeeea3e95428dd5a6ba020890ced40800ffcb13a22',CURRENT_TIMESTAMP,'20260912021436_init',CURRENT_TIMESTAMP,1);
