// Tests for the synthetic seed generator (REQ-INST-002, TC-INST-002).
//
// They run on the generated rows in memory, so they never touch a database.
// They also mirror the database constraints, so a broken generator fails here
// instead of half-way through `npm run db:seed`.

import { describe, expect, it } from "vitest";
import { DEMO_CANDIDATE_EMAIL } from "../prisma/seed/data.js";
import { DEFAULT_OPTIONS, generateSeed, type SeedData } from "../prisma/seed/generate.js";

const now = new Date("2026-11-10T12:00:00Z");
const defaults = generateSeed({ ...DEFAULT_OPTIONS, now });
const large = generateSeed({ ...DEFAULT_OPTIONS, cards: 1000, now });

const published = (data: SeedData) => data.cards.filter((card) => card.status === "PUBLISHED");
const publishedJobs = (data: SeedData) => published(data).filter((card) => card.kind === "JOB");
const candidates = (data: SeedData) => data.users.filter((user) => user.role === "CANDIDATE");

// Same rule as the candidate feed (REQ-FUNC-011): published and not swiped.
const feed = (data: SeedData, candidateId: string) => {
  const swiped = new Set(data.swipes.filter((s) => s.candidateId === candidateId).map((s) => s.cardId));
  return published(data).filter((card) => !swiped.has(card.id!));
};

describe("seed sizes (REQ-INST-002)", () => {
  it("creates at least 10 companies in at least 3 sectors, 50 Job Cards and 10 candidates by default", () => {
    expect(defaults.companies.length).toBeGreaterThanOrEqual(10);
    expect(new Set(defaults.companies.map((c) => c.sector)).size).toBeGreaterThanOrEqual(3);
    expect(publishedJobs(defaults)).toHaveLength(50);
    // Plus one published Company Card per company.
    expect(published(defaults)).toHaveLength(50 + defaults.companies.length);
    expect(candidates(defaults)).toHaveLength(10);
  });

  it("creates 1,000 published Job Cards with --cards 1000 (REQ-PERF-001)", () => {
    expect(publishedJobs(large)).toHaveLength(1000);
    expect(published(large).length).toBeGreaterThanOrEqual(1000);
  });

  it("also creates draft, unpublished and deleted cards", () => {
    const statuses = new Set(defaults.cards.map((card) => card.status));
    expect(statuses).toEqual(new Set(["PUBLISHED", "DRAFT", "UNPUBLISHED", "DELETED"]));
  });
});

describe("demo data", () => {
  it("gives the demo candidate a non-empty feed (TC-INST-002)", () => {
    const demo = defaults.users.find((user) => user.email === DEMO_CANDIDATE_EMAIL)!;
    expect(demo.id).toBe(defaults.demo.candidateId);
    expect(feed(defaults, demo.id!).length).toBeGreaterThan(0);
    expect(defaults.swipes.some((s) => s.candidateId === demo.id)).toBe(true);
  });

  it("includes a cold-start candidate with no background, tags or swipes (REQ-ML-002)", () => {
    const id = defaults.demo.coldStartCandidateId;
    const profile = defaults.candidateProfiles.find((p) => p.userId === id)!;
    expect(profile.educationLevel ?? null).toBeNull();
    expect(profile.yearsExperience ?? null).toBeNull();
    expect(defaults.candidateTags.filter((t) => t.candidateId === id)).toHaveLength(0);
    expect(defaults.swipes.filter((s) => s.candidateId === id)).toHaveLength(0);
    expect(feed(defaults, id)).toHaveLength(published(defaults).length);
  });

  it("uses every swipe action", () => {
    expect(new Set(defaults.swipes.map((s) => s.action))).toEqual(
      new Set(["LIKE", "PASS", "GREEN_FLAG", "RED_FLAG"]),
    );
  });

  it("includes a company with a recruiter who joined by invitation code (REQ-FUNC-025)", () => {
    expect(defaults.invitationCodes.some((code) => code.usedById && code.usedAt)).toBe(true);
    expect(defaults.invitationCodes.some((code) => !code.usedAt)).toBe(true);
  });
});

describe("repeatability", () => {
  it("produces identical data for the same seed", () => {
    expect(generateSeed({ ...DEFAULT_OPTIONS, now })).toEqual(defaults);
  });

  it("produces different data for another seed", () => {
    const other = generateSeed({ ...DEFAULT_OPTIONS, seed: 7, now });
    expect(other.demo.candidateId).not.toBe(defaults.demo.candidateId);
  });
});

// The same rules the database enforces, checked before anything is written.
describe.each([
  ["default", defaults],
  ["1,000 cards", large],
])("database rules (%s)", (_, data) => {
  it("uses unique emails, stored in lower case", () => {
    const emails = data.users.map((user) => user.email);
    expect(new Set(emails).size).toBe(emails.length);
    emails.forEach((email) => expect(email).toBe(email.toLowerCase()));
    emails.forEach((email) => expect(email).toMatch(/@example\.test$/));
  });

  it("gives a company only to recruiters, and every recruiter a company (REQ-FUNC-003)", () => {
    for (const user of data.users) {
      if (user.role === "CANDIDATE") {
        expect(user.companyId ?? null).toBeNull();
      } else {
        expect(user.companyId).toBeTruthy();
      }
    }
  });

  it("gives Job Cards a location and contract type, and every card a tag (REQ-FUNC-008)", () => {
    const tagged = new Set(data.cardTags.map((t) => t.cardId));
    for (const card of data.cards) {
      expect(tagged.has(card.id!)).toBe(true);
      if (card.kind === "JOB") {
        expect(card.location?.trim()).toBeTruthy();
        expect(card.contractType).toBeTruthy();
      }
      if (card.status === "PUBLISHED") {
        expect(card.publishedAt).toBeTruthy();
      }
      if (card.salaryMin != null && card.salaryMax != null) {
        expect(card.salaryMin).toBeLessThanOrEqual(card.salaryMax);
      }
    }
  });

  it("stores one swipe per candidate and card, from candidates only (REQ-FUNC-011)", () => {
    const keys = data.swipes.map((s) => `${s.candidateId}:${s.cardId}`);
    expect(new Set(keys).size).toBe(keys.length);
    const candidateIds = new Set(candidates(data).map((user) => user.id));
    data.swipes.forEach((s) => expect(candidateIds.has(s.candidateId)).toBe(true));
  });

  it("gives a recruiter decision only to likes on Job Cards (REQ-FUNC-012)", () => {
    const kind = new Map(data.cards.map((card) => [card.id, card.kind]));
    const status = new Map(data.cards.map((card) => [card.id, card.status]));
    for (const swipe of data.swipes) {
      const isJobLike = swipe.action === "LIKE" && kind.get(swipe.cardId) === "JOB";
      expect(swipe.decision != null).toBe(isJobLike);
      // No matches are seeded, so no like is accepted.
      expect(swipe.decision).not.toBe("ACCEPTED");
      if (swipe.decidedAt) {
        expect(swipe.decision).toBeTruthy();
      }
      expect(status.get(swipe.cardId)).not.toBe("DRAFT");
    }
  });

  it("issues unique invitation codes; a used code records when (REQ-FUNC-025)", () => {
    const codes = data.invitationCodes.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    data.invitationCodes.forEach((c) => {
      if (c.usedById) {
        expect(c.usedAt).toBeTruthy();
      }
    });
  });
});

describe("company names", () => {
  it.each([
    ["default", defaults],
    ["1,000 cards", large],
  ])("are unique (%s)", (_, data) => {
    const names = data.companies.map((company) => company.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
