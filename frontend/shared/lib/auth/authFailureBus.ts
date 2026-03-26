const AUTH_FAILURE_EVENT = 'app:auth-failure';

type AuthFailureDetail = {
  source: 'query' | 'mutation' | 'auth_state';
  reason: string;
};

export const emitAuthFailure = (detail: AuthFailureDetail) => {
  globalThis.dispatchEvent(new CustomEvent<AuthFailureDetail>(AUTH_FAILURE_EVENT, { detail }));
};

export const onAuthFailure = (handler: (detail: AuthFailureDetail) => void) => {
  const listener: EventListener = (event) => {
    const custom = event as CustomEvent<AuthFailureDetail>;
    if (!custom.detail) return;
    handler(custom.detail);
  };
  globalThis.addEventListener(AUTH_FAILURE_EVENT, listener);
  return () => globalThis.removeEventListener(AUTH_FAILURE_EVENT, listener);
};

export const isStrictUnauthenticatedError = (error: unknown): boolean => {
  const e = error as {
    status?: number;
    cause?: {
      status?: number;
    };
  } | null;

  const status = e?.status ?? e?.cause?.status;
  return status === 401 || status === 403;
};

