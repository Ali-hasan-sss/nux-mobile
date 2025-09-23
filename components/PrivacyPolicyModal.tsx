import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            This Privacy Policy describes how we collect, use, and protect your personal information when you use our loyalty rewards application.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Information We Collect
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We collect information you provide directly to us, such as when you create an account, make purchases, or contact us for support. This may include your name, email address, phone number, and payment information.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How We Use Your Information
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotional offers.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Information Sharing
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Data Security
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Us
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            If you have any questions about this Privacy Policy, please contact us at privacy@loyaltyapp.com
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