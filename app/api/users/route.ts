import type { NextRequest } from "next/server";
import { handleRouteError, ok, parseOrThrow } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createUserSchema } from "@/lib/validators";
import { createUser, listUsers } from "@/services/users";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const users = await listUsers();
    return ok({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const payload = parseOrThrow(createUserSchema, await request.json());

    const user = await createUser({
      ...payload,
      createdBy: admin.uid,
    });

    return ok({ user }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
