import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@shared/components/ui/alert';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { getErrorMessage } from '@shared/lib/query';

export type QueryErrorRetryProps = {
  error: unknown;
  onRetry: () => void;
  isFetching?: boolean;
  title?: string;
  className?: string;
};

/** Inline error state for failed `useQuery` results with a manual refetch button. */
export function QueryErrorRetry({
  error,
  onRetry,
  isFetching,
  title = 'تعذر تحميل البيانات',
  className,
}: Readonly<QueryErrorRetryProps>) {
  return (
    <Alert variant="destructive" className={cn('max-w-2xl', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm leading-relaxed">{getErrorMessage(error)}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 border-destructive/40"
            onClick={() => onRetry()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
            إعادة المحاولة
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
