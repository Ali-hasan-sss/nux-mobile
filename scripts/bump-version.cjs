#!/usr/bin/env node
/**
 * Increments Android versionCode / iOS buildNumber before each release build.
 * Source of truth: app.json (synced to android/app/build.gradle).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appJsonPath = path.join(root, "app.json");
const buildGradlePath = path.join(root, "android", "app", "build.gradle");
const packageJsonPath = path.join(root, "package.json");

const app = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
const expo = app.expo;

const prevCode = Number(expo.android?.versionCode) || 1;
const nextCode = prevCode + 1;

expo.android = expo.android || {};
expo.android.versionCode = nextCode;
expo.ios = expo.ios || {};
expo.ios.buildNumber = String(nextCode);

/** Bump the marketing version's patch number (e.g. 1.0.0 → 1.0.1) so the
 *  version shown in the app changes on every release. Major/minor are edited
 *  manually in app.json when needed. */
function bumpPatch(v) {
  const parts = String(v || "1.0.0")
    .split(".")
    .map((n) => parseInt(n, 10));
  const [major = 1, minor = 0, patch = 0] = parts.map((n) =>
    Number.isFinite(n) ? n : 0
  );
  return `${major}.${minor}.${patch + 1}`;
}

const prevVersion = expo.version || "1.0.0";
const versionName = bumpPatch(prevVersion);
expo.version = versionName;

// Keep runtimeVersion aligned with marketing version for OTA (optional)
expo.runtimeVersion = versionName;

fs.writeFileSync(appJsonPath, JSON.stringify(app, null, 2) + "\n");

if (fs.existsSync(buildGradlePath)) {
  let gradle = fs.readFileSync(buildGradlePath, "utf8");
  gradle = gradle.replace(
    /versionCode\s+\d+/,
    `versionCode ${nextCode}`
  );
  gradle = gradle.replace(
    /versionName\s+"[^"]*"/,
    `versionName "${versionName}"`
  );
  fs.writeFileSync(buildGradlePath, gradle);
}

if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  pkg.version = versionName;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
}

console.log(
  `[bump-version] versionCode ${prevCode} → ${nextCode}, version ${prevVersion} → ${versionName}`
);
