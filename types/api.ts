export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SESSION_CLOSED"
  | "USER_INACTIVE"
  | "NO_FACE_DETECTED"
  | "NO_MATCH"
  | "LOW_CONFIDENCE"
  | "ALREADY_MARKED"
  | "INTEGRATION_ERROR"
  | "INTERNAL_ERROR";
