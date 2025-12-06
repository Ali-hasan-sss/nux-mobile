import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Link, router } from "expo-router";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  ArrowRight,
  ArrowLeft,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { Checkbox } from "@/components/Checkbox";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";
import { registerUser } from "@/store/slices/authSlice";
import { getProfile } from "@/store/slices/profileSlice";
import type { AppDispatch } from "@/store/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RegisterScreen() {
  const [step, setStep] = useState(1); // 1: Email, 2: Verification, 3: Password
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
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
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isRTL = i18n.language === "ar";
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [direction, setDirection] = useState<"next" | "back">("next");

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length > 1) {
      // Handle paste - distribute characters from left to right
      const chars = numericValue.slice(0, 6).split("");
      const newCode = [...verificationCode];

      // Find the first empty box starting from the clicked index
      let startIndex = index;
      for (let i = 0; i < index; i++) {
        if (newCode[i] === "") {
          startIndex = i;
          break;
        }
      }

      // Fill boxes from left to right
      chars.forEach((char, idx) => {
        const targetIndex = startIndex + idx;
        if (targetIndex < 6) {
          newCode[targetIndex] = char;
        }
      });

      setVerificationCode(newCode);

      // Focus on the next empty box or the last box
      const nextEmptyIndex = newCode.findIndex(
        (val, idx) => idx >= startIndex && val === ""
      );
      const focusIndex =
        nextEmptyIndex !== -1
          ? nextEmptyIndex
          : Math.min(startIndex + chars.length, 5);
      if (focusIndex < 6 && codeInputRefs.current[focusIndex]) {
        codeInputRefs.current[focusIndex]?.focus();
      }
    } else {
      // Single character input
      const newCode = [...verificationCode];

      // If current box has value and we're typing, move to next
      if (newCode[index] !== "" && numericValue !== "") {
        // Find first empty box from left
        const firstEmpty = newCode.findIndex((val) => val === "");
        if (firstEmpty !== -1) {
          newCode[firstEmpty] = numericValue;
          setVerificationCode(newCode);
          if (codeInputRefs.current[firstEmpty]) {
            codeInputRefs.current[firstEmpty]?.focus();
          }
          return;
        }
      }

      newCode[index] = numericValue;
      setVerificationCode(newCode);

      // Move to next box if value entered
      if (numericValue !== "" && index < 5) {
        const nextEmpty = newCode.findIndex(
          (val, idx) => idx > index && val === ""
        );
        if (nextEmpty !== -1 && codeInputRefs.current[nextEmpty]) {
          codeInputRefs.current[nextEmpty]?.focus();
        } else if (index < 5 && codeInputRefs.current[index + 1]) {
          codeInputRefs.current[index + 1]?.focus();
        }
      }
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && verificationCode[index] === "") {
      // Move to previous box on backspace if current is empty
      if (index > 0 && codeInputRefs.current[index - 1]) {
        codeInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleCodeFocus = (index: number) => {
    // If there's an empty box before this one, focus on it instead
    const emptyBefore = verificationCode.findIndex(
      (val, idx) => idx < index && val === ""
    );
    if (emptyBefore !== -1 && codeInputRefs.current[emptyBefore]) {
      codeInputRefs.current[emptyBefore]?.focus();
    }
  };

  const getVerificationCodeString = () => {
    return verificationCode.join("");
  };

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
      if (!email) {
        Alert.alert(t("common.error"), "Please enter your email");
        return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert(t("common.error"), "Please enter a valid email");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const code = getVerificationCodeString();
      // Allow 000000 to bypass verification (temporary)
      if (code === "000000") {
        setStep(3);
      } else if (code.length !== 6) {
        Alert.alert(
          t("common.error"),
          "Please enter the 6-digit verification code"
        );
        return;
      } else {
        // In the future, verify the code here
        setStep(3);
      }
    }
  };

  const handleRegister = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(
        t("common.error"),
        t("common.pleaseFillAllFields") || "Please fill in all fields"
      );
      return;
    }

    // Validate password
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      Alert.alert(t("common.error"), passwordValidationErrors[0]);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDoNotMatch"));
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(
        t("common.error"),
        "Please agree to the terms and conditions"
      );
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        registerUser({ email, password, fullName: "New User" })
      ).unwrap();

      await dispatch(getProfile()).unwrap();

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      // Reset verification code when going back from step 2 to step 1
      if (step === 2) {
        setVerificationCode(["", "", "", "", "", ""]);
      }
      setStep(step - 1);
    }
  };

  // Reset verification code when email changes in step 1
  const handleEmailChange = (text: string) => {
    setEmail(text);
    // If we're in step 1 and email changes, reset verification code
    if (step === 1) {
      setVerificationCode(["", "", "", "", "", ""]);
    }
  };

  return (
    <>
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
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Step 1: Email */}
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
                {/* Email Input Container */}
                <View
                  style={[
                    styles.inputCard,
                    { backgroundColor: "rgba(26, 31, 58, 0.95)" },
                  ]}
                >
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.email")}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={handleEmailChange}
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
                    <Text style={styles.buttonText}>{t("common.next")}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Step 2: Verification Code */}
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
                <Text
                  style={[
                    styles.stepTitle,
                    { color: colors.text, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("auth.verificationCode")}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    {
                      color: colors.textSecondary,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t("auth.enterVerificationCode")}
                </Text>
                {/* Display email */}
                <Text
                  style={[
                    styles.emailDisplay,
                    {
                      color: colors.textSecondary,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t("auth.codeSentTo")} {email}
                </Text>

                {/* Verification Code Input - 6 Boxes */}
                <View style={styles.codeContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        codeInputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.codeBox,
                        {
                          backgroundColor: "rgba(26, 31, 58, 0.95)",
                          borderColor: verificationCode[index]
                            ? colors.primary
                            : colors.border,
                          color: colors.text,
                        },
                      ]}
                      value={verificationCode[index]}
                      onChangeText={(text) => handleCodeChange(index, text)}
                      onKeyPress={({ nativeEvent }) =>
                        handleCodeKeyPress(index, nativeEvent.key)
                      }
                      onFocus={() => handleCodeFocus(index)}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Resend Code Section */}
                <View
                  style={[
                    styles.resendCodeContainer,
                    { alignItems: isRTL ? "flex-end" : "flex-start" },
                  ]}
                >
                  <Text
                    style={[
                      styles.resendCodeText,
                      {
                        color: colors.textSecondary,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {t("auth.didNotReceiveCode")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // TODO: Implement resend code functionality
                    }}
                  >
                    <Text
                      style={[
                        styles.resendCodeLink,
                        {
                          color: colors.primary,
                          textAlign: isRTL ? "right" : "left",
                        },
                      ]}
                    >
                      {t("auth.resendCode")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Back and Next Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.backButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={handleBack}
                  >
                    <Text
                      style={[styles.backButtonText, { color: colors.text }]}
                    >
                      {t("common.back")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.buttonFlex,
                      {
                        backgroundColor:
                          getVerificationCodeString().length === 6
                            ? (colors as any).gradientButton
                              ? undefined
                              : colors.primary
                            : colors.background,
                      },
                    ]}
                    onPress={handleNextStep}
                    disabled={getVerificationCodeString().length !== 6}
                  >
                    {getVerificationCodeString().length === 6 &&
                    (colors as any).gradientButton ? (
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
                          getVerificationCodeString().length === 6
                            ? {}
                            : { color: "rgba(255, 255, 255, 0.5)" },
                        ]}
                      >
                        {t("common.next")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
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
                    { backgroundColor: "rgba(26, 31, 58, 0.95)" },
                  ]}
                >
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.password")}
                    placeholderTextColor={colors.textSecondary}
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
                    { backgroundColor: "rgba(26, 31, 58, 0.95)" },
                  ]}
                >
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("auth.confirmPassword")}
                    placeholderTextColor={colors.textSecondary}
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
                        style={[styles.buttonText, styles.buttonTextDisabled]}
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
  stepContainer: {
    width: "100%",
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
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  codeBox: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  emailDisplay: {
    fontSize: 12,
    marginBottom: 24,
    fontStyle: "italic",
  },
  resendCodeContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  resendCodeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  resendCodeLink: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
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
  buttonTextDisabled: {
    color: "rgba(255, 255, 255, 0.5)",
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
