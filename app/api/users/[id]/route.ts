import type { NextRequest } from "next/server";
import { handleRouteError, ok, parseOrThrow } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validators";
import { getUserById, updateUser } from "@/services/users";

export const runtime = "nodejs";

type Params = { id: string };

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const user = await getUserById(id);
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const payload = parseOrThrow(updateUserSchema, await request.json());
    const user = await updateUser(id, payload);
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
