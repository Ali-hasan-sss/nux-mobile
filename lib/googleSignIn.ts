import { Platform } from "react-native";
import Constants from "expo-constants";

let configured = false;
let nativeModulePromise: Promise<
  typeof import("@react-native-google-signin/google-signin")
> | null = null;

/** True when running inside the Expo Go app (no custom native modules). */
export function isExpoGoApp(): boolean {
  return Constants.appOwnership === "expo";
}

function loadNativeGoogleSignIn() {
  if (!nativeModulePromise) {
    nativeModulePromise = import("@react-native-google-signin/google-signin");
  }
  return nativeModulePromise;
}

/** Web OAuth client ID — must match backend `GOOGLE_CLIENT_ID` (token audience). */
export function getGoogleWebClientId(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "").trim();
}

export function getGoogleIosClientId(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "").trim();
}

export function getGoogleAndroidClientId(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "").trim();
}

export function isGoogleSignInConfiguredInEnv(): boolean {
  return getGoogleWebClientId().length > 0;
}

export async function ensureGoogleSignInNativeConfigured(): Promise<void> {
  if (configured) return;
  const webClientId = getGoogleWebClientId();
  if (!webClientId) return;

  if (isExpoGoApp()) {
    return;
  }

  const { GoogleSignin } = await loadNativeGoogleSignIn();
  const iosClientId = getGoogleIosClientId();

  GoogleSignin.configure({
    webClientId,
    iosClientId: iosClientId || undefined,
    offlineAccess: false,
    scopes: ["profile", "email", "openid"],
  });
  configured = true;
}

export type GoogleNativeSignInResult =
  | { ok: true; idToken: string }
  | { ok: false; code: "cancelled" | "unavailable" | "error"; message?: string };

/**
 * Native Google Sign-In (dev client / store build). Do not call from Expo Go.
 * Uses dynamic import so Metro never loads RNGoogleSignin in Expo Go.
 */
export async function signInWithGoogleNative(): Promise<GoogleNativeSignInResult> {
  if (!isGoogleSignInConfiguredInEnv()) {
    return {
      ok: false,
      code: "unavailable",
      message: "Google Sign-In is not configured",
    };
  }

  if (isExpoGoApp()) {
    return {
      ok: false,
      code: "unavailable",
      message: "Expo Go",
    };
  }

  let statusCodes:
    | Awaited<ReturnType<typeof loadNativeGoogleSignIn>>["statusCodes"]
    | undefined;
  try {
    const mod = await loadNativeGoogleSignIn();
    statusCodes = mod.statusCodes;
    const { GoogleSignin } = mod;
    await ensureGoogleSignInNativeConfigured();

    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();
    if (response.type !== "success") {
      return { ok: false, code: "cancelled" };
    }

    let idToken = response.data.idToken;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) {
      return {
        ok: false,
        code: "error",
        message: "No ID token from Google",
      };
    }

    return { ok: true, idToken };
  } catch (e: any) {
    if (statusCodes && e?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { ok: false, code: "cancelled" };
    }
    if (statusCodes && e?.code === statusCodes.IN_PROGRESS) {
      return {
        ok: false,
        code: "error",
        message: "Sign-in already in progress",
      };
    }
    if (statusCodes && e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        ok: false,
        code: "unavailable",
        message: "Google Play Services not available",
      };
    }
    const msg = e?.message ?? "";
    if (
      msg.includes("RNGoogleSignin") ||
      msg.includes("TurboModuleRegistry")
    ) {
      return {
        ok: false,
        code: "unavailable",
        message:
          "Google Sign-In needs a native build: run `npx expo run:ios` or `npx expo run:android` after installing the package.",
      };
    }
    return {
      ok: false,
      code: "error",
      message: msg || "Google sign-in failed",
    };
  }
}
