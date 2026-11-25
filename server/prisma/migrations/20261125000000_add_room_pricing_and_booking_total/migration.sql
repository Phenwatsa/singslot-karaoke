-- 1. Additive columns with safe non-null defaults (rollback-safe for older container images)
ALTER TABLE "rooms" ADD COLUMN "hourlyRate" INTEGER NOT NULL DEFAULT 200;
ALTER TABLE "bookings" ADD COLUMN "totalPrice" INTEGER NOT NULL DEFAULT 0;

-- 2. Deterministic backfill for existing rooms by capacity tier (BR-12)
UPDATE "rooms" SET "hourlyRate" = 200 WHERE "type" = 'SMALL';
UPDATE "rooms" SET "hourlyRate" = 350 WHERE "type" = 'MEDIUM';
UPDATE "rooms" SET "hourlyRate" = 500 WHERE "type" = 'LARGE';

-- 3. Deterministic backfill for historical Sprint 1 / Lab 6 bookings
UPDATE "bookings" AS b
SET "totalPrice" = b."durationHours" * r."hourlyRate"
FROM "rooms" AS r
WHERE b."roomId" = r."id";
