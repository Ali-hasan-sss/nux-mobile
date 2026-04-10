export function getApiErrorMessage(e: unknown, fallback: string): string {
  const ax = e as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const m = ax.response?.data?.message;
  if (typeof m === "string" && m.trim()) return m.trim();
  const msg = ax.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  return fallback;
}
