import { z } from "zod";

const codeRegex = /^[A-Za-z0-9_-]+$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().regex(codeRegex),
  department: z.string().trim().min(1).max(100),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().regex(codeRegex).optional(),
    department: z.string().trim().min(1).max(100).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().regex(dateRegex),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  department: z.string().trim().max(100).nullable().optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

export const updateSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    date: z.string().regex(dateRegex).optional(),
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    department: z.string().trim().max(100).nullable().optional(),
    status: z.enum(["draft", "active", "closed"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const enrollFileRules = {
  maxCount: 5,
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
};

export const recognizeFileRules = {
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
};

export const recognizeSessionSchema = z.object({
  sessionId: z.string().trim().min(1),
});
