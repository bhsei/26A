// Loads synthetic demo data into the local database (REQ-INST-002).
//
//   npm run db:seed                       default: 50 Job Cards, 10 candidates
//   npm run db:seed -- --cards 1000       load-test size (REQ-PERF-001)
//   npm run db:seed -- --seed 7           a different, still repeatable, dataset
//
// Options: --cards <n>, --candidates <n>, --companies <n>, --seed <n>.
//
// WARNING: it empties every application table first, and refuses to run
// unless DATABASE_URL points to localhost.

import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import * as generatedClient from "../node_modules/.generated/prisma/client.js";
import { DEMO_CANDIDATE_EMAIL, DEMO_PASSWORD, DEMO_RECRUITER_EMAIL, COLD_START_CANDIDATE_EMAIL } from "./seed/data.js";
import { DEFAULT_OPTIONS, generateSeed, type SeedData } from "./seed/generate.js";
import { hashPassword } from "./seed/password.js";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

// The client is generated into node_modules, where Node does not apply this
// package's "type": "module", so tsx loads it as CommonJS and its exports end
// up under `default`. Accept both shapes.
const { PrismaClient } = ((generatedClient as { default?: typeof generatedClient }).default ??
  generatedClient) as typeof generatedClient;
type PrismaClient = InstanceType<typeof PrismaClient>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function parseArgs(argv: string[]) {
  const allowed = new Set(["cards", "candidates", "companies", "seed"]);
  const values: Record<string, number> = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i]!.replace(/^--/, "");
    const raw = argv[i + 1];
    if (!argv[i]!.startsWith("--") || !allowed.has(name) || raw === undefined) {
      throw new Error(`Unknown or incomplete option "${argv[i]}". Use --cards, --candidates, --companies or --seed followed by a number.`);
    }
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`--${name} must be a positive whole number`);
    }
    values[name] = value;
    i++;
  }
  return {
    cards: values.cards ?? DEFAULT_OPTIONS.cards,
    candidates: values.candidates ?? DEFAULT_OPTIONS.candidates,
    companies: values.companies,
    seed: values.seed ?? DEFAULT_OPTIONS.seed,
  };
}

function localDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set (see src/backend/README.md)");
  }
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to seed "${host}": the seed empties every table and only runs against localhost`);
  }
  return url;
}

async function write(prisma: PrismaClient, data: SeedData) {
  await prisma.$transaction(
    async (tx) => {
      // Empty every application table, whatever tables exist now.
      const tables = await tx.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
      if (tables.length > 0) {
        const list = tables.map(({ tablename }) => `"${tablename}"`).join(", ");
        await tx.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
      }

      // Parents before children, following the foreign keys.
      await tx.tag.createMany({ data: data.tags });
      await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('tags', 'id'), (SELECT max(id) FROM tags))`;
      await tx.company.createMany({ data: data.companies });
      await tx.user.createMany({ data: data.users });
      await tx.invitationCode.createMany({ data: data.invitationCodes });
      await tx.candidateProfile.createMany({ data: data.candidateProfiles });
      await tx.candidateTag.createMany({ data: data.candidateTags });
      await tx.card.createMany({ data: data.cards });
      await tx.cardTag.createMany({ data: data.cardTags });
      await tx.swipe.createMany({ data: data.swipes });
    },
    { maxWait: 10_000, timeout: 120_000 },
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const url = localDatabaseUrl();
  const started = Date.now();

  const data = generateSeed({ ...options, now: new Date() });
  for (const user of data.users) {
    user.passwordHash = await hashPassword(DEMO_PASSWORD);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    await write(prisma, data);
  } finally {
    await prisma.$disconnect();
  }

  const count = (status: string) => data.cards.filter((card) => card.status === status).length;
  const publishedOfKind = (kind: string) =>
    data.cards.filter((card) => card.status === "PUBLISHED" && card.kind === kind).length;
  const recruiters = data.users.filter((user) => user.role === "RECRUITER").length;
  console.log(`Seeded the local database in ${((Date.now() - started) / 1000).toFixed(1)} s (seed ${options.seed}):`);
  console.table({
    companies: data.companies.length,
    recruiters,
    candidates: data.users.length - recruiters,
    "invitation codes": data.invitationCodes.length,
    tags: data.tags.length,
    "published Job Cards": publishedOfKind("JOB"),
    "published Company Cards": publishedOfKind("COMPANY"),
    "draft / unpublished / deleted Job Cards": `${count("DRAFT")} / ${count("UNPUBLISHED")} / ${count("DELETED")}`,
    swipes: data.swipes.length,
  });
  console.log(`Demo accounts (password "${DEMO_PASSWORD}"):`);
  console.log(`  candidate:             ${DEMO_CANDIDATE_EMAIL}`);
  console.log(`  candidate, cold start: ${COLD_START_CANDIDATE_EMAIL}`);
  console.log(`  recruiter:             ${DEMO_RECRUITER_EMAIL}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
