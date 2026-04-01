import type { NextRequest } from "next/server";
import { handleRouteError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listSessionAttendance } from "@/services/attendance";
import { getSessionById } from "@/services/sessions";

export const runtime = "nodejs";

type Params = { id: string };

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const session = await getSessionById(id);
    const rows = await listSessionAttendance(id);

    return ok({
      session,
      summary: {
        totalMarked: rows.length,
      },
      rows,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
