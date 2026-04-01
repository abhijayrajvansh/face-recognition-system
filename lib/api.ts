import { z } from "zod";
import type { ErrorCode } from "@/types/api";

export class ApiRouteError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const ok = <T>(data: T, status = 200) =>
  Response.json(
    {
      ok: true,
      data,
    },
    { status },
  );

export const fail = (code: ErrorCode, message: string, status: number, details?: unknown) =>
  Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );

export const parseOrThrow = <T>(schema: z.ZodSchema<T>, input: unknown): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiRouteError("VALIDATION_ERROR", "Invalid request payload", 400, parsed.error.flatten());
  }
  return parsed.data;
};

export const handleRouteError = (error: unknown) => {
  if (error instanceof ApiRouteError) {
    return fail(error.code, error.message, error.status, error.details);
  }

  if (error instanceof Error) {
    return fail("INTERNAL_ERROR", error.message, 500);
  }

  return fail("INTERNAL_ERROR", "Unknown server error", 500);
};
