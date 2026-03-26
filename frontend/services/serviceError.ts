export class ServiceError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.cause = cause;
  }
}

/** Wraps Supabase or unknown errors as {@link ServiceError} for consistent service-layer throws. */
export function toServiceError(error: unknown, context?: string): ServiceError {
  if (error instanceof ServiceError) return error;
  if (error) console.error(error);
  const message =
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message
      ? (error as { message: string }).message
      : context
        ? `Service failure: ${context}`
        : "Service failure";
  return new ServiceError(message, error);
}

export const throwIfError = (error: unknown, context: string): void => {
  if (!error) return;
  throw toServiceError(error, context);
};
