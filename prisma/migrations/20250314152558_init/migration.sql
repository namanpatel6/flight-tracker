/*
  Warnings:

  - Added the required column `date` to the `TrackedFlight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrackedFlight" ADD COLUMN     "date" TEXT NOT NULL,
ALTER COLUMN "airline" DROP NOT NULL,
ALTER COLUMN "departureAirport" DROP NOT NULL,
ALTER COLUMN "arrivalAirport" DROP NOT NULL;
