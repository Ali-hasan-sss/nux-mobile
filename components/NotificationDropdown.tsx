import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, CheckCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationDropdownProps {
  visible: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Promotion Available',
    message: '20% off on all coffee drinks at Café Central',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: 'Points Earned',
    message: 'You earned 50 meal points at Pizza Palace',
    time: '1 day ago',
    read: false,
  },
  {
    id: '3',
    title: 'Gift Received',
    message: 'John sent you 100 drink points',
    time: '2 days ago',
    read: true,
  },
];

export function NotificationDropdown({
  visible,
  onClose,
}: NotificationDropdownProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleMarkAllRead = () => {
    // Handle marking all notifications as read
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.read
            ? colors.surface
            : colors.primary + '10',
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {notification.title}
        </Text>
        <Text
          style={[styles.notificationMessage, { color: colors.textSecondary }]}
        >
          {notification.message}
        </Text>
        <Text
          style={[styles.notificationTime, { color: colors.textSecondary }]}
        >
          {notification.time}
        </Text>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dropdown, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('notifications.title')}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={styles.markAllButton}
              >
                <CheckCheck size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {mockNotifications.length > 0 ? (
              mockNotifications.map(renderNotification)
            ) : (
              <View style={styles.emptyState}>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  {t('notifications.noNotifications')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 0,
  },

  dropdown: {
    flex: 1,
    borderRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
  },

  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
