import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "backend",
  }));

  app.get("/ready", async (_request, reply) =>
    reply.send({
      status: "ready",
      database: "up",
    }),
  );
}
