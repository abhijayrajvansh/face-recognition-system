import type { NextRequest } from "next/server";
import { handleRouteError, ok, parseOrThrow } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { updateSessionSchema } from "@/lib/validators";
import { getSessionById, updateSession } from "@/services/sessions";

export const runtime = "nodejs";

type Params = { id: string };

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const session = await getSessionById(id);
    return ok({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const payload = parseOrThrow(updateSessionSchema, await request.json());
    const session = await updateSession(id, payload);
    return ok({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
