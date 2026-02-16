import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, Image } from "react-native";
import { Text } from "@/components/AppText";
import { Bell, Menu } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { DrawerMenu } from "./DrawerMenu";
import { NotificationDropdown } from "./NotificationDropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StatusBar } from "react-native";

export function CustomHeader() {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  // Unread count is updated via WebSocket (NotificationSocketContext), not polling.
  // Notifications list is fetched only when the user opens the notifications dropdown.

  // Calculate safe top padding for header
  // Use insets.top, but fallback to StatusBar.currentHeight on Android if insets is 0
  const topPadding = Platform.OS === "android" 
    ? Math.max(insets.top || 0, StatusBar.currentHeight || 0)
    : insets.top;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? "rgba(26, 31, 58, 0.95)" // colors.surfaceSolid with 95% opacity
              : "rgba(255, 255, 255, 0.95)", // colors.surfaceSolid with 95% opacity
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: topPadding,
              backgroundColor: "transparent",
            },
          ]}
        >
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
            <Menu size={24} color={colors.text} />
          </TouchableOpacity>

          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setNotificationsOpen(true)}
          >
            <Bell size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  { backgroundColor: colors.error },
                ]}
              >
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={drawerOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDrawerOpen(false)}
      >
        <DrawerMenu onClose={() => setDrawerOpen(false)} />
      </Modal>

      <NotificationDropdown
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    width: 80,
    height: 50,
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
