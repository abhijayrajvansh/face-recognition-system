import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { ApiRouteError } from "@/lib/api";
import { getAdminAuth } from "@/lib/firebase-admin";

export type RequestUser = {
  uid: string;
  email: string;
  isAdmin: boolean;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isAdminEmail = (email: string) => env.adminEmails.includes(normalizeEmail(email));

const parseBearerToken = (request: NextRequest): string | null => {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice("Bearer ".length).trim() || null;
};

export const getRequestUser = async (request: NextRequest): Promise<RequestUser | null> => {
  const bearer = parseBearerToken(request);

  if (bearer) {
    try {
      const token = await getAdminAuth().verifyIdToken(bearer);
      const email = token.email ? normalizeEmail(token.email) : "";
      return {
        uid: token.uid,
        email,
        isAdmin: email ? isAdminEmail(email) : false,
      };
    } catch {
      return null;
    }
  }

  const devEmail = request.headers.get("x-dev-email")?.trim();
  if (env.nodeEnv !== "production" && devEmail) {
    const email = normalizeEmail(devEmail);
    return {
      uid: `dev:${email}`,
      email,
      isAdmin: env.useMockDb ? true : isAdminEmail(email),
    };
  }

  return null;
};

export const requireAdmin = async (request: NextRequest): Promise<RequestUser> => {
  const user = await getRequestUser(request);

  if (!user) {
    throw new ApiRouteError(
      "UNAUTHORIZED",
      "Missing authentication. Use Bearer token or x-dev-email in development.",
      401,
    );
  }

  if (!user.isAdmin) {
    throw new ApiRouteError("FORBIDDEN", "Admin access required", 403);
  }

  return user;
};
