import Fastify from "fastify";
import { registerErrorHandler } from "./errors.js";
import { registerRequestId } from "./request-id.js";
import { authRoutes } from "./routes/auth.js";
import { feedRoutes } from "./routes/feed.js";
import { healthRoutes } from "./routes/health.js";
import { createDatabase } from "./database.js";
import type { PrismaClient } from "../node_modules/.generated/prisma/client.js";
import { loadConfig, type AppConfig } from "./config.js";
import { candidateRoutes } from "./routes/candidate.js";
import { recruiterRoutes } from "./routes/recruiter.js";
import { matchRoutes } from "./routes/matches.js";

export interface AppDependencies {
  config: AppConfig;
  prisma: PrismaClient;
}

export function buildApp(overrides?: Partial<AppDependencies>) {
  let config = overrides?.config;
  if (!config) {
    try {
      config = loadConfig();
    } catch (error) {
      if (process.env.NODE_ENV !== "test") throw error;
      config = {
        host: "127.0.0.1",
        port: 3000,
        nodeEnv: "test",
        databaseUrl: "postgresql://adoptajob:local-only@localhost:5432/adoptajob",
        jwtSecret: "test-secret-at-least-32-characters",
        matchingUrl: "http://localhost:4000",
        matchingTimeoutMs: 1000,
        matchingApiKey: "test-matching-api-key",
      };
    }
  }
  const prisma = overrides?.prisma ?? createDatabase(config.databaseUrl);
  const app = Fastify({
    logger: {
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
  });

  registerRequestId(app);
  registerErrorHandler(app);
  app.register(async (instance) => healthRoutes(instance, {
    prisma,
    matchingUrl: config.matchingUrl,
    matchingTimeoutMs: config.matchingTimeoutMs,
  }));
  app.register(async (instance) => authRoutes(instance, { config, prisma }));
  app.register(async (instance) => feedRoutes(instance, { config, prisma }));
  app.register(async (instance) => candidateRoutes(instance, { config, prisma }));
  app.register(async (instance) => recruiterRoutes(instance, { config, prisma }));
  app.register(async (instance) => matchRoutes(instance, { config, prisma }));

  return app;
}
