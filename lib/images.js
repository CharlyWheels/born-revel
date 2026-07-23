/**
 * Shared inline SVG placeholder shown when a gift image is missing or fails to
 * load. Kept as a data URI so it needs no network request (works on the strict
 * public pages too).
 */
export const GIFT_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ffffff20" width="200" height="200"/%3E%3Ctext fill="%23ffffff60" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🎁%3C/text%3E%3C/svg%3E';
