import type { LegalLocale } from "@/config/website";

type BuildLegalHtmlOptions = {
  title: string;
  bodyHtml: string;
  locale: LegalLocale;
  isDark: boolean;
};

/** Minimal document for react-native-webview (same HTML as admin / website API). */
export function buildLegalDocumentHtml({
  title,
  bodyHtml,
  locale,
  isDark,
}: BuildLegalHtmlOptions): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const bg = isDark ? "#0a0e27" : "#ffffff";
  const text = isDark ? "#f1f5f9" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const link = isDark ? "#22d3ee" : "#0891b2";

  const safeBody = bodyHtml?.trim()
    ? bodyHtml
    : `<p style="color:${muted};text-align:center;padding:24px 0;">—</p>`;

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      background: ${bg};
      color: ${text};
    }
    h1 { font-size: 1.25rem; margin: 0 0 1rem; font-weight: 700; }
    h2, h3 { margin: 1.25rem 0 0.5rem; font-weight: 600; }
    p { margin: 0 0 0.75rem; }
    ul, ol { margin: 0 0 0.75rem; padding-${dir === "rtl" ? "right" : "left"}: 1.25rem; }
    a { color: ${link}; }
    img { max-width: 100%; height: auto; }
    .ql-align-center { text-align: center; }
    .ql-align-right { text-align: right; }
    .ql-align-left { text-align: left; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <article>${safeBody}</article>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
