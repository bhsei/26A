import type { FastifyInstance } from "fastify";
import { NotImplementedApiError } from "../errors.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async () => {
    throw new NotImplementedApiError("Registration is not implemented yet");
  });

  app.post("/auth/login", async () => {
    throw new NotImplementedApiError("Login is not implemented yet");
  });
}
