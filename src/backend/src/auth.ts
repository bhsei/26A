import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import type { FastifyRequest } from "fastify";

export interface AuthUser {
  id: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER";
  displayName?: string | null;
  companyName?: string | null;
  companySector?: string | null;
}

export async function signUserToken(secret: string, user: AuthUser): Promise<string> {
  const jti = randomUUID();
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .setJti(jti)
    .sign(new TextEncoder().encode(secret));
}

export async function verifyUserToken(secret: string, token: string): Promise<AuthUserPayload> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  if (typeof payload.sub !== "string" ||
      typeof payload.jti !== "string" ||
      (payload.role !== "CANDIDATE" && payload.role !== "RECRUITER")) {
    throw new Error("Invalid token payload");
  }
  return { id: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
}

export interface AuthUserPayload {
  id: string;
  role: "CANDIDATE" | "RECRUITER";
  jti: string;
  exp?: number;
}

export function bearerToken(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}
