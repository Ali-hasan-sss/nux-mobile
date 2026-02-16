import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Text } from "@/components/AppText";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Mail, Loader2 } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { CustomAlert } from "@/components/CustomAlert";
import { authService } from "@/store/services/authService";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleSendCode = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("auth.emailRequired"));
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(trimmed);
      setPendingEmail(trimmed);
      setSuccessVisible(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || t("auth.resetRequestFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setSuccessVisible(false);
    router.push({
      pathname: "/auth/reset-password",
      params: { email: pendingEmail },
    });
  };

  return (
    <>
      <CustomAlert
        visible={successVisible}
        type="success"
        title={t("common.success")}
        message={t("auth.resetCodeSent")}
        confirmText={t("common.continue")}
        onConfirm={handleSuccessConfirm}
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
            {t("auth.forgotPasswordTitle")}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t("auth.forgotPasswordDescription")}
          </Text>

          <View
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
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.email")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {error ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: "rgba(239,68,68,0.15)" },
              ]}
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              loading && styles.primaryButtonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={20} color="#fff" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.primaryButtonText}>
              {loading ? t("common.loading") : t("auth.sendResetCode")}
            </Text>
          </TouchableOpacity>

          <Link href="/auth/login" asChild>
            <TouchableOpacity style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.primary }]}>
                {t("auth.backToLogin")}
              </Text>
            </TouchableOpacity>
          </Link>
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
