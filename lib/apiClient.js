import { auth } from '../firebase';

/**
 * Fetch wrapper that attaches the current user's Firebase ID token as a
 * Bearer Authorization header. Use for every call to an authenticated API route.
 *
 * The server derives the user's identity from this token — never send userId/email
 * in the body or query string.
 */
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Default JSON content-type when sending a string body and none was set.
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(path, { ...options, headers });
}
