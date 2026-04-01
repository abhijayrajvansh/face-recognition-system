const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  useMockFaceEngine: process.env.USE_MOCK_FACE_ENGINE === "true",
  useMockDb: process.env.USE_MOCK_DB === "true",
  compreface: {
    baseUrl: process.env.COMPREFACE_BASE_URL ?? "http://localhost:8000",
    apiKey: process.env.COMPREFACE_API_KEY ?? "",
    serviceId: process.env.COMPREFACE_RECOGNITION_SERVICE_ID ?? "",
    similarityThreshold: Number(process.env.COMPREFACE_SIMILARITY_THRESHOLD ?? "0.95"),
  },
  firebaseClient: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  firebaseAdmin: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
};

export const requireComprefaceConfig = () => {
  required("COMPREFACE_BASE_URL");
  required("COMPREFACE_API_KEY");
};
