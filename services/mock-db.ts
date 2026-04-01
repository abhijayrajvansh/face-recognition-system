import type { AttendanceDoc, SessionDoc, UserDoc } from "@/types/models";

export type MockUser = { id: string } & UserDoc;
export type MockSession = { id: string } & SessionDoc;
export type MockAttendanceRow = { id: string } & AttendanceDoc;
export type MockEnrollmentImage = {
  id: string;
  storagePath: string;
  downloadURL: string;
  uploadedAt: string;
  uploadedBy: string;
};

type MockStore = {
  users: Map<string, MockUser>;
  sessions: Map<string, MockSession>;
  attendanceBySession: Map<string, Map<string, AttendanceDoc>>;
  enrollmentByUser: Map<string, MockEnrollmentImage[]>;
};

const storeSymbol = "__face_mvp_mock_store__";

const getStore = (): MockStore => {
  const scope = globalThis as typeof globalThis & { [storeSymbol]?: MockStore };
  if (!scope[storeSymbol]) {
    scope[storeSymbol] = {
      users: new Map(),
      sessions: new Map(),
      attendanceBySession: new Map(),
      enrollmentByUser: new Map(),
    };
  }
  return scope[storeSymbol] as MockStore;
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const mockDb = {
  createUser(payload: UserDoc) {
    const id = makeId();
    const user: MockUser = { id, ...payload };
    getStore().users.set(id, user);
    return user;
  },
  listUsers() {
    return Array.from(getStore().users.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  findUserById(id: string) {
    return getStore().users.get(id) ?? null;
  },
  findUserByCode(code: string) {
    return Array.from(getStore().users.values()).find((user) => user.code === code) ?? null;
  },
  findUserBySubject(subject: string) {
    return Array.from(getStore().users.values()).find((user) => user.comprefaceSubject === subject) ?? null;
  },
  updateUser(id: string, patch: Partial<UserDoc>) {
    const current = getStore().users.get(id);
    if (!current) {
      return null;
    }
    const updated: MockUser = { ...current, ...patch, id };
    getStore().users.set(id, updated);
    return updated;
  },
  createSession(payload: SessionDoc) {
    const id = makeId();
    const session: MockSession = { id, ...payload };
    getStore().sessions.set(id, session);
    return session;
  },
  listSessions() {
    return Array.from(getStore().sessions.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  findSessionById(id: string) {
    return getStore().sessions.get(id) ?? null;
  },
  updateSession(id: string, patch: Partial<SessionDoc>) {
    const current = getStore().sessions.get(id);
    if (!current) {
      return null;
    }
    const updated: MockSession = { ...current, ...patch, id };
    getStore().sessions.set(id, updated);
    return updated;
  },
  addEnrollmentImage(userId: string, row: Omit<MockEnrollmentImage, "id">) {
    const list = getStore().enrollmentByUser.get(userId) ?? [];
    const entry: MockEnrollmentImage = { id: makeId(), ...row };
    list.push(entry);
    getStore().enrollmentByUser.set(userId, list);
    return entry;
  },
  countEnrollmentImages(userId: string) {
    return (getStore().enrollmentByUser.get(userId) ?? []).length;
  },
  markAttendanceOnce(sessionId: string, userId: string, record: AttendanceDoc) {
    const bySession = getStore().attendanceBySession.get(sessionId) ?? new Map<string, AttendanceDoc>();
    getStore().attendanceBySession.set(sessionId, bySession);

    const existing = bySession.get(userId);
    if (existing) {
      return {
        alreadyMarked: true,
        record: existing,
      };
    }

    bySession.set(userId, record);
    return {
      alreadyMarked: false,
      record,
    };
  },
  listAttendance(sessionId: string) {
    const bySession = getStore().attendanceBySession.get(sessionId) ?? new Map<string, AttendanceDoc>();
    return Array.from(bySession.entries())
      .map(([id, row]) => ({ id, ...row }))
      .sort((a, b) => a.markedAt.localeCompare(b.markedAt));
  },
};
