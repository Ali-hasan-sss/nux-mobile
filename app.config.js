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

require("dotenv").config({ override: true });

const base = require("./app.json");

if (process.env.GOOGLE_MAPS_API_KEY) {
  if (!base.android) base.android = {};
  if (!base.android.config) base.android.config = {};
  if (!base.android.config.googleMaps) base.android.config.googleMaps = {};
  base.android.config.googleMaps.apiKey = process.env.GOOGLE_MAPS_API_KEY;
}

/** iOS: reverse client id → com.googleusercontent.apps.<id> (Google Cloud Console → iOS OAuth client). Required for native Google Sign-In after prebuild. */
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME?.trim();
if (googleIosUrlScheme) {
  if (!base.expo.plugins) base.expo.plugins = [];
  base.expo.plugins.push([
    "@react-native-google-signin/google-signin",
    { iosUrlScheme: googleIosUrlScheme },
  ]);
}

module.exports = base;
