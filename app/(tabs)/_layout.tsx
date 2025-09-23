import { Tabs } from "expo-router";
import { Home, Tag, ShoppingBag, User } from "lucide-react-native";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { CustomHeader } from "@/components/CustomHeader";

export default function TabLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
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
          title: "Home",
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: "Promotions",
          tabBarIcon: ({ size, color }) => <Tag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="purchase"
        options={{
          title: "Purchase",
          tabBarIcon: ({ size, color }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
