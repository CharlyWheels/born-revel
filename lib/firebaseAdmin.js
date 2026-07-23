import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Singleton across hot reloads / serverless invocations (same idea as lib/prisma.js).
const globalForAdmin = globalThis;

function buildCredential() {
  // Preferred: full service-account JSON in an env var.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const serviceAccount = JSON.parse(raw);
      // Private keys pasted into env files often have escaped newlines.
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      return cert(serviceAccount);
    } catch (error) {
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${error.message}`);
    }
  }
  // Fallback: GOOGLE_APPLICATION_CREDENTIALS points to a key file.
  return applicationDefault();
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp({ credential: buildCredential() });
}

const adminApp = globalForAdmin.firebaseAdminApp ?? getAdminApp();
if (process.env.NODE_ENV !== 'production') globalForAdmin.firebaseAdminApp = adminApp;

export const adminAuth = getAuth(adminApp);
