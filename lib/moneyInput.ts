/**
 * Sanitize free-text money input: one decimal separator, max fraction digits.
 * Accepts "," or "." as the separator; normalizes display to ".".
 */
export function sanitizeEurMoneyInput(
  text: string,
  options: { maxIntegerDigits?: number; maxFractionDigits?: number } = {}
): string {
  const maxInt = options.maxIntegerDigits ?? 8;
  const maxFrac = options.maxFractionDigits ?? 2;

  const raw = text.replace(/[^\d.,]/g, "");
  let normalized = "";
  let sawSep = false;
  for (const ch of raw) {
    if (ch === "." || ch === ",") {
      if (!sawSep) {
        sawSep = true;
        normalized += ".";
      }
      continue;
    }
    normalized += ch;
  }

  const dot = normalized.indexOf(".");
  const wholeRaw = dot === -1 ? normalized : normalized.slice(0, dot);
  let fracRaw = dot === -1 ? "" : normalized.slice(dot + 1);

  let whole = wholeRaw.replace(/\D/g, "").slice(0, maxInt);
  whole = whole.replace(/^0+(?=[1-9])/, "");
  if (whole === "" && fracRaw.replace(/\D/g, "").length > 0) {
    whole = "0";
  }

  fracRaw = fracRaw.replace(/\D/g, "").slice(0, maxFrac);

  const trailingDot =
    sawSep && dot !== -1 && fracRaw === "" && normalized.endsWith(".");

  if (!sawSep) {
    return whole;
  }
  if (fracRaw.length > 0) {
    return `${whole}.${fracRaw}`;
  }
  if (trailingDot) {
    return `${whole}.`;
  }
  return whole;
}

/** Parse sanitized EUR string to a number rounded to cents, or null if invalid / empty. */
export function parseEurInputToNumber(
  value: string,
  opts: { min?: number; max?: number } = {}
): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "" || trimmed === ".") return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100) / 100;
  if (opts.min != null && cents < opts.min) return null;
  if (opts.max != null && cents > opts.max) return null;
  return cents;
}

/**
 * POS-style entry: each new digit is the next less-significant digit of the amount in cents.
 * Keystroke order for €5.00 is: 0, 0, 5 (hundredths, tenths, then euros digit).
 * Internal buffer stores digits in that order (LSD first); value = reverse(buffer) as integer cents.
 */
export function rtlBufferToCents(buffer: string): number {
  const normalized = buffer.replace(/\D/g, "");
  if (!normalized) return 0;
  const reversed = normalized.split("").reverse().join("");
  const n = parseInt(reversed, 10);
  return Number.isFinite(n) ? n : 0;
}

export function appendRtlMoneyDigit(
  buffer: string,
  digit: string,
  maxCents: number
): string {
  if (!/^\d$/.test(digit)) return buffer;
  const next = buffer + digit;
  const cents = rtlBufferToCents(next);
  if (cents > maxCents) return buffer;
  return next;
}

export function rtlMoneyBackspace(buffer: string): string {
  return buffer.slice(0, -1);
}

/**
 * Build RTL cents buffer from device keyboard input (digits only, in entry order).
 * Keeps the longest prefix whose interpreted cents value does not exceed maxCents.
 */
export function rtlDigitsFromDeviceInput(
  raw: string,
  maxCents: number
): string {
  const digits = raw.replace(/\D/g, "");
  let best = "";
  for (let i = 0; i < digits.length; i++) {
    const cand = digits.slice(0, i + 1);
    if (rtlBufferToCents(cand) <= maxCents) {
      best = cand;
    } else {
      break;
    }
  }
  return best;
}

const MASK_DASH = "-";

/** Minimum integer digit slots in the mask (hundreds / tens / units before decimal). */
const MASK_INT_SLOTS = 3;

/**
 * Display mask for RTL money field: empty shows "---.--" (three slots before decimal for amounts up to hundreds).
 * Two fractional digits (EUR cents) after the separator. Dashes fill with digits as user types.
 */
export function formatRtlMoneyMask(buffer: string): string {
  if (!buffer.length) {
    return `${MASK_DASH.repeat(MASK_INT_SLOTS)}.${MASK_DASH}${MASK_DASH}`;
  }

  const cents = rtlBufferToCents(buffer);
  const fracRight =
    buffer.length >= 1 ? String(cents % 10) : MASK_DASH;
  const fracLeft =
    buffer.length >= 2 ? String(Math.floor((cents % 100) / 10)) : MASK_DASH;

  let intPart: string;
  if (buffer.length <= 2) {
    intPart = MASK_DASH.repeat(MASK_INT_SLOTS);
  } else {
    const euroKeys = buffer.length - 2;
    const whole = Math.floor(cents / 100);
    const minW = Math.max(MASK_INT_SLOTS, euroKeys, String(whole).length);
    let w = String(whole);
    while (w.length < minW) {
      w = MASK_DASH + w;
    }
    intPart = w;
  }

  return `${intPart}.${fracLeft}${fracRight}`;
}

/** Arabic-Indic digits + Arabic decimal separator for display. */
export function localizeMoneyMaskVisual(
  maskWithDot: string,
  lang: string
): string {
  const ar = lang.startsWith("ar");
  const sep = ar ? "\u066B" : ".";
  const ind = "٠١٢٣٤٥٦٧٨٩";
  return maskWithDot
    .split("")
    .map((c) => {
      if (c === MASK_DASH) return MASK_DASH;
      if (c === ".") return sep;
      if (/^\d$/.test(c)) {
        return ar ? ind[parseInt(c, 10)]! : c;
      }
      return c;
    })
    .join("");
}
