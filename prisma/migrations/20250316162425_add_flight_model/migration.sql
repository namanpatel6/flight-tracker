-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_flightId_fkey";

-- DropForeignKey
ALTER TABLE "RuleCondition" DROP CONSTRAINT "RuleCondition_flightId_fkey";

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "trackedFlightId" TEXT,
ALTER COLUMN "flightId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RuleCondition" ADD COLUMN     "trackedFlightId" TEXT;

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "airline" TEXT,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3),
    "arrivalTime" TIMESTAMP(3),
    "status" TEXT,
    "gate" TEXT,
    "terminal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flight_flightNumber_idx" ON "Flight"("flightNumber");

-- CreateIndex
CREATE INDEX "Alert_trackedFlightId_idx" ON "Alert"("trackedFlightId");

-- CreateIndex
CREATE INDEX "RuleCondition_trackedFlightId_idx" ON "RuleCondition"("trackedFlightId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_trackedFlightId_fkey" FOREIGN KEY ("trackedFlightId") REFERENCES "TrackedFlight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_trackedFlightId_fkey" FOREIGN KEY ("trackedFlightId") REFERENCES "TrackedFlight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
