import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

const REQUEST_ID_HEADER = "x-request-id";

export function registerRequestId(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const requestId = request.headers[REQUEST_ID_HEADER];
    const normalizedRequestId =
      typeof requestId === "string" && requestId.length > 0
        ? requestId.slice(0, 128)
        : randomUUID();

    request.id = normalizedRequestId;
    reply.header("X-Request-ID", normalizedRequestId);
  });
}
