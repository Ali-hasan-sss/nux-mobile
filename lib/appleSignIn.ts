import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

export type AppleSignInPayload = {
  identityToken: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
};

export type AppleNativeSignInResult =
  | { ok: true; payload: AppleSignInPayload }
  | {
      ok: false;
      code: "cancelled" | "unavailable" | "error";
      message?: string;
    };

/** Sign in with Apple is iOS/iPadOS only (not Expo Go web / Android). */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithAppleNative(): Promise<AppleNativeSignInResult> {
  if (Platform.OS !== "ios") {
    return { ok: false, code: "unavailable", message: "iOS only" };
  }

  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return {
        ok: false,
        code: "unavailable",
        message: "Sign in with Apple is not available on this device",
      };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return {
        ok: false,
        code: "error",
        message: "No identity token from Apple",
      };
    }

    return {
      ok: true,
      payload: {
        identityToken: credential.identityToken,
        email: credential.email,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName,
              familyName: credential.fullName.familyName,
            }
          : null,
      },
    };
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED") {
      return { ok: false, code: "cancelled" };
    }
    return {
      ok: false,
      code: "error",
      message: e?.message || "Apple sign-in failed",
    };
  }
}
