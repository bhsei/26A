import Fastify from "fastify";
import { registerErrorHandler } from "./errors.js";
import { registerRequestId } from "./request-id.js";
import { authRoutes } from "./routes/auth.js";
import { feedRoutes } from "./routes/feed.js";
import { healthRoutes } from "./routes/health.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
  });

  registerRequestId(app);
  registerErrorHandler(app);
  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(feedRoutes);

  return app;
}
