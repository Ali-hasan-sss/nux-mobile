import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/AppText";
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const TAB_BAR_HEIGHT = 80;

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const p = (key: string) => t(`legal.privacy.${key}`);
  const contentBottomPadding = insets.bottom + TAB_BAR_HEIGHT;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('drawer.privacyPolicy')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: contentBottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('title')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('intro')}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('aboutApp')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('aboutAppContent')}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('informationWeCollect')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('informationWeCollectContent')}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('howWeUse')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('howWeUseContent')}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('informationSharing')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('informationSharingContent')}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('dataSecurity')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('dataSecurityContent')}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {p('contactUs')}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {p('contactUsContent')}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});