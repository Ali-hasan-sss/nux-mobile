import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Animated, Dimensions, BackHandler } from "react-native";
import { Text } from "@/components/AppText";
import { Link, router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  User,
  CheckCircle,
  Headphones,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomAlert } from "@/components/CustomAlert";
import { Checkbox } from "@/components/Checkbox";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";
import { registerUser } from "@/store/slices/authSlice";
import { getProfile } from "@/store/slices/profileSlice";
import type { AppDispatch, RootState } from "@/store/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TOTAL_STEPS = 2; // 1: Email + name, 2: Password (like website); verify email after signup

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === "ar";

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

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [direction, setDirection] = useState<"next" | "back">("next");

  // Password validation
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push(t("auth.passwordMinLength"));
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push(t("auth.passwordRequiresUppercase"));
    }

    if (!/[0-9]/.test(pwd)) {
      errors.push(t("auth.passwordRequiresNumber"));
    }

    return errors;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      const errors = validatePassword(text);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }

    // Also validate confirm password if it has a value
    if (confirmPassword.length > 0) {
      if (text !== confirmPassword) {
        setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text.length > 0) {
      if (text !== password) {
        setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
      } else {
        setConfirmPasswordError("");
      }
    } else {
      setConfirmPasswordError("");
    }
  };

  // Animation effect when step changes
  useEffect(() => {
    const slideValue = direction === "next" ? -SCREEN_WIDTH : SCREEN_WIDTH;

    // Reset position
    slideAnim.setValue(direction === "next" ? SCREEN_WIDTH : -SCREEN_WIDTH);

    // Animate to center
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step, direction]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!email.trim()) {
        setErrorAlert({
          visible: true,
          message: t("common.pleaseEnterEmail"),
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorAlert({
          visible: true,
          message: t("common.pleaseEnterValidEmail"),
        });
        return;
      }
      setDirection("next");
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!password || !confirmPassword) {
      setErrorAlert({
        visible: true,
        message: t("common.pleaseFillAllFields"),
      });
      return;
    }

    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      setErrorAlert({
        visible: true,
        message: passwordValidationErrors[0],
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorAlert({
        visible: true,
        message: t("auth.passwordsDoNotMatch"),
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
      await dispatch(
        registerUser({
          email: email.trim(),
          password,
          fullName: fullName.trim() || undefined,
        })
      ).unwrap();

      await dispatch(getProfile()).unwrap();

      // Like website: go to verify-email screen after signup
      router.replace({
        pathname: "/auth/verify-email",
        params: { email: email.trim() },
      });
    } catch (error: any) {
      setErrorAlert({
        visible: true,
        message: error.message || t("common.registrationFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection("back");
      setStep(step - 1);
    }
  };

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={[styles.keyboardView, { backgroundColor: "transparent" }]}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
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

            {/* Step indicator: always left-to-right (1 then 2) */}
            <View style={styles.stepIndicator}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.stepIndicatorItem}>
                  <View
                    style={[
                      styles.stepDot,
                      i <= step
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.background },
                    ]}
                  >
                    {i < step ? (
                      <CheckCircle size={16} color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.stepDotText,
                          { color: i <= step ? "#fff" : colors.textSecondary },
                        ]}
                      >
                        {i}
                      </Text>
                    )}
                  </View>
                  {i < 2 && (
                    <View
                      style={[
                        styles.stepLine,
                        { backgroundColor: i < step ? colors.primary : colors.background },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Step 1: Email + Full name (like website) */}
            {step === 1 && (
              <Animated.View
                style={[
                  styles.stepContainer,
                  {
                    transform: [
                      {
                        translateX: slideAnim.interpolate({
                          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                          outputRange: isRTL
                            ? [SCREEN_WIDTH, 0, -SCREEN_WIDTH]
                            : [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                        }),
                      },
                    ],
                  },
                ]}
              >
             

                {/* Full name (optional) */}
                <View
                  style={[
                    styles.inputCard,
                    { backgroundColor: (colors as any).inputBackground ?? colors.surface },
                  ]}
                >
                  <User size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.fullNameOptional")}
                    placeholderTextColor={isDark ? colors.textSecondary : "#6b7280"}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
   {/* Email Input */}
               <View
                  style={[
                    styles.inputCard,
                    { backgroundColor: (colors as any).inputBackground ?? colors.surface },
                  ]}
                >
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.email")}
                    placeholderTextColor={isDark ? colors.textSecondary : "#6b7280"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {/* Next Button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: email
                        ? (colors as any).gradientButton
                          ? undefined
                          : colors.primary
                        : colors.background,
                    },
                  ]}
                  onPress={handleNextStep}
                  disabled={!email}
                >
                  {email && (colors as any).gradientButton ? (
                    <LinearGradient
                      colors={
                        (colors as any).gradientButton || [
                          colors.primary,
                          colors.primary,
                        ]
                      }
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  ) : null}
                  <View style={styles.buttonInner}>
                    <Text
                      style={[
                        styles.buttonText,
                        { color: isDark ? "#fff" : (colors.text || "#1a1a1a") },
                      ]}
                    >
                      {t("common.next")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Step 2: Password (like website); verify email after signup */}
            {step === 2 && (
              <Animated.View
                style={[
                  styles.stepContainer,
                  {
                    transform: [
                      {
                        translateX: slideAnim.interpolate({
                          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                          outputRange: isRTL
                            ? [SCREEN_WIDTH, 0, -SCREEN_WIDTH]
                            : [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Password Input Container */}
                <View
                  style={[
                    styles.inputCard,
                    { backgroundColor: (colors as any).inputBackground ?? colors.surface },
                  ]}
                >
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.password")}
                    placeholderTextColor={isDark ? colors.textSecondary : "#6b7280"}
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                    {showPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Validation Errors */}
                {passwordErrors.length > 0 && (
                  <View
                    style={[
                      styles.errorContainer,
                      { alignItems: isRTL ? "flex-end" : "flex-start" },
                    ]}
                  >
                    {passwordErrors.map((error, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.errorText,
                          {
                            color: "#EF4444",
                            textAlign: isRTL ? "right" : "left",
                          },
                        ]}
                      >
                        {error}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Confirm Password Input Container */}
                <View
                  style={[
                    styles.inputCard,
                    { backgroundColor: (colors as any).inputBackground ?? colors.surface },
                  ]}
                >
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.confirmPassword")}
                    placeholderTextColor={isDark ? colors.textSecondary : "#6b7280"}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((p) => !p)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Error */}
                {confirmPasswordError && (
                  <View
                    style={[
                      styles.errorContainer,
                      { alignItems: isRTL ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.errorText,
                        {
                          color: "#EF4444",
                          textAlign: isRTL ? "right" : "left",
                        },
                      ]}
                    >
                      {confirmPasswordError}
                    </Text>
                  </View>
                )}

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
                    <TouchableOpacity
                      onPress={() => setPrivacyModalVisible(true)}
                    >
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
                    <TouchableOpacity
                      onPress={() => setTermsModalVisible(true)}
                    >
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

                {/* Back and Register Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.backButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={handleBack}
                  >
                    <ArrowLeft
                      size={20}
                      color={colors.text}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[styles.backButtonText, { color: colors.text }]}
                    >
                      {t("common.back")}
                    </Text>
                  </TouchableOpacity>

                  {agreedToTerms ? (
                    <LinearGradient
                      colors={
                        (colors as any).gradientButton || [
                          colors.primary,
                          colors.primary,
                        ]
                      }
                      style={[styles.button, styles.buttonFlex]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <TouchableOpacity
                        style={styles.buttonInner}
                        onPress={handleRegister}
                        disabled={loading || !agreedToTerms}
                      >
                        <Text style={styles.buttonText}>
                          {loading
                            ? t("common.loading")
                            : t("auth.registerButton")}
                        </Text>
                        <UserPlus
                          size={20}
                          color="white"
                          style={{ marginLeft: 8 }}
                        />
                      </TouchableOpacity>
                    </LinearGradient>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.buttonFlex,
                        styles.buttonDisabled,
                        {
                          backgroundColor: colors.background,
                        },
                      ]}
                      onPress={handleRegister}
                      disabled={loading || !agreedToTerms}
                    >
                      <Text
                        style={[styles.buttonText, { color: colors.textSecondary }]}
                      >
                        {loading
                          ? t("common.loading")
                          : t("auth.registerButton")}
                      </Text>
                      <UserPlus
                        size={20}
                        color={colors.textSecondary}
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}

            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.linkContainer}>
                <Text
                  style={[styles.linkText, { color: colors.textSecondary }]}
                >
                  {t("auth.hasAccount")}
                  <Text style={[styles.link, { color: colors.primary }]}>
                    {" " + t("auth.login")}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "transparent",
    overflow: "hidden",
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
  stepContainer: {
    width: "100%",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepIndicatorRTL: {
    flexDirection: "row-reverse",
  },
  stepIndicatorItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepLine: {
    width: 48,
    height: 4,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: "center",
    marginBottom: 40,
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
    overflow: "hidden",
  },
  buttonFlex: {
    flex: 1,
    marginLeft: 12,
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
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
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
  errorContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
