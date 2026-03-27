import { useEffect, useRef } from 'react';
import { getErrorMessage, toastQueryError } from '@shared/lib/query';

/**
 * React Query v5 removed `onError` on `useQuery`. Use this for user-visible load failures.
 * Dedupes by error message so strict-mode double-mount does not spam toasts.
 * Pass `refetch` from the query result to add a toast action that retries the query.
 */
export function useQueryErrorToast(
  isError: boolean,
  error: unknown,
  title?: string,
  refetch?: () => Promise<unknown>,
) {
  const lastMsg = useRef<string | null>(null);
  useEffect(() => {
    if (!isError || error == null) {
      lastMsg.current = null;
      return;
    }
    const msg = getErrorMessage(error);
    if (lastMsg.current === msg) return;
    lastMsg.current = msg;
    toastQueryError(error, title, refetch ? { onRetry: () => void refetch() } : undefined);
  }, [isError, error, title, refetch]);
}
