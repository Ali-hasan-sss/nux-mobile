import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Mail, MapPin, Send, Building2 } from "lucide-react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useAlert } from "@/contexts/AlertContext";
import { sendContactMessage } from "@/api/contactApi";

const TAB_BAR_HEIGHT = 80;

export default function ContactScreen() {
  const { t } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useAlert();
  const user = useSelector((state: RootState) => state.auth.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.fullName) setName(user.fullName);
  }, [user?.email, user?.fullName]);

  const handleSend = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      showToast({
        message: t("common.pleaseFillAllFields"),
        type: "error",
      });
      return;
    }
    setSending(true);
    try {
      await sendContactMessage({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject || t("contact.subjectPlaceholder"),
        message: trimmedMessage,
      });
      showToast({ message: t("contact.successMessage"), type: "success" });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      const isNetwork =
        err?.code === "ECONNABORTED" ||
        err?.message === "Network Error" ||
        err?.code === "ERR_NETWORK";
      const msg = serverMsg
        ? String(serverMsg)
        : isNetwork
          ? t("contact.errorMessage")
          : t("contact.errorMessage");
      showToast({ message: msg, type: "error" });
    } finally {
      setSending(false);
    }
  };

  const font = { fontFamily: defaultFontFamily };
  const contentBottomPadding = insets.bottom + 24;
  const headerHeight = insets.top + 56;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }, font]}>
          {t("contact.title")}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }, font]}
          >
            {t("contact.subtitle")}
          </Text>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.formSectionTitle, { color: colors.text }, font]}
            >
              {t("contact.formSectionTitle")}
            </Text>
            <Text style={[styles.inputLabel, { color: colors.text }, font]}>
              {t("contact.nameLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
                font,
              ]}
              value={name}
              onChangeText={setName}
              placeholder={t("contact.namePlaceholder")}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.inputLabel, { color: colors.text }, font]}>
              {t("contact.emailLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
                font,
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={t("contact.emailPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.inputLabel, { color: colors.text }, font]}>
              {t("contact.subjectLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
                font,
              ]}
              value={subject}
              onChangeText={setSubject}
              placeholder={t("contact.subjectPlaceholder")}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.inputLabel, { color: colors.text }, font]}>
              {t("contact.messageLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: colors.text, borderColor: colors.border },
                font,
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={t("contact.messagePlaceholder")}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                sending && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Send size={20} color="#fff" />
                  <Text style={[styles.sendButtonText, font]}>
                    {t("contact.sendButton")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: colors.text }, font]}>
              {t("contact.contactInfoTitle")}
            </Text>
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.primary + "18" },
                ]}
              >
                <Mail size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.textSecondary },
                    font,
                  ]}
                >
                  {t("contact.contactEmailLabel")}
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.primary }, font]}
                >
                  {t("contact.emailValue")}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.primary + "18" },
                ]}
              >
                <MapPin size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.textSecondary },
                    font,
                  ]}
                >
                  {t("contact.addressLabel")}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }, font]}>
                  {t("contact.addressValue")}
                </Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.primary + "18" },
                ]}
              >
                <Building2 size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.textSecondary },
                    font,
                  ]}
                >
                  {t("contact.companyLabel")}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }, font]}>
                  {t("contact.companyValue")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    marginBottom: 0,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  formCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
