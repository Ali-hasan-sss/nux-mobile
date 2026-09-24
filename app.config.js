// Optional embedded defaults (CI without secrets / no .env). `.env` overrides below.
(function applyEmbeddedBuildEnv() {
  try {
    const embedded = require("./config/build-time-env.js");
    for (const [k, v] of Object.entries(embedded)) {
      if (typeof v !== "string" || v.trim() === "") continue;
      const cur = process.env[k];
      if (cur != null && String(cur).trim() !== "") continue;
      process.env[k] = v;
    }
  } catch (e) {
    if (e && e.code !== "MODULE_NOT_FOUND") throw e;
  }
})();

if (process.env.EXPO_NO_DOTENV !== "1") {
  require("dotenv").config({ override: false });
}

const { withAndroidManifest } = require("expo/config-plugins");

const base = require("./app.json");

/** Ask Play Services to prefetch ML Kit barcode modules used by expo-camera. */
function withMlKitBarcodeModules(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app["meta-data"] = app["meta-data"] || [];
    const exists = app["meta-data"].some(
      (item) => item.$?.["android:name"] === "com.google.mlkit.vision.DEPENDENCIES"
    );
    if (!exists) {
      app["meta-data"].push({
        $: {
          "android:name": "com.google.mlkit.vision.DEPENDENCIES",
          "android:value": "barcode,barcode_ui",
        },
      });
    }
    return cfg;
  });
}

if (!base.expo.plugins) base.expo.plugins = [];
base.expo.plugins.push(withMlKitBarcodeModules);

/** Android 7.0 (API 24) and above; applied on EAS prebuild and local `expo prebuild`. */
if (!base.expo.plugins) base.expo.plugins = [];
const hasBuildProperties = base.expo.plugins.some(
  (p) => p === "expo-build-properties" || (Array.isArray(p) && p[0] === "expo-build-properties")
);
if (!hasBuildProperties) {
  base.expo.plugins.unshift([
    "expo-build-properties",
    {
      android: {
        minSdkVersion: 24,
        softwareKeyboardLayoutMode: "resize",
      },
      ios: {
        // SDK 54 + Xcode 26 on EAS: avoids prebuilt RN / AppDelegate mismatches
        buildReactNativeFromSource: true,
        // GoogleSignIn can pull AppCheckCore 11.3.x, which currently fails
        // CocoaPods static-library integration unless these dependencies expose
        // modular headers.
        extraPods: [
          { name: "AppCheckCore", version: "11.2.0" },
          { name: "GoogleUtilities/Environment", modular_headers: true },
          { name: "GoogleUtilities/UserDefaults", modular_headers: true },
          { name: "RecaptchaInterop", modular_headers: true },
        ],
      },
    },
  ]);
}

if (process.env.GOOGLE_MAPS_API_KEY) {
  if (!base.expo.android) base.expo.android = {};
  if (!base.expo.android.config) base.expo.android.config = {};
  if (!base.expo.android.config.googleMaps) base.expo.android.config.googleMaps = {};
  base.expo.android.config.googleMaps.apiKey = process.env.GOOGLE_MAPS_API_KEY;
}

/** iOS: reverse client id from GoogleService-Info.plist → com.googleusercontent.apps.<id> */
const firebaseIosUrlScheme =
  process.env.FIREBASE_IOS_URL_SCHEME?.trim() ||
  process.env.GOOGLE_IOS_URL_SCHEME?.trim();
if (firebaseIosUrlScheme) {
  if (!base.expo.plugins) base.expo.plugins = [];
  base.expo.plugins.push([
    "@react-native-google-signin/google-signin",
    { iosUrlScheme: firebaseIosUrlScheme },
  ]);
}

/** Firebase Android — place google-services.json in project root before prebuild. */
const fs = require("fs");
const path = require("path");
const googleServicesPath = path.join(__dirname, "google-services.json");
if (fs.existsSync(googleServicesPath)) {
  if (!base.expo.android) base.expo.android = {};
  base.expo.android.googleServicesFile = "./google-services.json";
}

/** Firebase iOS — place GoogleService-Info.plist in project root before prebuild. */
const googleServiceInfoPath = path.join(__dirname, "GoogleService-Info.plist");
if (fs.existsSync(googleServiceInfoPath)) {
  if (!base.expo.ios) base.expo.ios = {};
  base.expo.ios.googleServicesFile = "./GoogleService-Info.plist";
}

module.exports = base;
