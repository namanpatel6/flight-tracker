/*
  Warnings:

  - You are about to drop the column `airline` on the `TrackedFlight` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `TrackedFlight` table. All the data in the column will be lost.
  - Made the column `departureAirport` on table `TrackedFlight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `arrivalAirport` on table `TrackedFlight` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TrackedFlight" DROP COLUMN "airline",
DROP COLUMN "date",
ALTER COLUMN "departureAirport" SET NOT NULL,
ALTER COLUMN "arrivalAirport" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");
