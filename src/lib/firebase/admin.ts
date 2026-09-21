import {
  cert,
  getApps,
  initializeApp,
  type App,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function initAdmin(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey && projectId) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
    return initializeApp({
      credential: applicationDefault(),
      projectId: projectId || undefined,
    });
  }

  return initializeApp({ projectId: projectId || "hukan-seo-auditor-dev" });
}

export function getAdminApp(): App {
  return initAdmin();
}

export function getAdminAuth(): Auth {
  return getAuth(initAdmin());
}

export function getAdminDb(): Firestore {
  return getFirestore(initAdmin());
}
