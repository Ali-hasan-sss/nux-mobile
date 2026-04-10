import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useTheme } from "@/hooks/useTheme";
import { useAlert } from "@/contexts/AlertContext";
import {
  loginWithGoogle,
  RESTAURANT_OWNER_NOT_ALLOWED,
} from "@/store/slices/authSlice";
import { getProfile } from "@/store/slices/profileSlice";
import type { AppDispatch } from "@/store/store";
import {
  getGoogleAndroidClientId,
  getGoogleIosClientId,
  getGoogleWebClientId,
  isExpoGoApp,
  isGoogleSignInConfiguredInEnv,
  signInWithGoogleNative,
} from "@/lib/googleSignIn";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onSuccess?: () => void;
};

async function completeGoogleLogin(
  idToken: string,
  dispatch: AppDispatch,
  showToast: (o: { message: string; type: "error" | "success" }) => void,
  t: (k: string) => string,
  onSuccess?: () => void,
) {
  const { user } = await dispatch(loginWithGoogle(idToken)).unwrap();
  await dispatch(getProfile()).unwrap();

  const mustVerify =
    user.emailVerified === false || user.emailVerified === undefined;
  if (mustVerify) {
    router.replace({
      pathname: "/auth/verify-email",
      params: { email: user.email ?? "" },
    });
  } else {
    router.replace("/(tabs)");
  }
  onSuccess?.();
}

function GoogleSignInChrome(props: {
  busy: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  defaultFontFamily: string;
  t: (k: string) => string;
}) {
  const { busy, onPress, colors, defaultFontFamily, t } = props;
  const font = { fontFamily: defaultFontFamily };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface ?? colors.background,
          opacity: busy ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t("auth.continueWithGoogle")}
    >
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.row}>
          <View style={styles.gMark}>
            <Text style={[styles.gText, font]}>G</Text>
          </View>
          <Text style={[styles.label, { color: colors.text }, font]}>
            {t("auth.continueWithGoogle")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Browser-based ID token flow — works in Expo Go. */
function GoogleSignInExpoGo({ onSuccess }: Props) {
  const { t } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useAlert();
  const [busy, setBusy] = useState(false);
  const handledTokenRef = useRef<string | null>(null);

  const webClientId = getGoogleWebClientId();
  const iosClientId = getGoogleIosClientId();
  const androidClientId = getGoogleAndroidClientId();

  // expo-auth-session requires platform client ids on native; fall back to web client (same as backend GOOGLE_CLIENT_ID).
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId: iosClientId || webClientId,
    androidClientId: androidClientId || webClientId,
  });

  const runLogin = useCallback(
    async (idToken: string) => {
      try {
        await completeGoogleLogin(
          idToken,
          dispatch,
          showToast,
          t,
          onSuccess,
        );
      } catch (e: any) {
        const payload =
          typeof e === "string"
            ? e
            : (e?.payload as string | undefined) ?? e?.message ?? "";
        const msg =
          payload === RESTAURANT_OWNER_NOT_ALLOWED
            ? t("auth.restaurantOwnerNotAllowed")
            : payload || t("auth.googleSignInFailed");
        showToast({ message: msg, type: "error" });
      } finally {
        setBusy(false);
      }
    },
    [dispatch, onSuccess, showToast, t],
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === "cancel" || response.type === "dismiss") {
      setBusy(false);
      return;
    }
    if (response.type === "error") {
      setBusy(false);
      showToast({
        message: t("auth.googleSignInFailed"),
        type: "error",
      });
      return;
    }
    if (response.type !== "success") return;

    const idToken = response.params?.id_token;
    if (!idToken || typeof idToken !== "string") {
      setBusy(false);
      showToast({
        message: t("auth.googleSignInFailed"),
        type: "error",
      });
      return;
    }
    if (handledTokenRef.current === idToken) return;
    handledTokenRef.current = idToken;
    void runLogin(idToken);
  }, [response, runLogin, showToast, t]);

  const onPress = () => {
    if (!request || busy) return;
    setBusy(true);
    void promptAsync();
  };

  return (
    <GoogleSignInChrome
      busy={busy}
      onPress={onPress}
      colors={colors}
      defaultFontFamily={defaultFontFamily}
      t={t}
    />
  );
}

/** @react-native-google-signin — requires dev/production native build. */
function GoogleSignInDevClient({ onSuccess }: Props) {
  const { t } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useAlert();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const native = await signInWithGoogleNative();
      if (!native.ok) {
        if (native.code === "cancelled") return;
        showToast({
          message: native.message ?? t("auth.googleSignInFailed"),
          type: "error",
        });
        return;
      }
      await completeGoogleLogin(
        native.idToken,
        dispatch,
        showToast,
        t,
        onSuccess,
      );
    } catch (e: any) {
      const payload =
        typeof e === "string"
          ? e
          : (e?.payload as string | undefined) ?? e?.message ?? "";
      const msg =
        payload === RESTAURANT_OWNER_NOT_ALLOWED
          ? t("auth.restaurantOwnerNotAllowed")
          : payload || t("auth.googleSignInFailed");
      showToast({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <GoogleSignInChrome
      busy={busy}
      onPress={() => void onPress()}
      colors={colors}
      defaultFontFamily={defaultFontFamily}
      t={t}
    />
  );
}

export function GoogleSignInButton(props: Props) {
  if (!isGoogleSignInConfiguredInEnv()) {
    return null;
  }
  if (isExpoGoApp()) {
    return <GoogleSignInExpoGo {...props} />;
  }
  return <GoogleSignInDevClient {...props} />;
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  gMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dadce0",
  },
  gText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
