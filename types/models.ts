export type UserStatus = "active" | "inactive";
export type EnrollmentStatus = "pending" | "partial" | "complete" | "failed";

export type UserDoc = {
  name: string;
  code: string;
  department: string;
  status: UserStatus;
  comprefaceSubject: string;
  enrollmentStatus: EnrollmentStatus;
  enrollmentImageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type SessionStatus = "draft" | "active" | "closed";

export type SessionDoc = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  department: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type AttendanceDoc = {
  userId: string;
  userName: string;
  userCode: string;
  department: string;
  markedAt: string;
  method: "face";
  confidence: number;
  snapshotUrl: string | null;
  recognizedSubject: string;
};

export type FaceMatch = {
  subject: string;
  similarity: number;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type RecognizeResult = {
  matches: FaceMatch[];
  bestMatch: FaceMatch | null;
};
