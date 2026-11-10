-- Align the schema with SRS v0.8 for Iteration 1 (MVP).
--
-- 1. Green and red flags become swipe actions, so a candidate performs
--    exactly one action per card (REQ-FUNC-011, REQ-FUNC-014, REQ-FUNC-015).
--    The flags table is dropped without copying its rows: no shared or
--    deployed database holds real data yet, and local databases are reloaded
--    from tests/fixtures/synthetic/mock-data.sql.
-- 2. A like on a Company Card no longer requires a recruiter decision
--    (REQ-FUNC-012).
-- 3. Job Cards require a location and a contract type (REQ-FUNC-008).
-- 4. New invitation_codes table for joining a company (REQ-FUNC-025).
-- 5. Cards are soft-deleted with a DELETED status so their matches stay
--    visible as "Position closed" (REQ-FUNC-009).
-- 6. Only recruiters belong to a company (REQ-FUNC-003).

-- AlterEnum
ALTER TYPE "swipe_action" ADD VALUE 'GREEN_FLAG';
ALTER TYPE "swipe_action" ADD VALUE 'RED_FLAG';

-- AlterEnum
ALTER TYPE "card_status" ADD VALUE 'DELETED';

-- DropForeignKey
ALTER TABLE "flags" DROP CONSTRAINT "flags_candidate_id_fkey";

-- DropForeignKey
ALTER TABLE "flags" DROP CONSTRAINT "flags_card_id_fkey";

-- DropTable
DROP TABLE "flags";

-- DropEnum
DROP TYPE "flag_kind";

-- CreateTable
CREATE TABLE "invitation_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "created_by_id" UUID,
    "used_by_id" UUID,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_codes_code_key" ON "invitation_codes"("code");

-- CreateIndex
CREATE INDEX "invitation_codes_company_id_idx" ON "invitation_codes"("company_id");

-- AddForeignKey
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_used_by_id_fkey" FOREIGN KEY ("used_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Integrity rules Prisma cannot express in schema.prisma.
-- Only likes may carry a recruiter decision; the backend sets it to PENDING
-- for likes on Job Cards and leaves it null for likes on Company Cards
-- (REQ-FUNC-012). Passes and flags never carry one.
ALTER TABLE "swipes" DROP CONSTRAINT "swipes_decision_check";
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_decision_check" CHECK ("action" = 'LIKE' OR ("decision" IS NULL AND "decided_at" IS NULL));
-- A decision time is only recorded together with a decision.
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_decided_at_check" CHECK ("decided_at" IS NULL OR "decision" IS NOT NULL);
-- Job Cards need a location and a contract type (REQ-FUNC-008).
ALTER TABLE "cards" ADD CONSTRAINT "cards_job_fields_check" CHECK ("kind" <> 'JOB' OR ("location" IS NOT NULL AND length(btrim("location")) > 0 AND "contract_type" IS NOT NULL));
-- A code is used only once: whoever used it implies when it was used. used_by_id
-- may later become null (account deleted) while used_at stays set.
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_used_check" CHECK ("used_by_id" IS NULL OR "used_at" IS NOT NULL);
ALTER TABLE "invitation_codes" ADD CONSTRAINT "invitation_codes_code_not_blank_check" CHECK (length(btrim("code")) > 0);
-- Only recruiters belong to a company (REQ-FUNC-003).
ALTER TABLE "users" ADD CONSTRAINT "users_company_role_check" CHECK ("role" = 'RECRUITER' OR "company_id" IS NULL);
