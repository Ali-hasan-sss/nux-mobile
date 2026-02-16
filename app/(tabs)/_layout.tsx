import { Tabs } from "expo-router";
import { Home, Tag, Wallet, User } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { CustomHeader } from "@/components/CustomHeader";

/** تخطيط التبويبات - تطبيق العميل فقط (لا تبويبات أو واجهة لصاحب المطعم) */
export default function TabLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const mustVerify =
    user?.emailVerified === false || user?.emailVerified === undefined;
  const { colors, isDark, defaultFontFamily } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  if (mustVerify) {
    return <Redirect href="/auth/verify-email" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <Tabs
        screenOptions={{
          header: () => <CustomHeader />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarStyle: {
            backgroundColor: isDark
              ? "rgba(26, 31, 58, 0.95)" // colors.surfaceSolid with 95% opacity
              : "rgba(255, 255, 255, 0.95)", // colors.surfaceSolid with 95% opacity
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom:
              Platform.OS === "ios"
                ? Math.max(insets.bottom, 10)
                : Math.max(insets.bottom, 10),
            paddingTop: 10,
            height:
              Platform.OS === "ios"
                ? 80 + Math.max(insets.bottom, 0)
                : 70 + Math.max(insets.bottom, 0),
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            fontFamily: defaultFontFamily,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home", "Home"),
            tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="promotions"
          options={{
            title: t("tabs.promotions", "Promotions"),
            tabBarIcon: ({ size, color }) => <Tag size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="purchase"
          options={{
            title: t("tabs.purchase", "Wallet"),
            tabBarIcon: ({ size, color }) => (
              <Wallet size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: t("tabs.account", "Account"),
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu-webview"
          options={{
            href: null, // Hide from tab bar - only accessible via navigation
          }}
        />
        <Tabs.Screen
          name="explore-restaurants"
          options={{
            href: null, // Only accessible via home "Explore restaurants" button
          }}
        />
      </Tabs>
    </View>
  );
}
