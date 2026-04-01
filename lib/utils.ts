import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nowIso = () => new Date().toISOString();

export const toSubjectFromCode = (code: string) =>
  code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "-");

export const fileToBuffer = async (file: File): Promise<Buffer> => {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
};
