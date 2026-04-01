import { getAdminDb } from "@/lib/firebase-admin";
import { nowIso } from "@/lib/utils";
import type { AttendanceDoc } from "@/types/models";
import { env } from "@/lib/env";
import { mockDb } from "@/services/mock-db";

const attendanceCollection = (sessionId: string) =>
  getAdminDb().collection("sessions").doc(sessionId).collection("attendance");

export const markAttendanceOnce = async ({
  sessionId,
  user,
  confidence,
  recognizedSubject,
}: {
  sessionId: string;
  user: {
    id: string;
    name: string;
    code: string;
    department: string;
  };
  confidence: number;
  recognizedSubject: string;
}) => {
  if (env.useMockDb) {
    const record: AttendanceDoc = {
      userId: user.id,
      userName: user.name,
      userCode: user.code,
      department: user.department,
      markedAt: nowIso(),
      method: "face",
      confidence,
      snapshotUrl: null,
      recognizedSubject,
    };
    return mockDb.markAttendanceOnce(sessionId, user.id, record);
  }

  const db = getAdminDb();
  const ref = attendanceCollection(sessionId).doc(user.id);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      return {
        alreadyMarked: true,
        record: existing.data() as AttendanceDoc,
      };
    }

    const record: AttendanceDoc = {
      userId: user.id,
      userName: user.name,
      userCode: user.code,
      department: user.department,
      markedAt: nowIso(),
      method: "face",
      confidence,
      snapshotUrl: null,
      recognizedSubject,
    };

    tx.set(ref, record);
    return {
      alreadyMarked: false,
      record,
    };
  });
};

export const listSessionAttendance = async (sessionId: string) => {
  if (env.useMockDb) {
    return mockDb.listAttendance(sessionId);
  }

  const snapshot = await attendanceCollection(sessionId).orderBy("markedAt", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as AttendanceDoc) }));
};
