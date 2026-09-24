/** User-facing network error copy — always English on Android and iOS. */
export const NETWORK_ERROR_MESSAGE =
  "No internet connection. Please check your network and try again.";

export const NETWORK_ERROR_MESSAGE_SHORT = "Network error. Check your internet connection.";

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: string; message?: string };
  const msg = String(e.message ?? error ?? "").toLowerCase();
  const code = String(e.code ?? "").toUpperCase();
  return (
    code === "ERR_NETWORK" ||
    code === "NETWORK_ERROR" ||
    code === "ECONNABORTED" ||
    msg.includes("network error") ||
    msg.includes("enotfound") ||
    msg.includes("enetunreach") ||
    msg.includes("failed to fetch")
  );
}

export function createNetworkError(): Error {
  const err = new Error(NETWORK_ERROR_MESSAGE);
  (err as Error & { code?: string }).code = "NETWORK_ERROR";
  return err;
}

/** Map any network failure to the standard English message. */
export function toNetworkErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return NETWORK_ERROR_MESSAGE;
}
