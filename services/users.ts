import { getAdminDb } from "@/lib/firebase-admin";
import { nowIso, toSubjectFromCode } from "@/lib/utils";
import type { UserDoc } from "@/types/models";
import { ApiRouteError } from "@/lib/api";
import { env } from "@/lib/env";
import { mockDb } from "@/services/mock-db";

const usersCollection = () => getAdminDb().collection("users");
type AppUser = { id: string } & UserDoc;

const isMvpUserDoc = (value: unknown): value is UserDoc => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.name === "string" &&
    typeof row.code === "string" &&
    typeof row.department === "string" &&
    typeof row.status === "string" &&
    typeof row.comprefaceSubject === "string" &&
    typeof row.enrollmentStatus === "string" &&
    typeof row.enrollmentImageCount === "number" &&
    typeof row.createdAt === "string" &&
    typeof row.updatedAt === "string" &&
    typeof row.createdBy === "string"
  );
};

export const createUser = async ({
  name,
  code,
  department,
  createdBy,
}: {
  name: string;
  code: string;
  department: string;
  createdBy: string;
}) => {
  if (env.useMockDb) {
    const duplicate = mockDb.findUserByCode(code);
    if (duplicate) {
      throw new ApiRouteError("VALIDATION_ERROR", "User code already exists", 400);
    }

    const timestamp = nowIso();
    const payload: UserDoc = {
      name,
      code,
      department,
      status: "active",
      comprefaceSubject: toSubjectFromCode(code),
      enrollmentStatus: "pending",
      enrollmentImageCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy,
    };

    return mockDb.createUser(payload);
  }

  const existing = await usersCollection().where("code", "==", code).limit(1).get();
  if (!existing.empty) {
    throw new ApiRouteError("VALIDATION_ERROR", "User code already exists", 400);
  }

  const timestamp = nowIso();
  const payload: UserDoc = {
    name,
    code,
    department,
    status: "active",
    comprefaceSubject: toSubjectFromCode(code),
    enrollmentStatus: "pending",
    enrollmentImageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy,
  };

  const ref = await usersCollection().add(payload);
  return { id: ref.id, ...payload };
};

export const listUsers = async () => {
  if (env.useMockDb) {
    return mockDb.listUsers();
  }

  const snapshot = await usersCollection().orderBy("createdAt", "desc").get();
  const rows: AppUser[] = snapshot.docs
    .map((doc) => ({ id: doc.id, raw: doc.data() }))
    .filter((entry) => isMvpUserDoc(entry.raw))
    .map((entry) => ({ id: entry.id, ...(entry.raw as UserDoc) }));

  return rows;
};

export const getUserById = async (id: string) => {
  if (env.useMockDb) {
    const user = mockDb.findUserById(id);
    if (!user) {
      throw new ApiRouteError("NOT_FOUND", "User not found", 404);
    }
    return user;
  }

  const doc = await usersCollection().doc(id).get();
  if (!doc.exists || !isMvpUserDoc(doc.data())) {
    throw new ApiRouteError("NOT_FOUND", "User not found", 404);
  }
  return { id: doc.id, ...(doc.data() as UserDoc) };
};

export const getUserBySubject = async (subject: string) => {
  const normalized = toSubjectFromCode(subject);

  if (env.useMockDb) {
    return mockDb.findUserBySubject(normalized) ?? mockDb.findUserBySubject(subject);
  }

  const lookups = normalized === subject ? [subject] : [normalized, subject];

  for (const key of lookups) {
    const snapshot = await usersCollection().where("comprefaceSubject", "==", key).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      if (isMvpUserDoc(doc.data())) {
        return { id: doc.id, ...(doc.data() as UserDoc) };
      }
    }
  }

  return null;
};

export const updateUser = async (
  id: string,
  input: Partial<Pick<UserDoc, "name" | "code" | "department" | "status">>,
) => {
  if (env.useMockDb) {
    const current = mockDb.findUserById(id);
    if (!current) {
      throw new ApiRouteError("NOT_FOUND", "User not found", 404);
    }

    if (input.code) {
      const duplicate = mockDb.findUserByCode(input.code);
      if (duplicate && duplicate.id !== id) {
        throw new ApiRouteError("VALIDATION_ERROR", "User code already exists", 400);
      }
    }

    const patch: Partial<UserDoc> = {
      ...input,
      updatedAt: nowIso(),
    };
    if (input.code) {
      patch.comprefaceSubject = toSubjectFromCode(input.code);
    }

    const updated = mockDb.updateUser(id, patch);
    if (!updated) {
      throw new ApiRouteError("NOT_FOUND", "User not found", 404);
    }
    return updated;
  }

  const ref = usersCollection().doc(id);
  const current = await ref.get();

  if (!current.exists) {
    throw new ApiRouteError("NOT_FOUND", "User not found", 404);
  }

  if (input.code) {
    const duplicate = await usersCollection().where("code", "==", input.code).limit(1).get();
    if (!duplicate.empty && duplicate.docs[0]?.id !== id) {
      throw new ApiRouteError("VALIDATION_ERROR", "User code already exists", 400);
    }
  }

  const patch: Partial<UserDoc> = {
    ...input,
    updatedAt: nowIso(),
  };

  if (input.code) {
    patch.comprefaceSubject = toSubjectFromCode(input.code);
  }

  await ref.update(patch);
  const updated = await ref.get();
  if (!isMvpUserDoc(updated.data())) {
    throw new ApiRouteError("NOT_FOUND", "User not found", 404);
  }
  return { id: updated.id, ...(updated.data() as UserDoc) };
};

export const updateEnrollmentStatus = async (
  userId: string,
  imageCount: number,
  enrollmentStatus: UserDoc["enrollmentStatus"],
) => {
  if (env.useMockDb) {
    const updated = mockDb.updateUser(userId, {
      enrollmentImageCount: imageCount,
      enrollmentStatus,
      updatedAt: nowIso(),
    });
    if (!updated) {
      throw new ApiRouteError("NOT_FOUND", "User not found", 404);
    }
    return;
  }

  const ref = usersCollection().doc(userId);
  await ref.update({
    enrollmentImageCount: imageCount,
    enrollmentStatus,
    updatedAt: nowIso(),
  });
};

export const deleteUserById = async (id: string) => {
  if (env.useMockDb) {
    const deleted = mockDb.deleteUser(id);
    if (!deleted) {
      throw new ApiRouteError("NOT_FOUND", "User not found", 404);
    }
    return;
  }

  const ref = usersCollection().doc(id);
  const current = await ref.get();
  if (!current.exists || !isMvpUserDoc(current.data())) {
    throw new ApiRouteError("NOT_FOUND", "User not found", 404);
  }

  const enrollmentSnapshot = await ref.collection("enrollmentImages").get();
  await Promise.all(enrollmentSnapshot.docs.map((doc) => doc.ref.delete()));
  await ref.delete();
};
