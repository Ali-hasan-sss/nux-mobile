#!/usr/bin/env node

/**

 * Local Android release APK build (no EAS).

 * 1. Bump versionCode

 * 2. expo prebuild (sync native config)

 * 3. gradlew assembleRelease (signed via android/keystore.properties)

 *

 * EXPO_PUBLIC_* for the JS bundle come from config/release-env.js (not dev `.env`).

 */

const { execSync } = require("child_process");

const fs = require("fs");

const path = require("path");



const root = path.join(__dirname, "..");

const androidDir = path.join(root, "android");

const keystoreProps = path.join(androidDir, "keystore.properties");

const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

const releaseDefaults = require("../config/release-env.js");



/** Env for release bundle — release-env.js wins over dev `.env`. */

const releaseEnv = {
  ...process.env,
  ...releaseDefaults,
  EXPO_NO_DOTENV: "1",
  NODE_ENV: "production",

  /** Prevent Arabic-Indic digits in Kotlin/Apollo codegen on Arabic Windows locale. */

  JAVA_TOOL_OPTIONS: "-Duser.language=en -Duser.country=US",

  LANG: "en_US.UTF-8",

  LC_ALL: "en_US.UTF-8",

  CMAKE_BUILD_PARALLEL_LEVEL: "1",

};



function maskSecret(value) {

  const s = String(value ?? "");

  if (s.length <= 8) return "***";

  return `${s.slice(0, 4)}…${s.slice(-4)}`;

}



function run(cmd, opts = {}) {

  console.log(`\n> ${cmd}\n`);

  execSync(cmd, {

    stdio: "inherit",

    cwd: root,

    env: releaseEnv,

    ...opts,

  });

}



if (!fs.existsSync(keystoreProps)) {

  console.error(

    "Missing android/keystore.properties — copy keystore.properties.example and set your release keystore."

  );

  console.error("Generate a keystore: npm run keystore:generate");

  process.exit(1);

}



if (!fs.existsSync(path.join(root, "google-services.json"))) {

  console.warn(

    "Warning: google-services.json not found. Firebase Google Sign-In and FCM push require it."

  );

}



console.log("\n📦 Release bundle env (from config/release-env.js):");

for (const [k, v] of Object.entries(releaseDefaults)) {

  const display =

    k.includes("KEY") || k.includes("STRIPE") ? maskSecret(v) : v;

  console.log(`   ${k}=${display}`);

}



run("node scripts/bump-version.cjs");

run("node scripts/generate-icons.js");

run("npx expo prebuild --platform android --no-install");

run(`${gradlew} --stop`, { cwd: androidDir, shell: true });

run(`${gradlew} clean`, { cwd: androidDir, shell: true });

run(

  `${gradlew} assembleRelease --no-daemon --max-workers=1 -PreactNativeArchitectures=arm64-v8a`,

  { cwd: androidDir, shell: true }

);



const apkDir = path.join(androidDir, "app", "build", "outputs", "apk", "release");

console.log(`\n✅ Release APK: ${apkDir}`);


