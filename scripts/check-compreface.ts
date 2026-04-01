import { existsSync, readFileSync } from "node:fs";
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

const safe = (value: string) => {
  if (!value) return "<empty>";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const toJson = async (res: Response) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const main = async () => {
  const env = loadEnv();
  const baseUrl = (env.COMPREFACE_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
  const apiKey = env.COMPREFACE_API_KEY ?? "";
  const serviceId = (env.COMPREFACE_RECOGNITION_SERVICE_ID ?? "").trim();

  if (!apiKey) {
    console.error("COMPREFACE_API_KEY is missing. Set it in .env or .env.local.");
    process.exit(1);
  }

  const root = serviceId ? `${baseUrl}/api/v1/recognition/${serviceId}` : `${baseUrl}/api/v1/recognition`;

  console.log("CompreFace config");
  console.log(`- baseUrl: ${baseUrl}`);
  console.log(`- serviceId: ${serviceId || "<empty> (using default /recognition path)"}`);
  console.log(`- apiKey: ${safe(apiKey)}`);
  console.log(`- root: ${root}`);

  const headers = { "x-api-key": apiKey };

  console.log("\n[1/2] GET /subjects");
  const getRes = await fetch(`${root}/subjects`, { headers });
  const getBody = await toJson(getRes);
  console.log(`- status: ${getRes.status}`);
  console.log("- body:", getBody);

  const probeSubject = `healthcheck-${Date.now()}`;
  console.log("\n[2/2] POST /subjects");
  const postRes = await fetch(`${root}/subjects`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subject: probeSubject }),
  });
  const postBody = await toJson(postRes);
  console.log(`- status: ${postRes.status}`);
  console.log("- body:", postBody);

  if (postRes.ok || postRes.status === 409) {
    console.log("\nPASS: CompreFace recognition API is reachable and key/path look valid.");
    process.exit(0);
  }

  console.error("\nFAIL: CompreFace API check failed. Verify base URL, API key, and optional service ID.");
  process.exit(1);
};

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
