import { Tabs } from "expo-router";
import { Home, Tag, ShoppingBag, User } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { CustomHeader } from "@/components/CustomHeader";

export default function TabLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
          sceneStyle: {
            backgroundColor: "transparent",
          },
        tabBarStyle: {
            backgroundColor: "rgba(10, 14, 39, 0.95)",
            borderTopWidth: 0,
            borderTopColor: "transparent",
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
            elevation: 0,
            shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
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
          title: t("tabs.purchase", "Purchase"),
          tabBarIcon: ({ size, color }) => (
            <ShoppingBag size={size} color={color} />
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
    </Tabs>
    </View>
  );
}
