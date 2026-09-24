import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Text } from "@/components/AppText";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { X } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import {
  resolveLegalLocale,
  type LegalPageType,
} from "@/config/website";
import { fetchPublicLegalHtml } from "@/store/services/legalClientService";
import { buildLegalDocumentHtml } from "@/lib/legalWebViewHtml";

interface LegalWebViewModalProps {
  type: LegalPageType;
  visible: boolean;
  onClose: () => void;
}

export function LegalWebViewModal({
  type,
  visible,
  onClose,
}: LegalWebViewModalProps) {
  const { t, i18n } = useAppTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlDocument, setHtmlDocument] = useState<string | null>(null);

  const title =
    type === "privacy"
      ? t("auth.privacyPolicy", "Privacy Policy")
      : t("auth.termsOfUse", "Terms of Use");

  const locale = resolveLegalLocale(i18n.language);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHtmlDocument(null);
    try {
      const content = await fetchPublicLegalHtml(type, i18n.language);
      const doc = buildLegalDocumentHtml({
        title,
        bodyHtml: content,
        locale,
        isDark,
      });
      if (!content.trim()) {
        setError(
          t("legal.empty", "Content is not available yet.")
        );
        return;
      }
      setHtmlDocument(doc);
    } catch (e: unknown) {
      const message = t(
        "legal.loadError",
        "Failed to load document. Check that the backend is running."
      );
      setError(message);
      if (__DEV__) {
        console.warn("[LegalWebView] load failed:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [type, i18n.language, title, locale, isDark, t]);

  useEffect(() => {
    if (visible) {
      void loadContent();
    } else {
      setHtmlDocument(null);
      setError(null);
      setLoading(true);
    }
  }, [visible, loadContent]);

  const webViewSource = useMemo(
    () => (htmlDocument ? { html: htmlDocument } : undefined),
    [htmlDocument]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel={t("legal.close", "Close")}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {!loading && error && !htmlDocument && (
          <ScrollView
            contentContainerStyle={styles.errorBox}
            style={styles.flex}
          >
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => void loadContent()}
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.retryBtnText}>
                {t("common.retry", "Retry")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {!loading && webViewSource && (
          <WebView
            key={`${type}-${locale}-${isDark ? "d" : "l"}`}
            source={webViewSource}
            style={styles.webview}
            originWhitelist={["*"]}
            javaScriptEnabled={false}
            showsVerticalScrollIndicator
            onError={(e) => {
              if (__DEV__) {
                console.warn("[LegalWebView] render error:", e.nativeEvent);
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
