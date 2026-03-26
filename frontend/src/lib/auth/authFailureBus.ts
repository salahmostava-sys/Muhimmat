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
    code?: string | number;
    message?: string;
    cause?: {
      status?: number;
      code?: string | number;
      message?: string;
    };
  } | null;

  const status = e?.status ?? e?.cause?.status;
  if (status === 401 || status === 403) return true;

  const code = String(e?.code ?? e?.cause?.code ?? '');
  return (
    code === '401' ||
    code === '403' ||
    code === 'PGRST301' ||
    code === 'PGRST302' ||
    code === 'invalid_jwt' ||
    code === 'session_not_found' ||
    code === 'refresh_token_not_found'
  );
};

