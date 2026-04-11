/**
 * Default values used when environment variables are not set (e.g. GitHub Actions
 * without Actions secrets, or no `.env` file).
 *
 * SECURITY / OPS:
 * - Stripe `pk_*` keys and Google OAuth *client IDs* are not secret in the same way as
 *   server keys; they still appear in the APK and in git if you fill this file.
 * - Restrict `GOOGLE_MAPS_API_KEY` in Google Cloud (Android app + SHA-1).
 * - Prefer GitHub Actions secrets for teams; this file is for private/solo repos that
 *   accept committing non-server credentials.
 *
 * Fill empty strings below, or leave empty and use `.env` / GitHub Secrets instead.
 */
module.exports = {
  GOOGLE_MAPS_API_KEY: "AIzaSyAQLryLiSJFySJZjjNxgsYIvBe1FrXwu2Y",
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    "780503636590-cv7buapsamg5a97kj389jkgec1983ks5.apps.googleusercontent.com",
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID:
    "780503636590-j8tr0f9rm2gl3t3r78p8b4dm47v1sstt.apps.googleusercontent.com",
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    "pk_test_51S5ASMLu0TZiscQbr8zobgtg5d2ExUnUp4PSFI0xMwHF0uLSiMWsNLtnAmGAp43Qbw84gjeQ2rxOeHzn8fi1JvzX00VQUR4ZVk",
  /** Must include `/api` suffix, same as production backend. */
  EXPO_PUBLIC_API_URL: "https://back.nuxapp.de/api",
};
