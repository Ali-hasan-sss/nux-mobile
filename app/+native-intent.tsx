/**
 * Rewrites incoming external links to Expo Router app routes.
 * Example handled:
 * https://www.nuxapp.de/menu/<restaurantUuid>?table=5
 * -> /(tabs)/menu-webview?qrCode=<restaurantUuid>&table=5
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const input = (path || "").trim();
    if (!input) return path;

    const normalized = /^https?:\/\//i.test(input)
      ? input
      : `https://dummy.local${input.startsWith("/") ? "" : "/"}${input}`;
    const url = new URL(normalized);

    const host = url.hostname.toLowerCase();
    const isNuxHost = host === "nuxapp.de" || host === "www.nuxapp.de";
    if (!isNuxHost) return path;

    const match = url.pathname.match(
      /^\/menu\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
    );
    if (!match?.[1]) return path;

    const qrCode = match[1];
    const params = new URLSearchParams({ qrCode });
    const table = url.searchParams.get("table");
    if (table && /^\d+$/.test(table) && Number(table) > 0) {
      params.set("table", table);
    }

    return `/(tabs)/menu-webview?${params.toString()}`;
  } catch {
    return path;
  }
}

