import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type EnvMap = Record<string, string>;

const parseEnvFile = (filePath: string): EnvMap => {
  const out: EnvMap = {};
  const raw = readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
};

const loadEnv = (): EnvMap => {
  const cwd = process.cwd();
  const files = [".env.local", ".env"];
  const merged: EnvMap = {};

  for (const name of files) {
    const p = resolve(cwd, name);
    if (existsSync(p)) {
      Object.assign(merged, parseEnvFile(p));
    }
  }

  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") merged[k] = v;
  }

  return merged;
};

const assertOk = async (res: Response, context: string) => {
  if (res.ok) return;
  const body = await res.text();
  throw new Error(`${context} failed: ${res.status} ${body}`);
};

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

const todayDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fileBlob = (path: string) => {
  const b = readFileSync(path);
  return new Blob([new Uint8Array(b)], { type: "image/jpeg" });
};

const main = async () => {
  const env = loadEnv();
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const adminEmail = (env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean)[0];

  if (!adminEmail) {
    throw new Error("ADMIN_EMAILS is empty. Set at least one admin email in .env");
  }

  const headers = {
    "x-dev-email": adminEmail,
  };

  const runId = Date.now();
  const userPayload = {
    name: `Smoke User ${runId}`,
    code: `SMK_${runId}`,
    department: "Engineering",
  };

  console.log("1) Creating user...");
  const createUserRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userPayload),
  });
  await assertOk(createUserRes, "Create user");
  const createUserBody = await json<{ data: { user: { id: string; comprefaceSubject: string } } }>(createUserRes);
  const userId = createUserBody.data.user.id;
  console.log(`- userId: ${userId}`);

  console.log("2) Enrolling 3 images...");
  const enrollForm = new FormData();
  enrollForm.append("images", fileBlob("tmp/test-images/face1.jpg"), "face1.jpg");
  enrollForm.append("images", fileBlob("tmp/test-images/face2.jpg"), "face2.jpg");
  enrollForm.append("images", fileBlob("tmp/test-images/face3.jpg"), "face3.jpg");

  const enrollRes = await fetch(`${baseUrl}/api/users/${userId}/enroll`, {
    method: "POST",
    headers,
    body: enrollForm,
  });
  await assertOk(enrollRes, "Enroll user images");
  const enrollBody = await json<{ data: { enrollmentStatus: string; enrollmentImageCount: number } }>(enrollRes);
  console.log(`- enrollmentStatus: ${enrollBody.data.enrollmentStatus}`);
  console.log(`- enrollmentImageCount: ${enrollBody.data.enrollmentImageCount}`);

  console.log("3) Creating session...");
  const createSessionRes = await fetch(`${baseUrl}/api/sessions`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Smoke Session ${runId}`,
      date: todayDate(),
      startTime: "09:00",
      endTime: "18:00",
      department: "Engineering",
      status: "draft",
    }),
  });
  await assertOk(createSessionRes, "Create session");
  const createSessionBody = await json<{ data: { session: { id: string } } }>(createSessionRes);
  const sessionId = createSessionBody.data.session.id;
  console.log(`- sessionId: ${sessionId}`);

  console.log("4) Activating session...");
  const patchSessionRes = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "active" }),
  });
  await assertOk(patchSessionRes, "Activate session");

  console.log("5) Recognize #1 (should mark attendance)...");
  const recognizeForm1 = new FormData();
  recognizeForm1.append("sessionId", sessionId);
  recognizeForm1.append("image", fileBlob("tmp/test-images/face1.jpg"), "face1.jpg");

  const recognizeRes1 = await fetch(`${baseUrl}/api/attendance/recognize`, {
    method: "POST",
    body: recognizeForm1,
  });
  await assertOk(recognizeRes1, "Recognize first image");
  const recognizeBody1 = await json<{ data: { status: string; message: string } }>(recognizeRes1);
  console.log(`- status: ${recognizeBody1.data.status}`);
  console.log(`- message: ${recognizeBody1.data.message}`);

  console.log("6) Recognize #2 same user (should be already_marked)...");
  const recognizeForm2 = new FormData();
  recognizeForm2.append("sessionId", sessionId);
  recognizeForm2.append("image", fileBlob("tmp/test-images/face1.jpg"), "face1.jpg");

  const recognizeRes2 = await fetch(`${baseUrl}/api/attendance/recognize`, {
    method: "POST",
    body: recognizeForm2,
  });
  await assertOk(recognizeRes2, "Recognize duplicate image");
  const recognizeBody2 = await json<{ data: { status: string; message: string } }>(recognizeRes2);
  console.log(`- status: ${recognizeBody2.data.status}`);
  console.log(`- message: ${recognizeBody2.data.message}`);

  console.log("\nPASS: End-to-end flow succeeded.");
  console.log(`User: ${userId}`);
  console.log(`Session: ${sessionId}`);
};

main().catch((error) => {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
});
