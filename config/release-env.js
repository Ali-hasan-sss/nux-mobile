/**
 * Baked into Android release APK via `npm run build:android:release`.
 * Metro inlines EXPO_PUBLIC_* at bundle time — these override dev `.env` for release builds.
 *
 * Local LAN URLs belong in `.env` only (npm start / dev client).
 */
module.exports = {
  EXPO_PUBLIC_MOBILE_API_KEY: "NUX-APP-API-2026-@@&&-Mouhanad-Dawood",
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    "pk_live_51TYUYtBT15pqwWiVKwiJJULkjMzqNAG1w09EXD3tf7JDtmQPC39t9WPeUVQUZKlj2XLrOtG2Kcgx2wozWUSbqSJ500SQGlCQY7",
  EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID:
    "361590603430-ibqv1453cem29tvsnrdm1aeftusk6ul3.apps.googleusercontent.com",
  EXPO_PUBLIC_API_URL: "https://back.nuxapp.de/api",
  EXPO_PUBLIC_WEBSITE_URL: "https://nuxapp.de",
};
