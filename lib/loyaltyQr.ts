const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SCAN_PATH_RE =
  /\/scan\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?/i;

/** Meal/drink QR: nuxapp.de/scan/{uuid}, or a bare meal/drink UUID. */
export function looksLikeLoyaltyQr(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s) return false;
  if (isLoyaltyScanUrl(s)) return true;
  if (UUID_RE.test(s)) return true;
  return SCAN_PATH_RE.test(s);
}

/** Meal/drink QR now encodes https://nuxapp.de/scan/{uuid} (or www). */
export function isLoyaltyScanUrl(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s) return false;
  try {
    const withProto = /^https?:\/\//i.test(s)
      ? s
      : `https://nuxapp.de${s.startsWith("/") ? s : `/${s}`}`;
    const url = new URL(withProto);
    return SCAN_PATH_RE.test(url.pathname);
  } catch {
    return SCAN_PATH_RE.test(s);
  }
}

/** Extract the meal/drink UUID from a raw UUID or nuxapp.de/scan/{uuid}. */
export function extractLoyaltyQrCode(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return s;
  if (UUID_RE.test(s)) return s;

  try {
    const withProto = /^https?:\/\//i.test(s)
      ? s
      : `https://nuxapp.de${s.startsWith("/") ? s : `/${s}`}`;
    const url = new URL(withProto);
    const fromPath = url.pathname.match(SCAN_PATH_RE);
    if (fromPath?.[1]) return fromPath[1];
  } catch {
    // ignore
  }

  const fromString = s.match(SCAN_PATH_RE);
  if (fromString?.[1]) return fromString[1];

  const embeddedUuid = s.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return embeddedUuid?.[0] ?? s;
}

export function isValidLoyaltyQrCode(code: string): boolean {
  return UUID_RE.test(String(code || "").trim());
}
