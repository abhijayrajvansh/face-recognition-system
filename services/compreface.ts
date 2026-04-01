import { env, requireComprefaceConfig } from "@/lib/env";
import { ApiRouteError } from "@/lib/api";
import type { FaceMatch, RecognizeResult } from "@/types/models";

const getApiRoot = () => {
  const base = env.compreface.baseUrl.replace(/\/$/, "");
  const serviceId = env.compreface.serviceId.trim();
  return serviceId ? `${base}/api/v1/recognition/${serviceId}` : `${base}/api/v1/recognition`;
};

const comprefaceHeaders = () => {
  requireComprefaceConfig();
  return {
    "x-api-key": env.compreface.apiKey,
  };
};

const parseMatches = (payload: unknown): FaceMatch[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const result = (payload as { result?: unknown[] }).result;
  if (!Array.isArray(result) || result.length === 0) {
    return [];
  }

  const first = result[0] as { box?: FaceMatch["box"]; subjects?: unknown[] };
  const subjects = Array.isArray(first.subjects) ? first.subjects : [];

  const matches: FaceMatch[] = [];
  for (const subject of subjects) {
    const candidate = subject as { subject?: string; similarity?: number };
    if (!candidate.subject || typeof candidate.similarity !== "number") {
      continue;
    }

    matches.push({
      subject: candidate.subject,
      similarity: candidate.similarity,
      box: first.box,
    });
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
};

export const createOrEnsureSubject = async (subject: string): Promise<void> => {
  if (env.useMockFaceEngine) {
    return;
  }

  const url = `${getApiRoot()}/subjects`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...comprefaceHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subject }),
  });

  if (!response.ok && response.status !== 409) {
    const text = await response.text();
    throw new ApiRouteError("INTEGRATION_ERROR", `CompreFace subject error: ${text}`, 502);
  }
};

export const uploadImageToSubject = async (subject: string, file: Buffer, filename: string): Promise<void> => {
  if (env.useMockFaceEngine) {
    return;
  }

  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(file)]), filename);
  form.set("subject", subject);

  const response = await fetch(`${getApiRoot()}/faces`, {
    method: "POST",
    headers: {
      ...comprefaceHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiRouteError("INTEGRATION_ERROR", `CompreFace upload error: ${text}`, 502);
  }
};

export const recognizeFace = async (file: Buffer, filename: string): Promise<RecognizeResult> => {
  if (env.useMockFaceEngine) {
    const mocked: FaceMatch = {
      subject: "EMP001",
      similarity: 0.97,
    };
    return {
      matches: [mocked],
      bestMatch: mocked,
    };
  }

  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(file)]), filename);

  const response = await fetch(`${getApiRoot()}/recognize`, {
    method: "POST",
    headers: {
      ...comprefaceHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiRouteError("INTEGRATION_ERROR", `CompreFace recognize error: ${text}`, 502);
  }

  const payload = (await response.json()) as unknown;
  const matches = parseMatches(payload);

  return {
    matches,
    bestMatch: matches[0] ?? null,
  };
};
