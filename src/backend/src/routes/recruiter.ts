import type { FastifyInstance, FastifyRequest, FastifyPluginOptions } from "fastify";
import type { PrismaClient } from "../../node_modules/.generated/prisma/client.js";
import type { AppConfig } from "../config.js";
import { currentUser } from "./auth.js";
import { ApiError } from "../errors.js";

interface RecruiterRouteOptions extends FastifyPluginOptions {
  config: AppConfig;
  prisma: PrismaClient;
}

async function ensureRecruiter(request: FastifyRequest, config: AppConfig, prisma: PrismaClient) {
  const user = await currentUser(request, config.jwtSecret, prisma);
  if (user.role !== "RECRUITER" || !user.companyId) {
    throw new ApiError(403, "FORBIDDEN", "A recruiter belonging to a company is required");
  }
  return user;
}

function recruiterCard(card: any) {
  const contractLabels: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    INTERNSHIP: "Internship",
    TEMPORARY: "Temporary",
    FREELANCE: "Freelance",
  };
  return {
    id: card.id,
    kind: card.kind,
    companyName: card.company.name,
    sector: card.company.sector,
    title: card.title,
    description: card.description,
    location: card.location ?? "",
    contractType: card.contractType ? contractLabels[card.contractType] ?? card.contractType : "",
    tags: card.tags.map((item: any) => item.tag.slug),
    salaryRange: card.salaryMin == null || card.salaryMax == null
      ? null
      : `${card.salaryMin}-${card.salaryMax}`,
    perks: card.perks.join(", ") || null,
    matchScore: null,
    status: card.status,
    createdAt: card.createdAt.toISOString(),
  };
}

export async function recruiterRoutes(app: FastifyInstance, options: RecruiterRouteOptions): Promise<void> {
  const { config, prisma } = options;

  app.get("/recruiter/cards", async (request) => {
    const user = await ensureRecruiter(request, config, prisma);
    const cards = await prisma.card.findMany({
      where: { companyId: user.companyId!, status: { not: "DELETED" } },
      include: { company: true, tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { cards: cards.map(recruiterCard) };
  });

  app.post("/recruiter/cards", async (request, reply) => {
    const user = await ensureRecruiter(request, config, prisma);
    const body = request.body as {
      kind?: string;
      companyName?: string;
      sector?: string;
      title?: string;
      description?: string;
      location?: string;
      contractType?: string;
      tags?: string[];
      salaryRange?: string | null;
      perks?: string | null;
    };
    if (!body.title?.trim() || !body.description?.trim()) {
      throw new ApiError(422, "VALIDATION_ERROR", "title and description are required");
    }
    const kind = body.kind === "COMPANY" ? "COMPANY" : "JOB";
    if (kind === "JOB" && (!body.location?.trim() || !body.contractType?.trim())) {
      throw new ApiError(422, "VALIDATION_ERROR", "Job cards require location and contractType");
    }
    const contractTypes: Record<string, string> = {
      "FULL_TIME": "FULL_TIME",
      "Full-time": "FULL_TIME",
      "PART_TIME": "PART_TIME",
      "Part-time": "PART_TIME",
      "INTERNSHIP": "INTERNSHIP",
      "Internship": "INTERNSHIP",
      "TEMPORARY": "TEMPORARY",
      "Temporary": "TEMPORARY",
      "FREELANCE": "FREELANCE",
      "Freelance": "FREELANCE",
    };
    const contractType = kind === "JOB"
      ? contractTypes[body.contractType ?? ""]
      : undefined;
    if (kind === "JOB" && !contractType) {
      throw new ApiError(422, "VALIDATION_ERROR", "contractType is not supported");
    }
    if (body.companyName?.trim() && body.companyName.trim() !== user.company!.name) {
      throw new ApiError(403, "FORBIDDEN", "The submitted company is not authorized");
    }
    if (body.sector?.trim() && body.sector.trim() !== user.company!.sector) {
      throw new ApiError(403, "FORBIDDEN", "The submitted sector is not authorized");
    }

    const card = await prisma.$transaction(async (tx) => {
      const created = await tx.card.create({
        data: {
          companyId: user.companyId!,
          createdById: user.id,
          kind,
          status: "PUBLISHED",
          title: body.title!.trim(),
          description: body.description!.trim(),
          location: body.location?.trim() || null,
          contractType: contractType as never,
          publishedAt: new Date(),
          perks: body.perks ? body.perks.split(",").map((item) => item.trim()).filter(Boolean) : [],
        },
        include: { company: true, tags: { include: { tag: true } } },
      });
      for (const slug of body.tags ?? []) {
        const normalized = slug.trim();
        if (!normalized) continue;
        const tag = await tx.tag.upsert({
          where: { type_slug: { type: "SKILL", slug: normalized } },
          create: { type: "SKILL", slug: normalized, label: normalized },
          update: {},
        });
        await tx.cardTag.create({ data: { cardId: created.id, tagId: tag.id } });
      }
      return tx.card.findUniqueOrThrow({
        where: { id: created.id },
        include: { company: true, tags: { include: { tag: true } } },
      });
    });
    return reply.status(201).send({ card: recruiterCard(card) });
  });

  app.get("/recruiter/interested", async (request) => {
    const user = await ensureRecruiter(request, config, prisma);
    const cards = await prisma.card.findMany({
      where: { companyId: user.companyId!, status: { not: "DELETED" } },
      select: { id: true },
    });
    const swipes = await prisma.swipe.findMany({
      where: {
        cardId: { in: cards.map((card) => card.id) },
        action: "LIKE",
        decision: "PENDING",
        card: { kind: "JOB", status: { not: "DELETED" } },
      },
      include: {
        card: true,
        candidate: { include: { candidateProfile: { include: { tags: { include: { tag: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      swipes: swipes.map((swipe) => ({
        id: swipe.id,
        cardId: swipe.cardId,
        cardTitle: swipe.card.title,
        candidateId: swipe.candidateId,
        candidateDisplayName: swipe.candidate.displayName ?? swipe.candidate.email,
        candidateSkills: swipe.candidate.candidateProfile?.tags
          .filter((item) => item.tag.type === "SKILL")
          .map((item) => item.tag.slug) ?? [],
        action: swipe.action,
        createdAt: swipe.createdAt.toISOString(),
      })),
    };
  });

  app.post("/recruiter/interested/:swipeId/decision", async (request) => {
    const user = await ensureRecruiter(request, config, prisma);
    const { swipeId } = request.params as { swipeId: string };
    const body = request.body as { decision?: string };
    if (body.decision !== "ACCEPT" && body.decision !== "DECLINE") {
      throw new ApiError(422, "VALIDATION_ERROR", "decision must be ACCEPT or DECLINE");
    }

    const swipe = await prisma.swipe.findUnique({
      where: { id: swipeId },
      include: { card: true },
    });
    if (!swipe || swipe.card.companyId !== user.companyId ||
        swipe.action !== "LIKE" || swipe.card.kind !== "JOB" ||
        swipe.card.status === "DELETED") {
      throw new ApiError(404, "NOT_FOUND", "The interested candidate could not be found");
    }

    if (body.decision === "ACCEPT") {
      const match = await prisma.$transaction(async (tx) => {
        await tx.swipe.update({
          where: { id: swipe.id },
          data: { decision: "ACCEPTED", decidedAt: new Date() },
        });
        return tx.match.create({
          data: {
            candidateId: swipe.candidateId,
            recruiterId: user.id,
            cardId: swipe.cardId,
          },
        });
      });
      return {
        swipeId: swipe.id,
        decision: "ACCEPT",
        match: {
          id: match.id,
          cardId: match.cardId,
          candidateId: match.candidateId,
          recruiterId: match.recruiterId,
          status: "MATCHED",
          createdAt: match.createdAt.toISOString(),
        },
      };
    } else {
      await prisma.swipe.update({
        where: { id: swipe.id },
        data: { decision: "DECLINED", decidedAt: new Date() },
      });
      return { swipeId: swipe.id, decision: "DECLINE", match: null };
    }
  });
}
