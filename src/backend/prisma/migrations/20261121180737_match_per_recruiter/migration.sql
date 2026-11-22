-- Allow one match per accepting recruiter for a candidate and Job Card.
DROP INDEX IF EXISTS "matches_candidate_id_card_id_key";

ALTER TABLE "matches"
  ADD CONSTRAINT "matches_candidateId_recruiterId_cardId_key"
  UNIQUE ("candidate_id", "recruiter_id", "card_id");

ALTER TABLE "users"
  ADD COLUMN "age_confirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "privacy_accepted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "swipes"
  ADD COLUMN "idempotency_key" VARCHAR(36);

CREATE UNIQUE INDEX "swipes_candidate_id_idempotency_key_key"
  ON "swipes"("candidate_id", "idempotency_key");

CREATE TABLE "revoked_tokens" (
  "jti" VARCHAR(36) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "revoked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("jti")
);

CREATE INDEX "revoked_tokens_expires_at_idx"
  ON "revoked_tokens"("expires_at");
