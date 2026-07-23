import { adminAuth } from './firebaseAdmin';
import prisma from './prisma';

/**
 * Verify the Firebase ID token from the Authorization header.
 * Returns { uid, email } or null if missing/invalid.
 */
export async function getUidFromRequest(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    return { uid: decoded.uid, email: decoded.email || null };
  } catch (error) {
    console.error('ID token verification failed:', error.message);
    return null;
  }
}

/**
 * Require an authenticated user. Responds 401 and returns null when unauthenticated.
 * On success returns { uid, email }.
 */
export async function requireAuth(req, res) {
  const auth = await getUidFromRequest(req);
  if (!auth) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return auth;
}

/**
 * Check whether a user owns a baby. Returns the role string ('primary' | 'co-owner')
 * or null when the user is not an owner.
 */
export async function getOwnerRole(babyId, uid) {
  if (!babyId || !uid) return null;
  const owner = await prisma.babyOwner.findUnique({
    where: { userId_babyId: { userId: uid, babyId } },
  });
  return owner?.role ?? null;
}

/**
 * Require the authenticated user to be an owner of the baby.
 * Responds 401/403 as appropriate and returns null; otherwise returns { uid, email, role }.
 */
export async function requireOwner(req, res, babyId) {
  const auth = await requireAuth(req, res);
  if (!auth) return null;

  const role = await getOwnerRole(babyId, auth.uid);
  if (!role) {
    res.status(403).json({ error: 'You do not have access to this baby' });
    return null;
  }
  return { ...auth, role };
}
