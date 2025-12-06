import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { Checkbox } from "@/components/Checkbox";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";
import { loginUser } from "@/store/slices/authSlice";
import { getProfile } from "@/store/slices/profileSlice";
import type { AppDispatch } from "@/store/store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isRTL = i18n.language === "ar";

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), "Please fill in all fields");
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
      // تسجيل الدخول
      await dispatch(loginUser({ email, password })).unwrap();

      // جلب بيانات المستخدم بعد نجاح تسجيل الدخول
      console.log("🔄 Fetching user profile after login...");
      await dispatch(getProfile()).unwrap();

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || "Login failed");
    } finally {
      setLoading(false);
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
        <View style={styles.content}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

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
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

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
                onChangeText={setPassword}
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

          {/* Forgot Password Link */}
          <View
            style={[
              styles.forgotPasswordContainer,
              { alignItems: isRTL ? "flex-end" : "flex-start" },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                // TODO: Implement forgot password functionality
              }}
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
              <Text style={[styles.buttonText, styles.buttonTextDisabled]}>
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
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
  buttonTextDisabled: {
    color: "rgba(255, 255, 255, 0.5)",
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
