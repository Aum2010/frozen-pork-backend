-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('IN_FREEZER', 'THAWING', 'WAITING_TANK', 'IN_TANK', 'USED');

-- CreateEnum
CREATE TYPE "TankStatus" AS ENUM ('EMPTY', 'IN_USE', 'READY');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('RECEIVE', 'ASSIGN_ZONE', 'START_THAW', 'ENTER_TANK', 'WITHDRAW', 'REORDER_ALERT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WAREHOUSE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "zone" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'IN_FREEZER',
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThawEvent" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "readyAt" TIMESTAMP(3) NOT NULL,
    "confirmedBy" TEXT NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThawEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tank" (
    "id" TEXT NOT NULL,
    "tankNumber" INTEGER NOT NULL,
    "capacityKg" DOUBLE PRECISION NOT NULL DEFAULT 400,
    "currentWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "TankStatus" NOT NULL DEFAULT 'EMPTY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TankEntry" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "filledAt" TIMESTAMP(3) NOT NULL,
    "emptyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TankEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "lotId" TEXT,
    "tankEntryId" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "actorId" TEXT NOT NULL,
    "productionOrder" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_lotNumber_key" ON "Lot"("lotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_batchId_key" ON "Lot"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Tank_tankNumber_key" ON "Tank"("tankNumber");

-- AddForeignKey
ALTER TABLE "ThawEvent" ADD CONSTRAINT "ThawEvent_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TankEntry" ADD CONSTRAINT "TankEntry_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TankEntry" ADD CONSTRAINT "TankEntry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_tankEntryId_fkey" FOREIGN KEY ("tankEntryId") REFERENCES "TankEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
