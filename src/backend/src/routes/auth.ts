import type { FastifyInstance, FastifyRequest, FastifyPluginOptions } from "fastify";
import type { PrismaClient } from "../../node_modules/.generated/prisma/client.js";
import type { AppConfig } from "../config.js";
import { bearerToken, signUserToken, verifyUserToken, type AuthUser } from "../auth.js";
import { hashPassword, verifyPassword } from "../password.js";
import { ApiError } from "../errors.js";

interface AuthRouteOptions extends FastifyPluginOptions {
  config: AppConfig;
  prisma: PrismaClient;
}

function authUser(user: {
  id: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER";
  displayName: string | null;
  company: { name: string; sector: string } | null;
}): AuthUser & { companyName?: string; companySector?: string } {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    companyName: user.company?.name,
    companySector: user.company?.sector,
  };
}

export async function currentUser(request: FastifyRequest, secret: string, prisma: PrismaClient) {
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
  let payload;
  try {
    payload = await verifyUserToken(secret, token);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "The access token is invalid or expired");
  }
  const revoked = await prisma.revokedToken.findUnique({ where: { jti: payload.jti } });
  if (revoked) {
    throw new ApiError(401, "UNAUTHORIZED", "The access token is invalid or expired");
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { company: true },
  });
  if (!user || user.role !== payload.role) {
    throw new ApiError(401, "UNAUTHORIZED", "The access token is invalid or expired");
  }
  return user;
}

export async function authRoutes(app: FastifyInstance, options: AuthRouteOptions): Promise<void> {
  const { config, prisma } = options;

  app.post("/auth/register", async (request, reply) => {
    const body = request.body as {
      email?: string;
      password?: string;
      role?: string;
      displayName?: string;
      ageConfirmed?: boolean;
      privacyAccepted?: boolean;
      companyName?: string;
      companySector?: string;
    };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !body.password || body.password.length < 8) {
      throw new ApiError(422, "VALIDATION_ERROR", "A valid email and a password of at least 8 characters are required");
    }
    const normalizedRole = body.role?.toUpperCase();
    if (normalizedRole !== "CANDIDATE" && normalizedRole !== "RECRUITER") {
      throw new ApiError(422, "VALIDATION_ERROR", "Role must be candidate or recruiter");
    }
    if (!body.displayName?.trim()) {
      throw new ApiError(422, "VALIDATION_ERROR", "Display name is required");
    }
    if (body.ageConfirmed !== true || body.privacyAccepted !== true) {
      throw new ApiError(422, "VALIDATION_ERROR", "Please confirm the age requirement and accept the privacy notice");
    }
    if (normalizedRole === "RECRUITER" && (!body.companyName?.trim() || !body.companySector?.trim())) {
      throw new ApiError(422, "VALIDATION_ERROR", "Recruiters require a company name and sector");
    }

    const passwordHash = await hashPassword(body.password);
    const now = new Date();
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        let companyId: string | undefined;
        if (normalizedRole === "RECRUITER") {
          const company = await tx.company.create({
            data: { name: body.companyName!.trim(), sector: body.companySector!.trim() },
          });
          companyId = company.id;
        }
        return tx.user.create({
          data: {
            email,
            passwordHash,
            role: normalizedRole,
            displayName: body.displayName?.trim() || null,
            companyId,
            privacyConsentAt: now,
            privacyNoticeVersion: "0.1-draft",
            ageConfirmed: true,
            privacyAccepted: true,
          },
          include: { company: true },
        });
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new ApiError(409, "CONFLICT", "This email cannot be used for registration");
      }
      throw error;
    }

    const token = await signUserToken(config.jwtSecret, authUser(user));
    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      token,
    });
  });

  app.post("/auth/login", async (request) => {
    const body = request.body as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) {
      throw new ApiError(422, "VALIDATION_ERROR", "Email and password are required");
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new ApiError(401, "UNAUTHORIZED", "Email or password is incorrect");
    }
    const token = await signUserToken(config.jwtSecret, authUser(user));
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      token,
    };
  });

  app.get("/auth/me", async (request) => {
    const user = await currentUser(request, config.jwtSecret, prisma);
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    const token = bearerToken(request);
    if (!token) throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
    let payload;
    try {
      payload = await verifyUserToken(config.jwtSecret, token);
    } catch {
      throw new ApiError(401, "UNAUTHORIZED", "The access token is invalid or expired");
    }
    if (payload.exp) {
      await prisma.revokedToken.upsert({
        where: { jti: payload.jti },
        create: { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) },
        update: {},
      });
    }
    return reply.status(204).send();
  });
}
