import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  BackHandler,
  ScrollView,
  Keyboard,
  Dimensions,
} from "react-native";
import { Text } from "@/components/AppText";
import { Link, router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, Eye, EyeOff, LogIn, Headphones, ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomAlert } from "@/components/CustomAlert";
import { Checkbox } from "@/components/Checkbox";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";
import { loginUser, RESTAURANT_OWNER_NOT_ALLOWED } from "@/store/slices/authSlice";
import { getProfile } from "@/store/slices/profileSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const user = useSelector((s: RootState) => s.auth.user);
  const mustVerify =
    user?.emailVerified === false || user?.emailVerified === undefined;
  const { t, i18n } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const insets = useSafeAreaInsets();
  const font = { fontFamily: defaultFontFamily };
  const isRTL = i18n.language === "ar";

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const inputGroupRefs = useRef<Map<string, View>>(new Map());

  useEffect(() => {
    const show =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s = Keyboard.addListener(show, (e) => {
      keyboardHeightRef.current = e.endCoordinates.height;
    });
    const h = Keyboard.addListener(hide, () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const setInputGroupRef = useCallback((id: string) => (node: View | null) => {
    if (node) inputGroupRefs.current.set(id, node);
    else inputGroupRefs.current.delete(id);
  }, []);

  const scrollFocusedGroupIntoView = useCallback((groupId: string) => {
    const delay = Platform.OS === "ios" ? 280 : 180;
    setTimeout(() => {
      const el = inputGroupRefs.current.get(groupId);
      if (!el || !scrollViewRef.current) return;
      const kb = keyboardHeightRef.current;
      const winH = Dimensions.get("window").height;
      const padding = 24;
      const safeBottom = kb > 0 ? winH - kb - padding : winH - padding;
      el.measureInWindow((fx, fy, fw, fh) => {
        const bottom = fy + fh;
        if (bottom > safeBottom) {
          const delta = bottom - safeBottom + 20;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollYRef.current + delta),
            animated: true,
          });
        }
      });
    }, delay);
  }, []);

  const isEmailVerificationRequiredError = (err: unknown): boolean => {
    const message =
      typeof err === "string"
        ? err
        : (err as { message?: string })?.message ?? "";
    return (
      message.toLowerCase().includes("verify your email") ||
      message.toLowerCase().includes("email first")
    );
  };

  useEffect(() => {
    if (isAuthenticated && mustVerify) {
      router.replace("/auth/verify-email");
    }
  }, [isAuthenticated, mustVerify]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/choose-action");
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorAlert({
        visible: true,
        message: t("common.pleaseFillAllFields"),
      });
      return;
    }

    if (!agreedToTerms) {
      setErrorAlert({
        visible: true,
        message: t("common.pleaseAgreeToTerms"),
      });
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();

      console.log("🔄 Fetching user profile after login...");
      await dispatch(getProfile()).unwrap();

      const mustVerify =
        result.user?.emailVerified === false ||
        result.user?.emailVerified === undefined;
      if (mustVerify) {
        router.replace("/auth/verify-email");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      const isRestaurantOwner =
        error === RESTAURANT_OWNER_NOT_ALLOWED ||
        error?.message === RESTAURANT_OWNER_NOT_ALLOWED;
      const requiresEmailVerification = isEmailVerificationRequiredError(error);

      if (requiresEmailVerification) {
        router.replace({
          pathname: "/auth/verify-email",
          params: { email: email.trim() },
        });
        return;
      }

      setErrorAlert({
        visible: true,
        message: isRestaurantOwner
          ? t("auth.restaurantOwnerNotAllowed")
          : (error?.message || t("common.loginFailed")),
      });
    } finally {
      setLoading(false);
    }
  };

  const LoginFormRoot =
    Platform.OS === "ios" ? KeyboardAvoidingView : View;

  return (
    <>
      <CustomAlert
        visible={errorAlert.visible}
        type="error"
        title={t("common.error")}
        message={errorAlert.message}
        confirmText={t("common.ok")}
        onConfirm={() => setErrorAlert({ visible: false, message: "" })}
      />
      <LoginFormRoot
        style={[styles.keyboardView, { backgroundColor: "transparent" }]}
        {...(Platform.OS === "ios"
          ? {
              behavior: "padding" as const,
              keyboardVerticalOffset: Math.max(insets.top, 0),
            }
          : {})}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <View
            style={[
              styles.content,
              { paddingTop: Math.max(insets.top, 12) + 8 },
            ]}
          >
          <TouchableOpacity
            style={[
              styles.backIconBtn,
              {
                top: insets.top + 12,
                [isRTL ? "right" : "left"]: 20,
              },
            ]}
            onPress={() => router.replace("/choose-action")}
            accessibilityLabel={t("common.back")}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.supportIconBtn,
              {
                top: insets.top + 12,
                [isRTL ? "left" : "right"]: 20,
              },
            ]}
            onPress={() => router.push("/contact")}
            accessibilityLabel={t("contact.title")}
          >
            <Headphones size={24} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <GoogleSignInButton />
          <View style={styles.authDividerRow}>
            <View
              style={[styles.authDividerLine, { backgroundColor: colors.border }]}
            />
            <Text
              style={[
                styles.authDividerText,
                { color: colors.textSecondary },
                font,
              ]}
            >
              {t("auth.orDivider")}
            </Text>
            <View
              style={[styles.authDividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Email Input Container */}
          <View
            ref={setInputGroupRef("login-email")}
            collapsable={false}
            style={[
              styles.inputCard,
              {
                backgroundColor: (colors as any).inputBackground ?? colors.surface,
              },
            ]}
          >
              <Mail size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.email")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => scrollFocusedGroupIntoView("login-email")}
              />
            </View>

          {/* Password Input Container */}
          <View
            ref={setInputGroupRef("login-password")}
            collapsable={false}
            style={[
              styles.inputCard,
              {
                backgroundColor: (colors as any).inputBackground ?? colors.surface,
              },
            ]}
          >
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => scrollFocusedGroupIntoView("login-password")}
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

          {/* Forgot Password Link */}
          <View
            style={[
              styles.forgotPasswordContainer,
              { alignItems: isRTL ? "flex-end" : "flex-start" },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push("/auth/forgot-password")}
            >
              <Text
                style={[
                  styles.forgotPasswordLink,
                  {
                    color: colors.primary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t("auth.forgotPassword")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <View
            style={[
              styles.checkboxContainer,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
              <Checkbox
                checked={agreedToTerms}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              />
            <View
              style={[
                styles.checkboxTextContainer,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text
                style={[
                  styles.checkboxText,
                  {
                    color: colors.textSecondary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t("auth.agreeToTerms").split(" ").slice(0, 2).join(" ")}{" "}
              </Text>
                <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
                <Text
                  style={[
                    styles.linkText,
                    {
                      color: colors.primary,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                    {t("auth.privacyPolicy")}
                  </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.checkboxText,
                  {
                    color: colors.textSecondary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {" "}
                {t("common.and")}{" "}
              </Text>
                <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                <Text
                  style={[
                    styles.linkText,
                    {
                      color: colors.primary,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                    {t("auth.termsOfUse")}
                  </Text>
                </TouchableOpacity>
            </View>
            </View>

          {/* Login Button */}
          {agreedToTerms ? (
            <LinearGradient
              colors={
                (colors as any).gradientButton || [
                  colors.primary,
                  colors.primary,
                ]
              }
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity
                style={styles.buttonInner}
                onPress={handleLogin}
                disabled={loading || !agreedToTerms}
              >
                <Text style={styles.buttonText}>
                  {loading ? t("common.loading") : t("auth.loginButton")}
                </Text>
                <LogIn size={20} color="white" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonDisabled,
                {
                  backgroundColor: colors.background,
                },
              ]}
              onPress={handleLogin}
              disabled={loading || !agreedToTerms}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.textSecondary },
                ]}
              >
                {loading ? t("common.loading") : t("auth.loginButton")}
              </Text>
              <LogIn
                size={20}
                color={colors.textSecondary}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          )}

            <Link href="/auth/register" asChild>
              <TouchableOpacity style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  {t("auth.noAccount")}
                  <Text style={[styles.link, { color: colors.primary }]}>
                    {" " + t("auth.register")}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </LoginFormRoot>

      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      <TermsOfUseModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140,
  },
  content: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: "transparent",
    overflow: "hidden",
    minHeight: Dimensions.get("window").height * 0.92,
  },
  backIconBtn: {
    position: "absolute",
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  supportIconBtn: {
    position: "absolute",
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: "center",
    marginBottom: 24,
  },
  authDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  authDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  authDividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  button: {
    borderRadius: 16,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonInner: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  link: {
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 32,
    gap: 8,
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  checkboxText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
  },
  forgotPasswordContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  forgotPasswordLink: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
