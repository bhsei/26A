import "dotenv/config";

export interface AppConfig {
  host: string;
  port: number;
  nodeEnv: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  return {
    host: env.HOST ?? "0.0.0.0",
    port,
    nodeEnv: env.NODE_ENV ?? "development",
  };
}
