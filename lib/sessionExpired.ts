export const SESSION_EXPIRED_CODE = "SESSION_EXPIRED";

export class SessionExpiredError extends Error {
  readonly isSessionExpired = true;

  constructor() {
    super(SESSION_EXPIRED_CODE);
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof SessionExpiredError) return true;

  const msg =
    typeof error === "string"
      ? error
      : ((error as Error)?.message ?? String(error));

  return (
    msg === SESSION_EXPIRED_CODE ||
    msg.includes("No refresh token") ||
    msg.includes("refresh token available") ||
    msg.includes("Token refresh failed") ||
    (error as { isSessionExpired?: boolean })?.isSessionExpired === true
  );
}
