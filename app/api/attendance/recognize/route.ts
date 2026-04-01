import type { NextRequest } from "next/server";
import { ApiRouteError, handleRouteError, ok, parseOrThrow } from "@/lib/api";
import { env } from "@/lib/env";
import { recognizeFileRules, recognizeSessionSchema } from "@/lib/validators";
import { fileToBuffer } from "@/lib/utils";
import { markAttendanceOnce } from "@/services/attendance";
import { recognizeFace } from "@/services/compreface";
import { getSessionById } from "@/services/sessions";
import { getUserBySubject } from "@/services/users";

export const runtime = "nodejs";

const resolveImage = (formData: FormData): File => {
  const image = formData.get("image");
  if (!(image instanceof File)) {
    throw new ApiRouteError("VALIDATION_ERROR", "Missing image", 400);
  }

  if (!recognizeFileRules.allowedTypes.includes(image.type)) {
    throw new ApiRouteError("VALIDATION_ERROR", `Unsupported image type: ${image.type}`, 400);
  }

  if (image.size > recognizeFileRules.maxBytes) {
    throw new ApiRouteError("VALIDATION_ERROR", "Image exceeds maximum size", 400);
  }

  return image;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload = parseOrThrow(recognizeSessionSchema, {
      sessionId: formData.get("sessionId"),
    });

    const image = resolveImage(formData);
    const session = await getSessionById(payload.sessionId);

    if (session.status !== "active") {
      throw new ApiRouteError("SESSION_CLOSED", "Session is not active", 400);
    }

    const buffer = await fileToBuffer(image);
    const result = await recognizeFace(buffer, image.name || "capture.jpg");
    const best = result.bestMatch;

    if (!best) {
      throw new ApiRouteError("NO_MATCH", "No recognized face match", 404);
    }

    if (best.similarity < env.compreface.similarityThreshold) {
      throw new ApiRouteError(
        "LOW_CONFIDENCE",
        `Confidence ${best.similarity.toFixed(3)} below threshold ${env.compreface.similarityThreshold.toFixed(3)}`,
        400,
        { similarity: best.similarity },
      );
    }

    const user = await getUserBySubject(best.subject);
    if (!user) {
      throw new ApiRouteError("NOT_FOUND", "Matched subject is not linked to a user", 404);
    }

    if (user.status !== "active") {
      throw new ApiRouteError("USER_INACTIVE", "Matched user is inactive", 400);
    }

    if (user.enrollmentImageCount < 3) {
      throw new ApiRouteError("VALIDATION_ERROR", "User is not fully enrolled", 400);
    }

    const attendance = await markAttendanceOnce({
      sessionId: payload.sessionId,
      user: {
        id: user.id,
        name: user.name,
        code: user.code,
        department: user.department,
      },
      confidence: best.similarity,
      recognizedSubject: best.subject,
    });

    if (attendance.alreadyMarked) {
      return ok({
        status: "already_marked",
        message: "Attendance already marked for this session",
        record: attendance.record,
      });
    }

    return ok({
      status: "success",
      message: "Attendance marked",
      record: attendance.record,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
