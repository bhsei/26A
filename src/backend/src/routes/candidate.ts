import type { FastifyInstance, FastifyRequest, FastifyPluginOptions } from "fastify";
import type { PrismaClient } from "../../node_modules/.generated/prisma/client.js";
import type { AppConfig } from "../config.js";
import { currentUser } from "./auth.js";
import { ApiError } from "../errors.js";

interface CandidateRouteOptions extends FastifyPluginOptions {
  config: AppConfig;
  prisma: PrismaClient;
}

const EDUCATION_INPUT = new Map([
  ["NONE", "NONE"],
  ["SECONDARY", "SECONDARY"],
  ["VOCATIONAL", "VOCATIONAL"],
  ["BACHELOR", "BACHELOR"],
  ["MASTER", "MASTER"],
  ["DOCTORATE", "DOCTORATE"],
  ["High school", "SECONDARY"],
  ["Secondary", "SECONDARY"],
  ["Vocational", "VOCATIONAL"],
  ["Bachelor", "BACHELOR"],
  ["Master", "MASTER"],
  ["Doctorate", "DOCTORATE"],
]);
const EDUCATION_OUTPUT: Record<string, string> = {
  NONE: "None",
  SECONDARY: "Secondary",
  VOCATIONAL: "Vocational",
  BACHELOR: "Bachelor",
  MASTER: "Master",
  DOCTORATE: "Doctorate",
};

async function ensureCandidate(request: FastifyRequest, config: AppConfig, prisma: PrismaClient) {
  const user = await currentUser(request, config.jwtSecret, prisma);
  if (user.role !== "CANDIDATE") {
  throw new ApiError(403, "FORBIDDEN", "Candidate access is required");
  }
  return user;
}

export async function candidateRoutes(app: FastifyInstance, options: CandidateRouteOptions): Promise<void> {
  const { config, prisma } = options;

  app.get("/candidate/profile", async (request) => {
    const user = await ensureCandidate(request, config, prisma);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      include: { tags: { include: { tag: true } } },
    });
    const tags = profile?.tags.map((item) => item.tag) ?? [];
    return {
      profile: {
        userId: user.id,
        displayName: user.displayName ?? "",
        desiredRoles: tags.filter((tag) => tag.type === "ROLE").map((tag) => tag.slug).join(", "),
        skills: tags.filter((tag) => tag.type === "SKILL").map((tag) => tag.slug),
        educationLevel: profile?.educationLevel ? EDUCATION_OUTPUT[profile.educationLevel] ?? "None" : "None",
        experienceYears: profile?.yearsExperience?.toString() ?? "0",
        preferredLocations: tags.filter((tag) => tag.type === "LOCATION").map((tag) => tag.slug).join(", "),
        contractType: tags.find((tag) => tag.type === "CONTRACT")?.slug ?? "",
      },
    };
  });

  app.put("/candidate/profile", async (request) => {
    const user = await ensureCandidate(request, config, prisma);
    const body = request.body as {
      displayName?: string;
      desiredRoles?: string;
      skills?: string[];
      educationLevel?: string;
      experienceYears?: string;
      preferredLocations?: string;
      contractType?: string;
    };
    const educationLevel = body.educationLevel
      ? EDUCATION_INPUT.get(body.educationLevel) ?? "NONE"
      : "NONE";
    const experience = Number(body.experienceYears ?? 0);
    if (!Number.isInteger(experience) || experience < 0 || experience > 60) {
      throw new ApiError(422, "VALIDATION_ERROR", "experienceYears must be a whole number from 0 to 60");
    }

    const tagSlugs = [
      ...String(body.desiredRoles ?? "").split(",").map((value) => [value.trim(), "ROLE"] as const),
      ...(body.skills ?? []).map((value) => [value.trim(), "SKILL"] as const),
      ...String(body.preferredLocations ?? "").split(",").map((value) => [value.trim(), "LOCATION"] as const),
      ...(body.contractType?.trim() ? [[body.contractType.trim(), "CONTRACT"] as const] : []),
    ].filter(([slug]) => slug.length > 0);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { displayName: body.displayName?.trim() || null },
      });
      await tx.candidateProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          educationLevel: educationLevel as never,
          yearsExperience: experience,
        },
        update: {
          educationLevel: educationLevel as never,
          yearsExperience: experience,
        },
      });
      await tx.candidateTag.deleteMany({ where: { candidateId: user.id } });
      for (const [slug, type] of tagSlugs) {
        const tag = await tx.tag.upsert({
          where: { type_slug: { type: type as never, slug } },
          create: { type: type as never, slug, label: slug },
          update: {},
        });
        await tx.candidateTag.create({
          data: { candidateId: user.id, tagId: tag.id },
        });
      }
    });

    return {
      profile: {
        userId: user.id,
        displayName: body.displayName?.trim() ?? "",
        desiredRoles: body.desiredRoles ?? "",
        skills: body.skills ?? [],
        educationLevel: EDUCATION_OUTPUT[educationLevel] ?? "None",
        experienceYears: String(experience),
        preferredLocations: body.preferredLocations ?? "",
        contractType: body.contractType ?? "",
      },
    };
  });
}
