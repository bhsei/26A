import type { FastifyInstance, FastifyRequest, FastifyPluginOptions } from "fastify";
import type { PrismaClient } from "../../node_modules/.generated/prisma/client.js";
import type { AppConfig } from "../config.js";
import { currentUser } from "./auth.js";
import { ApiError } from "../errors.js";

interface FeedRouteOptions extends FastifyPluginOptions {
  config: AppConfig;
  prisma: PrismaClient;
}

async function candidateUser(request: FastifyRequest, config: AppConfig, prisma: PrismaClient) {
  const user = await currentUser(request, config.jwtSecret, prisma);
  if (user.role !== "CANDIDATE") throw new ApiError(403, "FORBIDDEN", "Candidate access is required");
  return user;
}

function cardResponse(card: any, matchScore: number | null = null) {
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
    matchScore,
    status: card.status,
    published: card.status === "PUBLISHED",
    createdAt: card.createdAt.toISOString(),
  };
}

export async function feedRoutes(app: FastifyInstance, options: FeedRouteOptions): Promise<void> {
  const { config, prisma } = options;

  const rankCards = async (candidateId: string, limit: number, requestId: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.matchingTimeoutMs);
    try {
      const response = await fetch(`${config.matchingUrl}/internal/matching/rank`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "X-API-Key": config.matchingApiKey,
        },
        body: JSON.stringify({ candidateId, limit, cursor: null }),
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const body = await response.json() as {
        items?: Array<{ cardId: string; score: number }>;
      };
      return body.items ?? null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  app.get("/candidate/feed", async (request) => {
    const user = await candidateUser(request, config, prisma);
    const limit = Number((request.query as { limit?: string }).limit ?? 20);
    const safeLimit = Number.isInteger(limit) ? Math.min(50, Math.max(1, limit)) : 20;

    const eligible = await prisma.card.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        swipes: { none: { candidateId: user.id } },
      },
      include: { company: true, tags: { include: { tag: true } } },
      take: 100,
    });
    const requestId = (request as FastifyRequest & { id: string }).id;
    const ranked = await rankCards(user.id, safeLimit, requestId);
    let cards = eligible;
    let source: "MATCHING_SERVICE" | "POSTGRESQL_FALLBACK" = "MATCHING_SERVICE";
    let scores = new Map<string, number>();

    if (ranked) {
      const byId = new Map(cards.map((card) => [card.id, card]));
      scores = new Map(ranked.map((item) => [item.cardId, item.score]));
      cards = ranked
        .map((item) => byId.get(item.cardId))
        .filter((card): card is typeof eligible[number] => card !== undefined)
        .concat(cards.filter((card) => !ranked.some((item) => item.cardId === card.id)));
    } else {
      source = "POSTGRESQL_FALLBACK";
      cards = cards.sort((a, b) =>
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
      );
    }

    cards = cards.slice(0, safeLimit);
    return {
      cards: cards.map((card) => cardResponse(card, scores.get(card.id) ?? null)),
      source,
      nextCursor: null,
    };
  });

  app.post("/candidate/swipes", async (request) => {
    const user = await candidateUser(request, config, prisma);
    const body = request.body as { cardId?: string; action?: string };
    const idempotencyKey = request.headers["idempotency-key"];
    if (typeof idempotencyKey !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
      throw new ApiError(400, "BAD_REQUEST", "Idempotency-Key must be a UUID v4");
    }
    if (!body.cardId || !["LIKE", "PASS", "GREEN_FLAG", "RED_FLAG"].includes(body.action ?? "")) {
      throw new ApiError(422, "VALIDATION_ERROR", "cardId and a valid swipe action are required");
    }

    const keyedSwipe = await prisma.swipe.findUnique({
      where: { candidateId_idempotencyKey: { candidateId: user.id, idempotencyKey } },
    });
    if (keyedSwipe) {
      if (keyedSwipe.cardId !== body.cardId || keyedSwipe.action !== body.action) {
        throw new ApiError(409, "CONFLICT", "The Idempotency-Key was used with a different request");
      }
      return { recorded: true, cardId: keyedSwipe.cardId, action: keyedSwipe.action };
    }

    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      select: { id: true, kind: true, status: true },
    });
    if (!card || card.status !== "PUBLISHED") {
      throw new ApiError(404, "NOT_FOUND", "The requested card is not available");
    }

    const existing = await prisma.swipe.findUnique({
      where: { candidateId_cardId: { candidateId: user.id, cardId: card.id } },
    });
    if (existing) return { recorded: true, cardId: card.id, action: existing.action };

    const action = body.action as "LIKE" | "PASS" | "GREEN_FLAG" | "RED_FLAG";
    const swipe = await prisma.swipe.create({
      data: {
        candidateId: user.id,
        cardId: card.id,
        action,
        decision: action === "LIKE" && card.kind === "JOB" ? "PENDING" : null,
        idempotencyKey,
      },
    });
    return { recorded: true, cardId: swipe.cardId, action: swipe.action };
  });

}
