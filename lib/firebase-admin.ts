import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { env } from "@/lib/env";

let app: App | null = null;

const initApp = (): App => {
  if (app) {
    return app;
  }

  if (getApps().length) {
    app = getApps()[0] ?? null;
    if (app) {
      return app;
    }
  }

  const { projectId, clientEmail, privateKey } = env.firebaseAdmin;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured in environment variables");
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: env.firebaseClient.storageBucket,
  });

  return app;
};

export const getAdminAuth = () => getAuth(initApp());
export const getAdminDb = () => getFirestore(initApp());
export const getAdminStorage = () => getStorage(initApp());
