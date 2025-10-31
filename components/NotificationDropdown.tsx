import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { X, CheckCheck } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationDropdownProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationDropdown({
  visible,
  onClose,
}: NotificationDropdownProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const {
    notifications,
    isLoading,
    pagination,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load notifications when modal opens
  useEffect(() => {
    if (visible) {
      loadNotifications(1, 10, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications(1, 10, false);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    // Check if we have more pages to load
    if (
      loadingMore ||
      isLoading ||
      pagination.currentPage >= pagination.totalPages
    ) {
      return;
    }

    setLoadingMore(true);
    try {
      await loadNotifications(pagination.currentPage + 1, 10, true);
    } catch (error) {
      console.error("Failed to load more notifications:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationPress = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return i18n.language === "ar" ? "الآن" : "now";
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return i18n.language === "ar"
          ? `منذ ${diffInMinutes} دقيقة`
          : `${diffInMinutes}m ago`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return i18n.language === "ar"
          ? `منذ ${diffInHours} ساعة`
          : `${diffInHours}h ago`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return i18n.language === "ar"
          ? `منذ ${diffInDays} يوم`
          : `${diffInDays}d ago`;
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      return i18n.language === "ar"
        ? `منذ ${diffInMonths} شهر`
        : `${diffInMonths}mo ago`;
    } catch (error) {
      return dateString;
    }
  };

  const renderNotification = (notification: any) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.isRead
            ? colors.surface
            : colors.primary + "10",
        },
      ]}
      onPress={() => handleNotificationPress(notification.id)}
    >
      <View style={styles.notificationContent}>
        <Text
          style={[styles.notificationTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        <Text
          style={[styles.notificationMessage, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {notification.body}
        </Text>
        <Text
          style={[styles.notificationTime, { color: colors.textSecondary }]}
        >
          {formatTime(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead && (
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
              {t("notifications.title")}
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

          <FlatList
            data={notifications}
            renderItem={({ item }) => renderNotification(item)}
            keyExtractor={(item) => item.id.toString()}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />
            )}
            ListEmptyComponent={
              isLoading && !refreshing ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: colors.textSecondary, marginTop: 12 },
                    ]}
                  >
                    {t("common.loading")}...
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    {t("notifications.noNotifications")}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.footerLoaderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("common.loading")}...
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 0,
  },

  dropdown: {
    flex: 1,
    borderRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markAllButton: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
  },

  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  separator: {
    height: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  loadingState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  footerLoader: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoaderText: {
    fontSize: 14,
    marginTop: 8,
  },
});
