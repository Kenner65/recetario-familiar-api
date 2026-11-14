import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Singleton del Admin SDK. Inicializa una sola vez y convierte los `\n`
 * literales de `FIREBASE_PRIVATE_KEY` (así se pegan en Vercel) en saltos reales.
 */

let app: App | null = null;

function obtenerCredencial() {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      "Faltan variables de entorno de Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
    );
  }
  return cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  });
}

function adminApp(): App {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp({ credential: obtenerCredencial() });
  }
  return app;
}

export function authAdmin(): Auth {
  return getAuth(adminApp());
}

export function firestore(): Firestore {
  return getFirestore(adminApp());
}
