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

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      code: "NOT_FOUND",
      message: "The requested route was not found",
    } satisfies ApiErrorBody);
  });
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Request failed");

    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
      } satisfies ApiErrorBody);
    }

    if (error instanceof NotImplementedApiError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
      } satisfies ApiErrorBody);
    }
    if (typeof error === "object" && error !== null &&
        "validation" in error && (error as { validation?: unknown }).validation) {
      return reply.status(400).send({
        code: "BAD_REQUEST",
        message: "The request body or parameters are invalid",
      } satisfies ApiErrorBody);
    }

    return reply.status(500).send({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    } satisfies ApiErrorBody);
  });
}
