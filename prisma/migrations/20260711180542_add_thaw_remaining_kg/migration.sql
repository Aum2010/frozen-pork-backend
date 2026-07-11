/*
  Warnings:

  - Added the required column `remainingKg` to the `ThawEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ThawEvent" ADD COLUMN     "remainingKg" DOUBLE PRECISION NOT NULL;
