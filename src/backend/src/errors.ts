import type { FastifyInstance } from "fastify";

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class NotImplementedApiError extends Error {
  readonly statusCode = 501;
  readonly code = "NOT_IMPLEMENTED";

  constructor(message: string) {
    super(message);
    this.name = "NotImplementedApiError";
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Request failed");

    if (error instanceof NotImplementedApiError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
      } satisfies ApiErrorBody);
    }

    return reply.status(500).send({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    } satisfies ApiErrorBody);
  });
}
