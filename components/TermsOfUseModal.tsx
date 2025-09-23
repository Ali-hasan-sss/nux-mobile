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

interface TermsOfUseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsOfUseModal({ visible, onClose }: TermsOfUseModalProps) {
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
            {t('drawer.termsOfUse')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Terms of Use
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Welcome to our loyalty rewards application. By using our service, you agree to comply with and be bound by the following terms and conditions.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Acceptance of Terms
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Use License
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            User Account
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            You are responsible for safeguarding the password and for maintaining the confidentiality of your account. You agree not to disclose your password to any third party.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Loyalty Points
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Loyalty points earned through this application have no cash value and cannot be transferred or sold. Points may expire according to the terms set by participating restaurants.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Prohibited Uses
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            You may not use our service for any unlawful purpose, to violate any laws, to infringe upon intellectual property rights, or to transmit any harmful or malicious code.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Limitation of Liability
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            In no event shall the company be liable for any damages arising out of the use or inability to use the materials on this application.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Information
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            If you have any questions about these Terms of Use, please contact us at terms@loyaltyapp.com
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