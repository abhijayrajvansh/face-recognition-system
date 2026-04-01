import type { NextRequest } from "next/server";
import { handleRouteError, ok, parseOrThrow } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validators";
import { createSession, listSessions } from "@/services/sessions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const sessions = await listSessions();
    return ok({ sessions });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const payload = parseOrThrow(createSessionSchema, await request.json());

    const session = await createSession({
      ...payload,
      createdBy: admin.uid,
    });

    return ok({ session }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
