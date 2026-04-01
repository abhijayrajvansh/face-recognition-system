import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { env } from "@/lib/env";

const firebaseConfig: FirebaseOptions = {
  apiKey: env.firebaseClient.apiKey,
  authDomain: env.firebaseClient.authDomain,
  projectId: env.firebaseClient.projectId,
  storageBucket: env.firebaseClient.storageBucket,
  messagingSenderId: env.firebaseClient.messagingSenderId,
  appId: env.firebaseClient.appId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseClientApp = app;
export const firebaseAuth = getAuth(app);
export const firebaseDb = getFirestore(app);
export const firebaseStorage = getStorage(app);
