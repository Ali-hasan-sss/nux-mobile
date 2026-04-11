"use strict";
/**
 * Appends missing keys from config/build-time-env.js to GITHUB_ENV so later steps
 * (expo prebuild, Gradle/Metro) see EXPO_PUBLIC_* and GOOGLE_MAPS_API_KEY.
 * Skips keys that are already non-empty (e.g. from GitHub Secrets).
 */
const fs = require("fs");
const path = require("path");

const githubEnv = process.env.GITHUB_ENV;
if (!githubEnv) {
  process.exit(0);
}

const defaultsPath = path.join(__dirname, "..", "config", "build-time-env.js");
let embedded;
try {
  embedded = require(defaultsPath);
} catch (e) {
  console.warn("write-github-env-from-defaults:", e.message);
  process.exit(0);
}

for (const [k, v] of Object.entries(embedded)) {
  if (v === undefined || v === null) continue;
  const str = String(v).trim();
  if (str === "") continue;
  const existing = process.env[k];
  if (existing != null && String(existing).trim() !== "") continue;
  const line = `${k}=${str.replace(/\r?\n/g, "")}\n`;
  fs.appendFileSync(githubEnv, line);
  console.log(`write-github-env-from-defaults: set ${k} from build-time-env.js`);
}
