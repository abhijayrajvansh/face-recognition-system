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
