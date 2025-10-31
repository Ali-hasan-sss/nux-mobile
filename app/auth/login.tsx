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
} from "react-native";
import { Link, router } from "expo-router";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock } from "lucide-react-native";
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
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { colors } = useTheme();

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
      <LinearGradient colors={colors.gradient} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("home.title")}
            </Text>

            <View style={[styles.form, { backgroundColor: colors.surface }]}>
              <View style={styles.inputContainer}>
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

              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t("auth.password")}
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  checked={agreedToTerms}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                />
                <Text
                  style={[styles.checkboxText, { color: colors.textSecondary }]}
                >
                  {t("auth.agreeToTerms").split(" ").slice(0, 4).join(" ")}{" "}
                  <TouchableOpacity
                    onPress={() => setPrivacyModalVisible(true)}
                  >
                    <Text style={[styles.linkText, { color: colors.primary }]}>
                      {t("auth.privacyPolicy")}
                    </Text>
                  </TouchableOpacity>{" "}
                  {t("common.and")}{" "}
                  <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                    <Text style={[styles.linkText, { color: colors.primary }]}>
                      {t("auth.termsOfUse")}
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: agreedToTerms
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={handleLogin}
                disabled={loading || !agreedToTerms}
              >
                <Text style={styles.buttonText}>
                  {loading ? t("common.loading") : t("auth.loginButton")}
                </Text>
              </TouchableOpacity>

              <Link href="/auth/register" asChild>
                <TouchableOpacity style={styles.linkContainer}>
                  <Text
                    style={[styles.linkText, { color: colors.textSecondary }]}
                  >
                    {t("auth.noAccount")}
                    <Text style={[styles.link, { color: colors.primary }]}>
                      {" " + t("auth.register")}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

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
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "white",
  },
  form: {
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 20,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    paddingVertical: 8,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
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
    gap: 8,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
