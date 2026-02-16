import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { X, CheckCheck } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Notification } from "@/store/services/notificationService";
import { TFunction } from "i18next";

interface NotificationDropdownProps {
  visible: boolean;
  onClose: () => void;
}

function getCurrencyLabel(currencyType: string, t: TFunction): string {
  if (currencyType === "balance") return t("notifications.currencyBalance");
  if (currencyType === "stars_meal")
    return t("notifications.currencyMealPoints");
  if (currencyType === "stars_drink")
    return t("notifications.currencyDrinkPoints");
  return currencyType;
}

/** Returns translated title and body for known notification types; otherwise original. */
function getTranslatedNotification(
  notification: { type: string; title: string; body: string },
  t: TFunction,
): { title: string; body: string } {
  const { type, title, body } = notification;

  // STARS: "You received 1  stars meal & 0 stars drink from Restaurant Name"
  if (type === "STARS") {
    const starsMatch = body.match(
      /You received (\d+)\s*stars?\s*meal\s*&\s*(\d+)\s*stars?\s*drink from (.+)/i,
    );
    if (starsMatch) {
      const meal = parseInt(starsMatch[1], 10);
      const drink = parseInt(starsMatch[2], 10);
      const restaurant = starsMatch[3].trim();
      let bodyKey: string;
      const opts = { restaurant };
      if (meal === 1 && drink === 0)
        bodyKey = "notifications.pointsEarnedOneMealFrom";
      else if (meal === 0 && drink === 1)
        bodyKey = "notifications.pointsEarnedOneDrinkFrom";
      else if (meal === 1 && drink === 1)
        bodyKey = "notifications.pointsEarnedMealAndDrinkFrom";
      else if (meal > 1 && drink === 0) {
        bodyKey = "notifications.pointsEarnedMealsFrom";
        Object.assign(opts, { count: meal });
      } else if (meal === 0 && drink > 1) {
        bodyKey = "notifications.pointsEarnedDrinksFrom";
        Object.assign(opts, { count: drink });
      } else {
        bodyKey = "notifications.pointsEarnedMealsAndDrinksFrom";
        Object.assign(opts, { meal, drink });
      }
      return {
        title: t("notifications.pointsEarnedTitle"),
        body: t(bodyKey, opts),
      };
    }
  }

  // PAYMENT: "You spent 20 balance at X" or "You spent 5 stars_meal across group X"
  if (type === "PAYMENT") {
    const atMatch = body.match(/You spent ([\d.]+) (\S+) at (.+)/);
    const groupMatch = body.match(/You spent ([\d.]+) (\S+) across group (.+)/);
    if (atMatch) {
      const amount = atMatch[1];
      const currency = getCurrencyLabel(atMatch[2], t);
      return {
        title: t("notifications.paymentTitle"),
        body: t("notifications.paymentBody", {
          amount,
          currency: currency,
          place: atMatch[3].trim(),
        }),
      };
    }
    if (groupMatch) {
      const amount = groupMatch[1];
      const currency = getCurrencyLabel(groupMatch[2], t);
      return {
        title: t("notifications.paymentTitle"),
        body: t("notifications.paymentBodyGroup", {
          amount,
          currency: currency,
          place: groupMatch[3].trim(),
        }),
      };
    }
  }

  // GIFT: title "Gift Sent" / "Gift Received", body "You gifted X type to Name" / "You received X type from Name"
  if (type === "GIFT") {
    const isSent = /Gift Sent/i.test(title);
    const sentMatch = body.match(
      /You gifted ([\d.]+) (\S+) to (.+?)(?:\s+from group .+)?$/s,
    );
    const receivedMatch = body.match(
      /You received ([\d.]+) (\S+) from (.+?)(?:\s+\(group .+\))?$/s,
    );
    if (isSent && sentMatch) {
      const name = sentMatch[3].replace(/\s+from group .+$/, "").trim();
      return {
        title: t("notifications.giftSentTitle"),
        body: t("notifications.giftSentBody", {
          amount: sentMatch[1],
          currency: getCurrencyLabel(sentMatch[2], t),
          name,
        }),
      };
    }
    if (!isSent && receivedMatch) {
      const name = receivedMatch[3].replace(/\s+\(group .+\)$/, "").trim();
      return {
        title: t("notifications.giftReceivedTitle"),
        body: t("notifications.giftReceivedBody", {
          amount: receivedMatch[1],
          currency: getCurrencyLabel(receivedMatch[2], t),
          name,
        }),
      };
    }
  }

  return { title, body };
}

export function NotificationDropdown({
  visible,
  onClose,
}: NotificationDropdownProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [markingAllRead, setMarkingAllRead] = useState(false);

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
    if (markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAllRead(false);
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

  const renderNotification = (notification: Notification) => {
    const { title, body } = getTranslatedNotification(notification, t);
    return (
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
            {title}
          </Text>
          <Text
            style={[
              styles.notificationMessage,
              { color: colors.textSecondary },
            ]}
            numberOfLines={3}
          >
            {body}
          </Text>
          <Text
            style={[styles.notificationTime, { color: colors.textSecondary }]}
          >
            {formatTime(notification.createdAt)}
          </Text>
        </View>
        {!notification.isRead && (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.primary }]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("notifications.title")}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={[
                  styles.markAllButton,
                  { minWidth: 28, alignItems: "center" },
                ]}
                disabled={markingAllRead}
              >
                {markingAllRead ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <CheckCheck size={20} color={colors.primary} />
                )}
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
                <View style={styles.skeletonList}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.skeletonItem,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <View
                        style={[
                          styles.skeletonLine,
                          styles.skeletonTitle,
                          { backgroundColor: colors.border + "50" },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLine,
                          styles.skeletonMessage,
                          { backgroundColor: colors.border + "40" },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLine,
                          styles.skeletonMessageShort,
                          { backgroundColor: colors.border + "40" },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLine,
                          styles.skeletonTime,
                          { backgroundColor: colors.border + "40" },
                        ]}
                      />
                    </View>
                  ))}
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
    // paddingBottom will be set dynamically via style prop
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
  skeletonList: {
    paddingVertical: 8,
  },
  skeletonItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  skeletonLine: {
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 16,
    width: "75%",
    marginBottom: 8,
  },
  skeletonMessage: {
    height: 14,
    width: "100%",
    marginBottom: 6,
  },
  skeletonMessageShort: {
    height: 14,
    width: "60%",
    marginBottom: 8,
  },
  skeletonTime: {
    height: 12,
    width: 80,
  },
  footerLoader: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
