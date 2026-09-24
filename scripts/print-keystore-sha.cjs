#!/usr/bin/env node
/** Print SHA-1 / SHA-256 for Firebase & Google Maps restriction (release keystore). */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const propsPath = path.join(root, "android", "keystore.properties");

if (!fs.existsSync(propsPath)) {
  console.error("Missing android/keystore.properties — run: npm run keystore:generate");
  process.exit(1);
}

const props = Object.fromEntries(
  fs
    .readFileSync(propsPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const storeFile = path.join(root, "android", props.storeFile || "app/nux-release.keystore");
const cmd = [
  "keytool",
  "-list",
  "-v",
  "-keystore", storeFile,
  "-alias", props.keyAlias || "nux-key",
  "-storepass", props.storePassword || "",
].join(" ");

execSync(cmd, { stdio: "inherit", shell: true });
