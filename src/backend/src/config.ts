import "dotenv/config";

export interface AppConfig {
  host: string;
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  matchingUrl: string;
  matchingTimeoutMs: number;
  matchingApiKey: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and contain at least 32 characters");
  }
  if (!env.MATCHING_SERVICE_API_KEY || env.MATCHING_SERVICE_API_KEY.length < 16) {
    throw new Error("MATCHING_SERVICE_API_KEY must be set and contain at least 16 characters");
  }

  const matchingTimeoutMs = Number(env.MATCHING_TIMEOUT_MS ?? 1000);
  if (!Number.isInteger(matchingTimeoutMs) || matchingTimeoutMs < 1) {
    throw new Error("MATCHING_TIMEOUT_MS must be a positive integer");
  }

  return {
    host: env.HOST ?? "0.0.0.0",
    port,
    nodeEnv: env.NODE_ENV ?? "development",
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    matchingUrl: env.MATCHING_SERVICE_URL ?? "http://localhost:4000",
    matchingTimeoutMs,
    matchingApiKey: env.MATCHING_SERVICE_API_KEY,
  };
}
