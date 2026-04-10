/**
 * Convert Eastern Arabic / Persian digits to Western ASCII 0-9 for payment PIN validation.
 * JS `\d` and typical PIN checks only match ASCII digits.
 */
const EASTERN_ARABIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

export function normalizePaymentPinDigits(raw: string): string {
  const s = raw.replace(/\s/g, "").replace(/\u200c|\u200f/g, "");
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp != null && cp >= 0xff10 && cp <= 0xff19) {
      out += String(cp - 0xff10);
      continue;
    }
    const e = EASTERN_ARABIC.indexOf(ch);
    if (e >= 0) {
      out += String(e);
      continue;
    }
    const p = PERSIAN.indexOf(ch);
    if (p >= 0) {
      out += String(p);
      continue;
    }
    out += ch;
  }
  return out;
}

export function isAsciiPinDigits(s: string): boolean {
  return /^\d{6,12}$/.test(s);
}
