import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import { useAlert } from "@/contexts/AlertContext";
import {
  loginWithApple,
  RESTAURANT_OWNER_NOT_ALLOWED,
} from "@/store/slices/authSlice";
import { getProfile } from "@/store/slices/profileSlice";
import type { AppDispatch } from "@/store/store";
import {
  isAppleSignInAvailable,
  signInWithAppleNative,
  type AppleSignInPayload,
} from "@/lib/appleSignIn";

type Props = {
  onSuccess?: () => void;
};

async function completeAppleLogin(
  payload: AppleSignInPayload,
  dispatch: AppDispatch,
  onSuccess?: () => void,
) {
  const { user } = await dispatch(loginWithApple(payload)).unwrap();
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

export function AppleSignInButton(props: Props) {
  const { onSuccess } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useAlert();
  const colorScheme = useColorScheme();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    void isAppleSignInAvailable().then((ok) => {
      if (mounted) setAvailable(ok);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const native = await signInWithAppleNative();
      if (!native.ok) {
        if (native.code === "cancelled") return;
        showToast({
          message: native.message ?? t("auth.appleSignInFailed"),
          type: "error",
        });
        return;
      }
      await completeAppleLogin(native.payload, dispatch, onSuccess);
    } catch (e: any) {
      const payload =
        typeof e === "string"
          ? e
          : (e?.payload as string | undefined) ?? e?.message ?? "";
      const msg =
        payload === RESTAURANT_OWNER_NOT_ALLOWED
          ? t("auth.restaurantOwnerNotAllowed")
          : payload || t("auth.appleSignInFailed");
      showToast({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  }, [busy, dispatch, onSuccess, showToast, t]);

  if (Platform.OS !== "ios" || !available) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color="#000" />
        </View>
      ) : (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={
            AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
          }
          buttonStyle={
            colorScheme === "dark"
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={16}
          style={styles.btn}
          onPress={() => void onPress()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 12,
  },
  btn: {
    width: "100%",
    height: 52,
  },
  busy: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
});
