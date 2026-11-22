import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { PrismaClient } from "../../node_modules/.generated/prisma/client.js";
import type { AppConfig } from "../config.js";
import { currentUser } from "./auth.js";

interface MatchRouteOptions extends FastifyPluginOptions {
  config: AppConfig;
  prisma: PrismaClient;
}

export async function matchRoutes(app: FastifyInstance, options: MatchRouteOptions): Promise<void> {
  const { config, prisma } = options;

  app.get("/matches", async (request) => {
    const user = await currentUser(request, config.jwtSecret, prisma);
    const matches = await prisma.match.findMany({
      where: user.role === "CANDIDATE"
        ? { candidateId: user.id, endedAt: null }
        : { recruiterId: user.id, endedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        card: { include: { company: true } },
        candidate: true,
        recruiter: true,
      },
    });
    return {
      matches: matches.map((match) => ({
        id: match.id,
        cardId: match.cardId,
        cardTitle: match.card.title,
        companyName: match.card.company.name,
        ...(user.role === "CANDIDATE"
          ? { recruiterDisplayName: match.recruiter.displayName ?? "Recruiter" }
          : { candidateDisplayName: match.candidate.displayName ?? "Candidate" }),
        createdAt: match.createdAt.toISOString(),
        status: "MATCHED",
      })),
    };
  });
}
