import type { NextRequest } from "next/server";
import { ApiRouteError, handleRouteError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { enrollFileRules } from "@/lib/validators";
import { fileToBuffer, nowIso } from "@/lib/utils";
import { createOrEnsureSubject, uploadImageToSubject } from "@/services/compreface";
import { mockDb } from "@/services/mock-db";
import { uploadBufferToStorage } from "@/services/storage";
import { getUserById, updateEnrollmentStatus } from "@/services/users";

export const runtime = "nodejs";

type Params = { id: string };

const validateFiles = (files: File[]) => {
  if (files.length < 1 || files.length > enrollFileRules.maxCount) {
    throw new ApiRouteError(
      "VALIDATION_ERROR",
      `Upload between 1 and ${enrollFileRules.maxCount} images`,
      400,
    );
  }

  for (const file of files) {
    if (!enrollFileRules.allowedTypes.includes(file.type)) {
      throw new ApiRouteError("VALIDATION_ERROR", `Unsupported image type: ${file.type}`, 400);
    }
    if (file.size > enrollFileRules.maxBytes) {
      throw new ApiRouteError("VALIDATION_ERROR", `Image too large: ${file.name}`, 400);
    }
  }
};

export async function POST(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const user = await getUserById(id);

    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0);

    validateFiles(files);

    await createOrEnsureSubject(user.comprefaceSubject);

    for (const file of files) {
      const buffer = await fileToBuffer(file);
      const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const storagePath = `enrollment/${id}/${uniqueName}`;
      const uploaded = env.useMockDb
        ? {
            storagePath,
            downloadURL: `mock://${storagePath}`,
          }
        : await uploadBufferToStorage({
            buffer,
            path: storagePath,
            contentType: file.type,
          });

      await uploadImageToSubject(user.comprefaceSubject, buffer, file.name);

      const row = {
        storagePath: uploaded.storagePath,
        downloadURL: uploaded.downloadURL,
        uploadedAt: nowIso(),
        uploadedBy: admin.uid,
      };

      if (env.useMockDb) {
        mockDb.addEnrollmentImage(id, row);
      } else {
        const db = getAdminDb();
        await db.collection("users").doc(id).collection("enrollmentImages").add(row);
      }
    }

    const enrollmentImageCount = env.useMockDb
      ? mockDb.countEnrollmentImages(id)
      : (await getAdminDb().collection("users").doc(id).collection("enrollmentImages").get()).size;
    const enrollmentStatus = enrollmentImageCount >= 3 ? "complete" : "partial";

    await updateEnrollmentStatus(id, enrollmentImageCount, enrollmentStatus);

    return ok({
      userId: id,
      subject: user.comprefaceSubject,
      uploadedCount: files.length,
      enrollmentImageCount,
      enrollmentStatus,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
