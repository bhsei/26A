import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("backend foundation", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("serves health with a request ID", async () => {
    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      service: "backend",
    });
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("propagates a supplied request ID", async () => {
    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-request-id": "client-request-42" },
    });

    expect(response.headers["x-request-id"]).toBe("client-request-42");
  });

  it("rejects malformed authentication requests", async () => {
    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {},
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({
      code: "VALIDATION_ERROR",
      message: "Email and password are required",
    });
  });
});
