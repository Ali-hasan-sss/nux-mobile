import React, { useMemo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useTheme } from "@/hooks/useTheme";
import { Text as AppText } from "@/components/AppText";
import { getAppVersionInfo } from "@/lib/appVersion";

interface AboutAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutAppModal({ visible, onClose }: AboutAppModalProps) {
  const { t } = useAppTranslation();
  const { colors } = useTheme();
  const versionInfo = useMemo(() => getAppVersionInfo(), [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <AppText style={[styles.title, { color: colors.text }]}>
            {t("drawer.aboutApp", "About App")}
          </AppText>
          <View style={styles.row}>
            <AppText style={[styles.label, { color: colors.textSecondary }]}>
              {t("about.appNameLabel", "App name")}
            </AppText>
            <AppText style={[styles.value, { color: colors.text }]}>
              {t("about.appName", "NUX")}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText style={[styles.label, { color: colors.textSecondary }]}>
              {t("about.versionLabel", "Version")}
            </AppText>
            <AppText style={[styles.value, { color: colors.text }]}>
              {versionInfo.version}
            </AppText>
          </View>
          {versionInfo.build ? (
            <View style={styles.row}>
              <AppText style={[styles.label, { color: colors.textSecondary }]}>
                {t("about.buildLabel", "Build")}
              </AppText>
              <AppText style={[styles.value, { color: colors.text }]}>
                {versionInfo.build}
              </AppText>
            </View>
          ) : null}
          <View style={[styles.row, styles.lastRow]}>
            <AppText style={[styles.label, { color: colors.textSecondary }]}>
              {t("about.contactLabel", "Contact")}
            </AppText>
            <AppText style={[styles.value, { color: colors.primary }]}>
              {t("about.contactEmail", "info@nuxapp.de")}
            </AppText>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <AppText style={styles.closeButtonText}>
              {t("common.close", "Close")}
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    marginBottom: 12,
  },
  lastRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
