/*
  Warnings:

  - You are about to drop the column `airline` on the `TrackedFlight` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `TrackedFlight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TrackedFlight" DROP COLUMN "airline",
DROP COLUMN "date",
ADD COLUMN "gate" TEXT,
ADD COLUMN "terminal" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "flightId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_flightId_idx" ON "Notification"("flightId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "TrackedFlight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
