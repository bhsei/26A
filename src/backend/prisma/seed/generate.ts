// Builds the synthetic seed dataset in memory (REQ-INST-002, REQ-ML-005).
//
// This module never touches the database, so it can be unit-tested; seed.ts
// writes its output. The same options always produce the same rows and IDs.
// Only timestamps follow `now`, so cards always look recently published.

import type { $Enums, Prisma } from "../../node_modules/.generated/prisma/client.js";
import {
  COLD_START_CANDIDATE_EMAIL,
  COMPANY_PREFIXES,
  SECTOR_COMPANY_SUFFIXES,
  CONTRACTS,
  DEMO_CANDIDATE_EMAIL,
  DEMO_RECRUITER_EMAIL,
  EDUCATION_LEVELS,
  FIRST_NAMES,
  LAST_INITIALS,
  LOCATIONS,
  PERKS,
  PRIVACY_NOTICE_VERSION,
  ROLES,
  SECTORS,
  SECTOR_DESCRIPTIONS,
  SKILLS,
  type RoleSeed,
  type SectorSlug,
  type TagSeed,
} from "./data.js";
import { createRandom } from "./random.js";

export interface SeedOptions {
  // Published Job Cards. Each company also gets one published Company Card
  // on top, so the feed holds cards + companies published cards.
  cards: number;
  candidates: number;
  // Defaults to max(10, cards / 25).
  companies?: number;
  seed: number;
  now: Date;
}

export const DEFAULT_OPTIONS = {
  cards: 50,
  candidates: 10,
  seed: 2026,
} as const;

// Rows in the shape Prisma's createMany expects. passwordHash is left empty
// here and filled in by seed.ts, because hashing is slow and not deterministic.
export interface SeedData {
  tags: Prisma.TagCreateManyInput[];
  companies: Prisma.CompanyCreateManyInput[];
  users: Prisma.UserCreateManyInput[];
  invitationCodes: Prisma.InvitationCodeCreateManyInput[];
  candidateProfiles: Prisma.CandidateProfileCreateManyInput[];
  candidateTags: Prisma.CandidateTagCreateManyInput[];
  cards: Prisma.CardCreateManyInput[];
  cardTags: Prisma.CardTagCreateManyInput[];
  swipes: Prisma.SwipeCreateManyInput[];
  demo: {
    candidateId: string;
    recruiterId: string;
    coldStartCandidateId: string;
  };
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Card = Prisma.CardCreateManyInput & { id: string; kind: $Enums.CardKind };

export function generateSeed(options: SeedOptions): SeedData {
  const { cards: publishedJobCards, candidates: candidateCount, seed, now } = options;
  const companyCount = options.companies ?? Math.max(10, Math.ceil(publishedJobCards / 25));
  if (publishedJobCards < 1 || candidateCount < 2 || companyCount < 1) {
    throw new Error("The seed needs at least 1 card, 2 candidates and 1 company");
  }

  const random = createRandom(seed);
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const between = (from: Date, to: Date) =>
    new Date(from.getTime() + Math.floor(random.next() * (to.getTime() - from.getTime())));

  // Tags -------------------------------------------------------------------

  const tags: Prisma.TagCreateManyInput[] = [];
  const tagIds = new Map<string, number>();
  const addTag = ({ type, slug, label }: TagSeed) => {
    const id = tags.length + 1;
    tags.push({ id, type, slug, label });
    tagIds.set(`${type}:${slug}`, id);
  };
  SECTORS.forEach(({ slug, label }) => addTag({ type: "SECTOR", slug, label }));
  ROLES.forEach(({ slug, label }) => addTag({ type: "ROLE", slug, label }));
  SKILLS.forEach(addTag);
  LOCATIONS.forEach(addTag);
  CONTRACTS.forEach(({ slug, label }) => addTag({ type: "CONTRACT", slug, label }));

  const tagId = (type: $Enums.TagType, slug: string): number => {
    const id = tagIds.get(`${type}:${slug}`);
    if (id === undefined) {
      throw new Error(`Unknown tag ${type}:${slug}`);
    }
    return id;
  };
  const contractSlug = (type: $Enums.ContractType) =>
    CONTRACTS.find((contract) => contract.type === type)!.slug;
  const locationSlug = (label: string) => LOCATIONS.find((l) => l.label === label)!.slug;

  // Companies, recruiters and invitation codes --------------------------------

  const companies: Prisma.CompanyCreateManyInput[] = [];
  const companySectors: SectorSlug[] = [];
  const companyRecruiters: string[][] = [];
  const users: Prisma.UserCreateManyInput[] = [];
  const invitationCodes: Prisma.InvitationCodeCreateManyInput[] = [];
  const usedCodes = new Set<string>();

  let personIndex = 0;
  const personName = () => {
    const first = FIRST_NAMES[personIndex % FIRST_NAMES.length]!;
    const initial = LAST_INITIALS[(personIndex * 7) % LAST_INITIALS.length];
    personIndex++;
    return `${first} ${initial}.`;
  };
  const addUser = (row: Omit<Prisma.UserCreateManyInput, "passwordHash" | "privacyConsentAt" | "privacyNoticeVersion" | "updatedAt"> & { id: string; createdAt: Date }) => {
    users.push({
      ...row,
      passwordHash: "",
      privacyConsentAt: row.createdAt,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      updatedAt: row.createdAt,
    });
    return row.id;
  };
  const newCode = (companyName: string) => {
    const prefix = companyName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
    for (;;) {
      const suffix = Array.from({ length: 6 }, () => random.pick([...CODE_ALPHABET])).join("");
      const code = `${prefix}-${suffix}`;
      if (!usedCodes.has(code)) {
        usedCodes.add(code);
        return code;
      }
    }
  };

  // Each prefix is used once; past 20 companies a number keeps names unique.
  const prefixes = random.shuffle(COMPANY_PREFIXES);

  let recruiterNumber = 0;
  for (let i = 0; i < companyCount; i++) {
    const sector = SECTORS[i % SECTORS.length]!;
    const round = Math.floor(i / prefixes.length);
    const name = `${prefixes[i % prefixes.length]} ${random.pick(SECTOR_COMPANY_SUFFIXES[sector.slug])}${round > 0 ? ` ${round + 1}` : ""}`;
    const createdAt = ago((120 - (i % 30)) * DAY);
    const companyId = random.uuid();
    companies.push({ id: companyId, name, sector: sector.label, createdAt, updatedAt: createdAt });
    companySectors.push(sector.slug);

    // The first recruiter creates the company (REQ-FUNC-003).
    const founderId = addUser({
      id: random.uuid(),
      email: i === 0 ? DEMO_RECRUITER_EMAIL : `recruiter${String(++recruiterNumber).padStart(3, "0")}@example.test`,
      role: "RECRUITER",
      displayName: personName(),
      companyId,
      createdAt,
    });
    const recruiters = [founderId];

    // Every third company has a second recruiter who joined with an
    // invitation code (REQ-FUNC-025).
    if (i % 3 === 0) {
      const joinedAt = new Date(createdAt.getTime() + 7 * DAY);
      const memberId = addUser({
        id: random.uuid(),
        email: `recruiter${String(++recruiterNumber).padStart(3, "0")}@example.test`,
        role: "RECRUITER",
        displayName: personName(),
        companyId,
        createdAt: joinedAt,
      });
      recruiters.push(memberId);
      invitationCodes.push({
        id: random.uuid(),
        companyId,
        code: newCode(name),
        createdById: founderId,
        usedById: memberId,
        usedAt: joinedAt,
        createdAt: new Date(joinedAt.getTime() - DAY),
      });
    }

    // One unused code per company, ready for a demo of joining.
    invitationCodes.push({
      id: random.uuid(),
      companyId,
      code: newCode(name),
      createdById: founderId,
      createdAt: ago(2 * DAY),
    });
    companyRecruiters.push(recruiters);
  }

  // Candidates -------------------------------------------------------------

  const candidateProfiles: Prisma.CandidateProfileCreateManyInput[] = [];
  const candidateTags: Prisma.CandidateTagCreateManyInput[] = [];
  const candidateTagSets: Set<number>[] = [];
  const candidateIds: string[] = [];

  for (let i = 0; i < candidateCount; i++) {
    const createdAt = ago((60 - (i % 50)) * DAY);
    const isDemo = i === 0;
    const isColdStart = i === 1;
    const id = addUser({
      id: random.uuid(),
      email: isDemo
        ? DEMO_CANDIDATE_EMAIL
        : isColdStart
          ? COLD_START_CANDIDATE_EMAIL
          : `candidate${String(i - 1).padStart(3, "0")}@example.test`,
      role: "CANDIDATE",
      displayName: personName(),
      createdAt,
    });
    candidateIds.push(id);

    const tagSet = new Set<number>();
    if (isColdStart) {
      // Skipped onboarding: empty background, no tags, no swipes (REQ-ML-002).
      candidateProfiles.push({ userId: id, updatedAt: createdAt });
    } else {
      let roles: RoleSeed[];
      let skills: string[];
      let locations: string[];
      let contract: $Enums.ContractType;
      if (isDemo) {
        // A clear profile so the demo shows relevant cards.
        roles = ROLES.filter((r) => r.slug === "mobile-developer" || r.slug === "frontend-developer");
        skills = ["react-native", "typescript", "react", "figma"];
        locations = ["barcelona", "remote"];
        contract = "FULL_TIME";
        candidateProfiles.push({ userId: id, educationLevel: "BACHELOR", yearsExperience: 2, updatedAt: createdAt });
      } else {
        roles = random.sample(ROLES, random.int(1, 2));
        skills = random.sample([...new Set(roles.flatMap((r) => r.skills))], random.int(2, 4));
        locations = random.sample(LOCATIONS, random.int(1, 2)).map((l) => l.slug);
        contract = random.weighted({ FULL_TIME: 6, PART_TIME: 1, INTERNSHIP: 2, TEMPORARY: 1, FREELANCE: 1 });
        candidateProfiles.push({
          userId: id,
          educationLevel: random.chance(0.85) ? random.pick(EDUCATION_LEVELS) : null,
          yearsExperience: random.chance(0.85) ? random.int(0, 15) : null,
          updatedAt: createdAt,
        });
      }
      roles.forEach((r) => tagSet.add(tagId("ROLE", r.slug)));
      skills.forEach((s) => tagSet.add(tagId("SKILL", s)));
      locations.forEach((l) => tagSet.add(tagId("LOCATION", l)));
      tagSet.add(tagId("CONTRACT", contractSlug(contract)));
      tagSet.forEach((tag) => candidateTags.push({ candidateId: id, tagId: tag }));
    }
    candidateTagSets.push(tagSet);
  }

  // Cards ------------------------------------------------------------------

  const cards: Card[] = [];
  const cardTags: Prisma.CardTagCreateManyInput[] = [];
  const cardTagSets = new Map<string, Set<number>>();

  const addCard = (card: Card, tagSet: Set<number>) => {
    cards.push(card);
    cardTagSets.set(card.id, tagSet);
    tagSet.forEach((tag) => cardTags.push({ cardId: card.id, tagId: tag }));
  };

  // One Company Card per company, always published (REQ-FUNC-008).
  for (let c = 0; c < companyCount; c++) {
    const sector = companySectors[c]!;
    const createdAt = companies[c]!.createdAt as Date;
    const publishedAt = between(ago(60 * DAY), ago(HOUR));
    const hq = random.pick(LOCATIONS.filter((l) => l.slug !== "remote"));
    const perks = random.sample(PERKS, random.int(2, 4));
    addCard(
      {
        id: random.uuid(),
        companyId: companies[c]!.id!,
        createdById: companyRecruiters[c]![0]!,
        kind: "COMPANY",
        status: "PUBLISHED",
        title: companies[c]!.name,
        description: `${SECTOR_DESCRIPTIONS[sector]} Our team is based in ${hq.label}.`,
        perks,
        publishedAt,
        createdAt,
        updatedAt: publishedAt,
      },
      new Set([tagId("SECTOR", sector), tagId("LOCATION", hq.slug)]),
    );
  }

  const jobCard = (companyIndex: number, status: $Enums.CardStatus) => {
    const sector = companySectors[companyIndex]!;
    const role = random.pick(ROLES.filter((r) => r.sectors.includes(sector)));
    const contract = random.weighted<$Enums.ContractType>({
      FULL_TIME: 6,
      PART_TIME: 1,
      INTERNSHIP: 2,
      TEMPORARY: 1,
      FREELANCE: 1,
    });
    const location = random.pick(LOCATIONS).label;
    const seniority = contract === "INTERNSHIP" ? "" : random.pick(["", "", "Junior ", "Senior "]);
    const title = contract === "INTERNSHIP" ? `${role.title} Intern` : `${seniority}${role.title}`;

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    if (contract !== "INTERNSHIP" && random.chance(0.75)) {
      const factor = contract === "PART_TIME" ? 0.5 : seniority === "Senior " ? 1.3 : seniority === "Junior " ? 0.8 : 1;
      salaryMin = Math.round((role.salary[0] * factor) / 500) * 500;
      salaryMax = Math.round((role.salary[1] * factor) / 500) * 500;
    }

    const contractLabel = CONTRACTS.find((c) => c.type === contract)!.label.toLowerCase();
    const where = location === "Remote" ? "Fully remote." : `Based in ${location}.`;
    const publishedAt = status === "DRAFT" ? null : between(ago(45 * DAY), ago(HOUR));
    const createdAt = publishedAt ? new Date(publishedAt.getTime() - DAY) : ago(random.int(1, 10) * DAY);

    addCard(
      {
        id: random.uuid(),
        companyId: companies[companyIndex]!.id!,
        createdById: random.pick(companyRecruiters[companyIndex]!),
        kind: "JOB",
        status,
        title,
        description: `${role.summary} This is a ${contractLabel} position. ${where}`,
        location,
        contractType: contract,
        salaryMin,
        salaryMax,
        salaryCurrency: salaryMin === null ? null : "EUR",
        perks: random.sample(PERKS, random.int(0, 3)),
        publishedAt,
        createdAt,
        updatedAt: publishedAt ?? createdAt,
      },
      new Set([
        tagId("ROLE", role.slug),
        ...random.sample(role.skills, random.int(2, 3)).map((s) => tagId("SKILL", s)),
        tagId("SECTOR", sector),
        tagId("LOCATION", locationSlug(location)),
        tagId("CONTRACT", contractSlug(contract)),
      ]),
    );
  };

  // Published Job Cards, spread evenly over the companies.
  for (let j = 0; j < publishedJobCards; j++) {
    jobCard(j % companyCount, "PUBLISHED");
  }

  // A few cards that must never reach a feed: drafts, unpublished and
  // deleted cards (REQ-FUNC-009, REQ-FUNC-011).
  const hiddenStatuses: $Enums.CardStatus[] = ["DRAFT", "UNPUBLISHED", "DELETED"];
  const hiddenCount = Math.max(3, Math.round(publishedJobCards * 0.06));
  for (let h = 0; h < hiddenCount; h++) {
    jobCard(h % companyCount, hiddenStatuses[h % hiddenStatuses.length]!);
  }

  // Swipes -----------------------------------------------------------------

  const swipes: Prisma.SwipeCreateManyInput[] = [];
  const published = cards.filter((card) => card.status === "PUBLISHED");
  // Cards that were visible once: candidates may have swiped them before they
  // were unpublished or deleted.
  const swipeable = cards.filter((card) => card.status !== "DRAFT");

  const addSwipe = (candidateIndex: number, card: Card, action: $Enums.SwipeAction) => {
    const createdAt = between(card.publishedAt as Date, ago(10 * 60 * 1000));
    let decision: $Enums.RecruiterDecision | null = null;
    let decidedAt: Date | null = null;
    // Only likes on Job Cards reach the interested-candidates list (REQ-FUNC-012).
    // No ACCEPTED decisions: accepting creates a match, which the default seed
    // does not create.
    if (action === "LIKE" && card.kind === "JOB") {
      decision = random.chance(0.75) ? "PENDING" : "DECLINED";
      if (decision === "DECLINED") {
        decidedAt = new Date(Math.min(createdAt.getTime() + random.int(1, 48) * HOUR, now.getTime()));
      }
    }
    swipes.push({
      id: random.uuid(),
      candidateId: candidateIds[candidateIndex]!,
      cardId: card.id,
      action,
      decision,
      decidedAt,
      createdAt,
    });
  };

  // The demo candidate has a short history with one of each action and keeps
  // a full feed.
  const demoTags = candidateTagSets[0]!;
  const overlap = (card: Card, tagSet: Set<number>) =>
    [...cardTagSets.get(card.id)!].filter((tag) => tagSet.has(tag)).length;
  const demoJobs = published
    .filter((card) => card.kind === "JOB")
    .sort((a, b) => overlap(b, demoTags) - overlap(a, demoTags));
  const demoActions: [Card | undefined, $Enums.SwipeAction][] = [
    [demoJobs[0], "LIKE"],
    [demoJobs[1], "GREEN_FLAG"],
    [demoJobs[demoJobs.length - 1], "PASS"],
    [published.find((card) => card.kind === "COMPANY"), "LIKE"],
  ];
  const demoSeen = new Set<string>();
  for (const [card, action] of demoActions) {
    if (card && !demoSeen.has(card.id) && demoSeen.size < published.length - 1) {
      demoSeen.add(card.id);
      addSwipe(0, card, action);
    }
  }

  // Other candidates mostly react to cards that match their background, which
  // also gives the graph ranking shared likes to find (REQ-ML-007).
  const perCandidate = Math.min(swipeable.length, Math.max(4, Math.min(25, Math.round(swipeable.length * 0.25))));
  for (let i = 2; i < candidateCount; i++) {
    const tagSet = candidateTagSets[i]!;
    const matching = random.shuffle(swipeable.filter((card) => overlap(card, tagSet) >= 2));
    const others = random.shuffle(swipeable.filter((card) => overlap(card, tagSet) < 2));
    const fromMatching = Math.min(matching.length, Math.ceil(perCandidate * 0.6));
    const chosen = [
      ...matching.slice(0, fromMatching).map((card) => [card, true] as const),
      ...others.slice(0, perCandidate - fromMatching).map((card) => [card, false] as const),
    ];
    for (const [card, isMatch] of chosen) {
      const action = isMatch
        ? random.weighted<$Enums.SwipeAction>({ LIKE: 55, GREEN_FLAG: 15, PASS: 25, RED_FLAG: 5 })
        : random.weighted<$Enums.SwipeAction>({ LIKE: 25, GREEN_FLAG: 10, PASS: 50, RED_FLAG: 15 });
      addSwipe(i, card, action);
    }
  }

  return {
    tags,
    companies,
    users,
    invitationCodes,
    candidateProfiles,
    candidateTags,
    cards,
    cardTags,
    swipes,
    demo: {
      candidateId: candidateIds[0]!,
      recruiterId: companyRecruiters[0]![0]!,
      coldStartCandidateId: candidateIds[1]!,
    },
  };
}
