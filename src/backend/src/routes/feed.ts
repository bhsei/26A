import type { FastifyInstance } from "fastify";
import { NotImplementedApiError } from "../errors.js";

export async function feedRoutes(app: FastifyInstance): Promise<void> {
  app.get("/candidates/me/feed", async () => {
    throw new NotImplementedApiError("Candidate feed is not implemented yet");
  });

  app.post("/candidates/me/swipes", async () => {
    throw new NotImplementedApiError("Swipe persistence is not implemented yet");
  });
}
