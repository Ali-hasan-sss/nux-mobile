#!/usr/bin/env node
/**
 * Generate a new release keystore for com.nuxapp.app (PKCS12).
 * Output: android/app/nux-release.keystore
 *
 * Override defaults via env:
 *   KEYSTORE_PASSWORD, KEY_PASSWORD, KEY_ALIAS
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "android", "app", "nux-release.keystore");
const alias = process.env.KEY_ALIAS || "nux-key";
const storePass = process.env.KEYSTORE_PASSWORD || "nux-release-change-me";
const keyPass = process.env.KEY_PASSWORD || storePass;

if (fs.existsSync(out)) {
  console.error(`Keystore already exists: ${out}`);
  console.error("Delete it first if you want a new one.");
  process.exit(1);
}

const dname =
  process.env.KEYSTORE_DNAME ||
  '"CN=NUX App, OU=Mobile, O=Nux, L=Damascus, ST=Damascus, C=SY"';

const cmd = [
  "keytool",
  "-genkeypair",
  "-v",
  "-storetype", "PKCS12",
  "-keystore", `"${out}"`,
  "-alias", alias,
  "-keyalg", "RSA",
  "-keysize", "2048",
  "-validity", "10000",
  "-storepass", storePass,
  "-keypass", keyPass,
  "-dname", dname,
].join(" ");

console.log("Generating release keystore...");
execSync(cmd, { stdio: "inherit", shell: true });

const propsPath = path.join(root, "android", "keystore.properties");
const props = [
  "storeFile=app/nux-release.keystore",
  `storePassword=${storePass}`,
  `keyAlias=${alias}`,
  `keyPassword=${keyPass}`,
  "",
].join("\n");
fs.writeFileSync(propsPath, props);

console.log(`\n✅ Keystore: ${out}`);
console.log(`✅ Signing config: ${propsPath}`);
console.log("\nNext steps:");
console.log("1. Add SHA-1/SHA-256 of this keystore to Firebase (Project settings → Your apps → Android com.nuxapp.app)");
console.log("   npm run keystore:sha1");
console.log("2. Download google-services.json from Firebase → place in mobile_app_new/");
console.log("3. npm run build:android:release");
