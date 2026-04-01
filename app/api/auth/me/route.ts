import type { NextRequest } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { ok, handleRouteError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
