/*
  Warnings:

  - The values [THAWING,WAITING_TANK,IN_TANK] on the enum `LotStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lotId` on the `TankEntry` table. All the data in the column will be lost.
  - You are about to drop the column `isReady` on the `ThawEvent` table. All the data in the column will be lost.
  - Added the required column `remainingKg` to the `Lot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thawEventId` to the `TankEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ThawStatus" AS ENUM ('THAWING', 'WAITING_TANK', 'IN_TANK', 'USED');

-- AlterEnum
BEGIN;
CREATE TYPE "LotStatus_new" AS ENUM ('IN_FREEZER', 'PARTIALLY_THAWING', 'FULLY_THAWING', 'USED');
ALTER TABLE "Lot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lot" ALTER COLUMN "status" TYPE "LotStatus_new" USING ("status"::text::"LotStatus_new");
ALTER TYPE "LotStatus" RENAME TO "LotStatus_old";
ALTER TYPE "LotStatus_new" RENAME TO "LotStatus";
DROP TYPE "LotStatus_old";
ALTER TABLE "Lot" ALTER COLUMN "status" SET DEFAULT 'IN_FREEZER';
COMMIT;

-- DropForeignKey
ALTER TABLE "TankEntry" DROP CONSTRAINT "TankEntry_lotId_fkey";

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "thawEventId" TEXT;

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "remainingKg" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "TankEntry" DROP COLUMN "lotId",
ADD COLUMN     "thawEventId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ThawEvent" DROP COLUMN "isReady",
ADD COLUMN     "status" "ThawStatus" NOT NULL DEFAULT 'THAWING';

-- AddForeignKey
ALTER TABLE "TankEntry" ADD CONSTRAINT "TankEntry_thawEventId_fkey" FOREIGN KEY ("thawEventId") REFERENCES "ThawEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_thawEventId_fkey" FOREIGN KEY ("thawEventId") REFERENCES "ThawEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
