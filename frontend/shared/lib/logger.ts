type LogLevel = 'error' | 'warn';

/**
 * Centralized error logger.
 * In production we keep logs silent to avoid noisy browser consoles.
 */
export function logError(message: string, error?: unknown, options?: { level?: LogLevel; meta?: unknown }) {
  if (import.meta.env.PROD) return;
  const level: LogLevel = options?.level ?? 'error';
  const payload = options?.meta === undefined ? error : { error, meta: options.meta };
  if (level === 'warn') {
    console.warn(message, payload);
    return;
  }
  console.error(message, payload);
}
