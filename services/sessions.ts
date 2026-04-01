import { getAdminDb } from "@/lib/firebase-admin";
import { nowIso } from "@/lib/utils";
import type { SessionDoc } from "@/types/models";
import { ApiRouteError } from "@/lib/api";
import { env } from "@/lib/env";
import { mockDb } from "@/services/mock-db";

const sessionsCollection = () => getAdminDb().collection("sessions");

export const createSession = async ({
  title,
  date,
  startTime,
  endTime,
  department,
  status,
  createdBy,
}: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  department?: string | null;
  status?: SessionDoc["status"];
  createdBy: string;
}) => {
  if (env.useMockDb) {
    const timestamp = nowIso();
    const payload: SessionDoc = {
      title,
      date,
      startTime,
      endTime,
      department: department ?? null,
      status: status ?? "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy,
    };
    return mockDb.createSession(payload);
  }

  const timestamp = nowIso();
  const payload: SessionDoc = {
    title,
    date,
    startTime,
    endTime,
    department: department ?? null,
    status: status ?? "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy,
  };

  const ref = await sessionsCollection().add(payload);
  return { id: ref.id, ...payload };
};

export const listSessions = async () => {
  if (env.useMockDb) {
    return mockDb.listSessions();
  }

  const snapshot = await sessionsCollection().orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as SessionDoc) }));
};

export const getSessionById = async (id: string) => {
  if (env.useMockDb) {
    const session = mockDb.findSessionById(id);
    if (!session) {
      throw new ApiRouteError("NOT_FOUND", "Session not found", 404);
    }
    return session;
  }

  const doc = await sessionsCollection().doc(id).get();
  if (!doc.exists) {
    throw new ApiRouteError("NOT_FOUND", "Session not found", 404);
  }
  return { id: doc.id, ...(doc.data() as SessionDoc) };
};

export const updateSession = async (id: string, patch: Partial<SessionDoc>) => {
  if (env.useMockDb) {
    const updated = mockDb.updateSession(id, {
      ...patch,
      updatedAt: nowIso(),
    });
    if (!updated) {
      throw new ApiRouteError("NOT_FOUND", "Session not found", 404);
    }
    return updated;
  }

  const ref = sessionsCollection().doc(id);
  const current = await ref.get();
  if (!current.exists) {
    throw new ApiRouteError("NOT_FOUND", "Session not found", 404);
  }

  await ref.update({
    ...patch,
    updatedAt: nowIso(),
  });

  const updated = await ref.get();
  return { id: updated.id, ...(updated.data() as SessionDoc) };
};
