const SAFE_PATH_PATTERN = /^[A-Za-z0-9/_\-.]+$/;

/** Strict Supabase auth user id (folder segment only — no slashes). */
const STORAGE_USER_ID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AVATAR_OBJECT_BASENAME = /^avatar\.(jpg|png|gif|webp)$/i;

/**
 * Builds the only allowed avatar object key: `{uuid}/avatar.{ext}`.
 * Use this for `storage.from(...).upload(...)` so paths are never arbitrary strings.
 */
export function buildVerifiedAvatarObjectKey(userId: string, extension: string): string | null {
  if (!STORAGE_USER_ID_SEGMENT.test(userId)) return null;
  const ext = extension === 'jpeg' ? 'jpg' : extension.toLowerCase();
  if (!['jpg', 'png', 'gif', 'webp'].includes(ext)) return null;
  const key = `${userId}/avatar.${ext}`;
  const sanitized = sanitizeStoragePath(key);
  if (sanitized !== key) return null;
  return sanitized;
}

/**
 * Accepts only the same shape as {@link buildVerifiedAvatarObjectKey} for public URL resolution.
 */
export function parseVerifiedAvatarObjectKey(input: string): string | null {
  const s = sanitizeStoragePath(input);
  if (!s) return null;
  const slash = s.indexOf('/');
  if (slash <= 0) return null;
  const uid = s.slice(0, slash);
  const basename = s.slice(slash + 1);
  if (!STORAGE_USER_ID_SEGMENT.test(uid)) return null;
  if (!AVATAR_OBJECT_BASENAME.test(basename)) return null;
  return s;
}

/**
 * Normalize and validate storage object paths to avoid traversal/injection.
 */
export function sanitizeStoragePath(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Normalize separators and collapse duplicate slashes.
  const normalized = raw.replaceAll('\\', '/').replaceAll(/\/+/g, '/');

  // Reject absolute/relative traversal patterns and URLs.
  if (normalized.startsWith('/') || normalized.includes('..') || normalized.includes('://')) return null;
  if (!SAFE_PATH_PATTERN.test(normalized)) return null;

  return normalized;
}

