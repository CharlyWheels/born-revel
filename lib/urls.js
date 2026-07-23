/**
 * Public URL helpers. Prefer NEXT_PUBLIC_BASE_URL so server and client render
 * the same string (no hydration mismatch); fall back to the browser origin.
 */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Full shareable URL for a public baby page, e.g. https://revel.baby/b/my-slug */
export function getPublicBabyUrl(slug) {
  return `${getBaseUrl()}/b/${slug}`;
}

/** Display form without the protocol, e.g. revel.baby/b/my-slug */
export function getPublicBabyDisplay(slug) {
  return `${getBaseUrl().replace(/^https?:\/\//, '')}/b/${slug || ''}`;
}
