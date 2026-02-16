import React, { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Text } from "@/components/AppText";
import { router, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Mail, Loader2 } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { CustomAlert } from "@/components/CustomAlert";
import { authService } from "@/store/services/authService";
import { setEmailVerified, logout } from "@/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isRTL = i18n.language === "ar";

  const email = emailParam || user?.email || "";
  const emailLocked = !!(emailParam || user?.email);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccessVisible, setResendSuccessVisible] = useState(false);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length > 1) {
      const chars = digits.slice(0, CODE_LENGTH).split("");
      const newCode = Array(CODE_LENGTH).fill("");
      chars.forEach((c, i) => {
        newCode[i] = c;
      });
      setCode(newCode);
      const nextFocus = chars.length >= CODE_LENGTH ? CODE_LENGTH - 1 : chars.length;
      requestAnimationFrame(() => {
        codeInputRefs.current[nextFocus]?.focus();
      });
      return;
    }
    if (digits.length === 1) {
      const newCode = [...code];
      newCode[index] = digits;
      setCode(newCode);
      if (index < CODE_LENGTH - 1) {
        requestAnimationFrame(() => {
          codeInputRefs.current[index + 1]?.focus();
        });
      }
      return;
    }
    if (value === "") {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      if (index > 0) {
        requestAnimationFrame(() => {
          codeInputRefs.current[index - 1]?.focus();
        });
      }
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && code[index] === "" && index > 0) {
      requestAnimationFrame(() => {
        codeInputRefs.current[index - 1]?.focus();
      });
    }
  };

  const getCodeString = () => code.join("");

  const handleVerify = async () => {
    setError(null);
    const codeStr = getCodeString();
    if (!email) {
      setError(t("auth.verifyCodeRequired"));
      return;
    }
    if (codeStr.length !== CODE_LENGTH) {
      setError(t("auth.verifyCodeRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await authService.verifyEmail(email, codeStr);
      setSuccess(true);
      dispatch(setEmailVerified());
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || t("auth.verifyCodeInvalid")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setResending(true);
    try {
      await authService.sendVerificationCode(email);
      setResendSuccessVisible(true);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await dispatch(logout());
    router.replace("/auth/login");
  };

  if (!email) {
    return (
      <View style={[styles.centered, { backgroundColor: "transparent" }]}>
        <Text style={{ color: colors.text }}>{t("auth.verifyCodeRequired")}</Text>
        <TouchableOpacity style={styles.link} onPress={handleBackToLogin}>
          <Text style={{ color: colors.primary }}>{t("auth.backToLogin")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <CustomAlert
        visible={resendSuccessVisible}
        type="success"
        title={t("common.success")}
        message={t("auth.verificationCodeSent")}
        confirmText={t("common.ok")}
        onConfirm={() => setResendSuccessVisible(false)}
      />
      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          <Text style={[styles.title, { color: colors.text }]}>
            {t("auth.verifyEmailTitle")}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t("auth.verifyEmailDescription")}
          </Text>

          {success ? (
            <View style={[styles.successCard, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.5)" }]}>
              <Text style={[styles.successText, { color: colors.text }]}>
                {t("auth.emailVerifiedSuccess")}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.inputCard, { backgroundColor: (colors as any).inputBackground ?? colors.surface }]}>
                <Mail size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  editable={false}
                  placeholder={t("auth.email")}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={[styles.codeRow, styles.codeRowLTR]}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    style={[
                      styles.codeInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: (colors as any).inputBackground ?? colors.surface,
                        writingDirection: "ltr",
                        textAlign: "center",
                      },
                    ]}
                    value={digit}
                    onChangeText={(v) => handleCodeChange(index, v)}
                    onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  submitting && styles.primaryButtonDisabled,
                ]}
                onPress={handleVerify}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 size={20} color="#fff" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.primaryButtonText}>
                  {submitting ? t("common.loading") : t("auth.verifyEmail")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleResend}
                disabled={resending || !email}
              >
                {resending ? (
                  <Loader2 size={18} color={colors.primary} style={{ marginRight: 6 }} />
                ) : null}
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  {resending ? t("common.loading") : t("auth.resendCode")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={handleBackToLogin}
              >
                <Text style={[styles.backLinkText, { color: colors.primary }]}>
                  {t("auth.backToLogin")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  codeRowLTR: {
    flexDirection: "row",
  },
  codeInput: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  successCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  successText: {
    fontSize: 15,
    textAlign: "center",
  },
  link: {
    marginTop: 16,
  },
});
