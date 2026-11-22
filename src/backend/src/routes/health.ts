import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "../../node_modules/.generated/prisma/client.js";
import type { FastifyPluginOptions } from "fastify";
import { ApiError } from "../errors.js";

interface HealthRouteOptions extends FastifyPluginOptions {
  prisma: PrismaClient;
  matchingUrl: string;
  matchingTimeoutMs: number;
}

export async function healthRoutes(app: FastifyInstance, options: HealthRouteOptions): Promise<void> {
  const { prisma, matchingUrl, matchingTimeoutMs } = options;

  app.get("/health", async () => ({
    status: "ok",
    service: "backend",
  }));

  app.get("/ready", async (_request, reply) => {
    let databaseUp = true;
    let matchingUp = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseUp = false;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), matchingTimeoutMs);
      const response = await fetch(`${matchingUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      matchingUp = response.ok;
    } catch {
      matchingUp = false;
    }
    if (!databaseUp || !matchingUp) {
      throw new ApiError(503, "SERVICE_UNAVAILABLE", "One or more dependencies are unavailable");
    }
    return reply.send({
      status: "ready",
      database: "up",
      matchingService: "up",
    });
  });
}
