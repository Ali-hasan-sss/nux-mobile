import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { Text as AppText } from "@/components/AppText";

const appVersion =
  Constants.expoConfig?.version ?? Constants.manifest?.version ?? "1.0.0";

interface AboutAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutAppModal({ visible, onClose }: AboutAppModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

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
            {t("drawer.aboutApp")}
          </AppText>
          <View style={styles.row}>
            <AppText style={[styles.label, { color: colors.textSecondary }]}>
              {t("about.appNameLabel")}
            </AppText>
            <AppText style={[styles.value, { color: colors.text }]}>
              {t("about.appName")}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText style={[styles.label, { color: colors.textSecondary }]}>
              {t("about.versionLabel")}
            </AppText>
            <AppText style={[styles.value, { color: colors.text }]}>
              {appVersion}
            </AppText>
          </View>
          <View style={[styles.row, styles.lastRow]}>
            <AppText style={[styles.label, { color: colors.textSecondary }]}>
              {t("about.contactLabel")}
            </AppText>
            <AppText style={[styles.value, { color: colors.primary }]}>
              info@nuxapp.de
            </AppText>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <AppText style={styles.closeButtonText}>
              {t("common.close")}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
