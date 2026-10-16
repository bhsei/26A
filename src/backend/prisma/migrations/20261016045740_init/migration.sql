-- CreateEnum
CREATE TYPE "role" AS ENUM ('CANDIDATE', 'RECRUITER');

-- CreateEnum
CREATE TYPE "tag_type" AS ENUM ('SKILL', 'ROLE', 'SECTOR', 'LOCATION', 'CONTRACT');

-- CreateEnum
CREATE TYPE "education_level" AS ENUM ('NONE', 'SECONDARY', 'VOCATIONAL', 'BACHELOR', 'MASTER', 'DOCTORATE');

-- CreateEnum
CREATE TYPE "contract_type" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE');

-- CreateEnum
CREATE TYPE "card_kind" AS ENUM ('COMPANY', 'JOB');

-- CreateEnum
CREATE TYPE "card_status" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "swipe_action" AS ENUM ('LIKE', 'PASS');

-- CreateEnum
CREATE TYPE "recruiter_decision" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "flag_kind" AS ENUM ('GREEN', 'RED');

-- CreateEnum
CREATE TYPE "report_target" AS ENUM ('CARD', 'USER', 'MESSAGE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "display_name" VARCHAR(100),
    "company_id" UUID,
    "privacy_consent_at" TIMESTAMPTZ(3) NOT NULL,
    "privacy_notice_version" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "sector" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "user_id" UUID NOT NULL,
    "education_level" "education_level",
    "years_experience" SMALLINT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "type" "tag_type" NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "label" VARCHAR(80) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_tags" (
    "card_id" UUID NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "card_tags_pkey" PRIMARY KEY ("card_id","tag_id")
);

-- CreateTable
CREATE TABLE "candidate_tags" (
    "candidate_id" UUID NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "candidate_tags_pkey" PRIMARY KEY ("candidate_id","tag_id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "created_by_id" UUID,
    "kind" "card_kind" NOT NULL,
    "status" "card_status" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "location" VARCHAR(120),
    "contract_type" "contract_type",
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_currency" CHAR(3),
    "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" VARCHAR(500),
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swipes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "action" "swipe_action" NOT NULL,
    "decision" "recruiter_decision",
    "decided_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "kind" "flag_kind" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "cv_storage_key" VARCHAR(300),
    "cv_size_bytes" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" UUID NOT NULL,
    "target_type" "report_target" NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_type_slug_key" ON "tags"("type", "slug");

-- CreateIndex
CREATE INDEX "card_tags_tag_id_idx" ON "card_tags"("tag_id");

-- CreateIndex
CREATE INDEX "candidate_tags_tag_id_idx" ON "candidate_tags"("tag_id");

-- CreateIndex
CREATE INDEX "cards_company_id_idx" ON "cards"("company_id");

-- CreateIndex
CREATE INDEX "cards_status_published_at_idx" ON "cards"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "swipes_card_id_action_decision_idx" ON "swipes"("card_id", "action", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_candidate_id_card_id_key" ON "swipes"("candidate_id", "card_id");

-- CreateIndex
CREATE INDEX "flags_card_id_idx" ON "flags"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "flags_candidate_id_card_id_key" ON "flags"("candidate_id", "card_id");

-- CreateIndex
CREATE INDEX "matches_recruiter_id_created_at_idx" ON "matches"("recruiter_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "matches_candidate_id_created_at_idx" ON "matches"("candidate_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "matches_candidate_id_card_id_key" ON "matches"("candidate_id", "card_id");

-- CreateIndex
CREATE INDEX "messages_match_id_created_at_idx" ON "messages"("match_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "applications_match_id_key" ON "applications"("match_id");

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_tags" ADD CONSTRAINT "candidate_tags_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_tags" ADD CONSTRAINT "candidate_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity rules Prisma cannot express in schema.prisma.
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_years_experience_check" CHECK ("years_experience" IS NULL OR "years_experience" BETWEEN 0 AND 60);
ALTER TABLE "cards" ADD CONSTRAINT "cards_salary_range_check" CHECK ("salary_min" IS NULL OR "salary_max" IS NULL OR "salary_min" <= "salary_max");
ALTER TABLE "cards" ADD CONSTRAINT "cards_salary_positive_check" CHECK (("salary_min" IS NULL OR "salary_min" >= 0) AND ("salary_max" IS NULL OR "salary_max" >= 0));
ALTER TABLE "cards" ADD CONSTRAINT "cards_published_at_check" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
-- Only likes carry a recruiter decision (REQ-FUNC-017).
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_decision_check" CHECK (("action" = 'LIKE' AND "decision" IS NOT NULL) OR ("action" = 'PASS' AND "decision" IS NULL AND "decided_at" IS NULL));
ALTER TABLE "messages" ADD CONSTRAINT "messages_body_not_blank_check" CHECK (length(btrim("body")) > 0);
-- CV files are limited to 5 MB (REQ-FUNC-021).
ALTER TABLE "applications" ADD CONSTRAINT "applications_cv_size_check" CHECK ("cv_size_bytes" IS NULL OR "cv_size_bytes" BETWEEN 1 AND 5242880);
