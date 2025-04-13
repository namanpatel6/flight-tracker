-- Drop foreign key constraints first
ALTER TABLE "RuleCondition" DROP CONSTRAINT IF EXISTS "RuleCondition_ruleId_fkey";
ALTER TABLE "RuleCondition" DROP CONSTRAINT IF EXISTS "RuleCondition_trackedFlightId_fkey";
ALTER TABLE "RuleCondition" DROP CONSTRAINT IF EXISTS "RuleCondition_flightId_fkey";

-- Drop indices
DROP INDEX IF EXISTS "RuleCondition_ruleId_idx";
DROP INDEX IF EXISTS "RuleCondition_trackedFlightId_idx";
DROP INDEX IF EXISTS "RuleCondition_flightId_idx";

-- Drop the RuleCondition table
DROP TABLE IF EXISTS "RuleCondition";

-- Remove the conditions field from Rule model (if it exists at a DB level)
-- This might not be necessary if it's only a Prisma relation
-- ALTER TABLE "Rule" DROP COLUMN IF EXISTS "conditions"; 