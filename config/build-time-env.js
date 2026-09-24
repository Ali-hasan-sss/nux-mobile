/**
 * Default values when environment variables are not set (e.g. GitHub Actions
 * without Actions secrets, or no `.env` file).
 *
 * Release APK values live in `config/release-env.js` (used by build-android-release.cjs).
 */
const releaseEnv = require("./release-env");

module.exports = {
  GOOGLE_MAPS_API_KEY: "AIzaSyAQLryLiSJFySJZjjNxgsYIvBe1FrXwu2Y",
  ...releaseEnv,
  /** Legacy alias — same as EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID when set. */
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    releaseEnv.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID ||
    "361590603430-ibqv1453cem29tvsnrdm1aeftusk6ul3.apps.googleusercontent.com",
};
