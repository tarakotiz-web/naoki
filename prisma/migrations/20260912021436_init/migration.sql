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
