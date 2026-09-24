/**
 * Firebase / Google Sign-In + push (FCM) configuration.
 *
 * Values come from your Firebase project (not standalone Google Cloud OAuth clients):
 * - Web client ID: Firebase Console → Authentication → Sign-in method → Google → Web SDK
 * - iOS URL scheme: REVERSED_CLIENT_ID from GoogleService-Info.plist
 */
export function getFirebaseWebClientId(): string {
  return (
    process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    ""
  );
}

export function getFirebaseIosClientId(): string {
  return (
    process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
    ""
  );
}

export function isFirebaseGoogleSignInConfigured(): boolean {
  return getFirebaseWebClientId().length > 0;
}
