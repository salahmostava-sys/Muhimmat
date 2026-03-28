import { useCallback } from 'react';
import { toast } from '@shared/components/ui/sonner';
import { TOAST_ERROR_GENERIC } from '@shared/lib/toastMessages';
import { ServiceError } from '@services/serviceError';
import { getErrorMessage } from '@shared/lib/query';

function unwrapCause(err: unknown): unknown {
  if (err instanceof ServiceError && err.cause != null) return err.cause;
  return err;
}

/** True for typical browser / fetch network failures (offline, DNS, CORS surface as TypeError, etc.). */
export function isNetworkError(err: unknown): boolean {
  if (err == null) return false;
  if (typeof err === 'object' && err !== null) {
    const name = (err as { name?: unknown }).name;
    if (name === 'AuthRetryableFetchError') return true;
    const status = (err as { status?: unknown }).status;
    if (status === 0) return true;
  }
  if (err instanceof TypeError) {
    return /failed to fetch|networkerror|load failed|aborted|abort/i.test(err.message);
  }
  let msg = '';
  if (typeof err === 'string') {
    msg = err;
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    msg = String((err as { message: unknown }).message);
  }
  return /failed to fetch|network request failed|net::err|load failed/i.test(msg);
}

/** Duck-type PostgREST / Supabase client errors (and similar `{ code, message, hint? }` payloads). */
export function isSupabaseLikeError(err: unknown): boolean {
  const e = unwrapCause(err);
  if (!e || typeof e !== 'object') return false;
  const o = e as Record<string, unknown>;
  if (typeof o.message !== 'string' || typeof o.code !== 'string') return false;
  if ('hint' in o || 'details' in o) return true;
  return o.code.startsWith('PGRST') || /^\d{5}$/.test(o.code);
}

function formatDescription(err: unknown): string {
  const base = getErrorMessage(err);
  const inner = unwrapCause(err);
  if (inner && typeof inner === 'object') {
    const hint = (inner as { hint?: unknown }).hint;
    if (typeof hint === 'string' && hint.trim() && !base.includes(hint)) {
      return `${base} — ${hint}`;
    }
  }
  return base;
}

export type ShowErrorOptions = {
  /** Overrides formatted description (otherwise derived from the error). */
  description?: string;
};

/**
 * Maps thrown/caught errors to Sonner toasts (generic title + detail in description).
 * Recognizes **network** failures and **Supabase / PostgREST-shaped** errors (including `ServiceError` with a Supabase `cause`).
 */
export function useErrorHandler() {
  const showError = useCallback(
    (error: unknown, overrides?: ShowErrorOptions) => {
      const description =
        overrides?.description ??
        formatDescription(error);
      toast.error(TOAST_ERROR_GENERIC, description ? { description } : undefined);
    },
    []
  );

  return {
    showError,
    /** Same string shown in the toast description; useful for inline alerts. */
    getErrorMessage: formatDescription,
    isNetworkError,
    isSupabaseLikeError,
  };
}
