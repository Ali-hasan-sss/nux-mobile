import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider, useSelector } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store, RootState } from "@/store/store";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { NotificationSocketProvider } from "@/contexts/NotificationSocketContext";
import { AlertProvider } from "@/contexts/AlertContext";
import "@/i18n/i18n";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Component to handle StatusBar based on theme
function ThemedStatusBar() {
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

// Fix PlatformConstants error
if (typeof global !== "undefined") {
  (global as any).PlatformConstants = {
    get: () => null,
    getConstants: () => ({}),
  };
}

export default function RootLayout() {
  const isFrameworkReady = useFrameworkReady();

  useEffect(() => {
    if (isFrameworkReady) {
      // Hide splash screen when app is ready
      SplashScreen.hideAsync();
    }
  }, [isFrameworkReady]);

  if (!isFrameworkReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <LanguageProvider>
          <AlertProvider>
            <AuthProvider>
              <NotificationSocketProvider>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  width: "100%",
                  height: "100%",
                }}
              >
                {/* AnimatedBackground أول عنصر - يغطي الشاشة بالكامل */}
                <AnimatedBackground />
                <GestureHandlerRootView
                  style={{
                    flex: 1,
                    backgroundColor: "transparent",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: "fade",
                        contentStyle: { backgroundColor: "transparent" },
                        presentation: "transparentModal",
                      }}
                    >
                      <Stack.Screen
                        name="index"
                        options={{
                          contentStyle: { backgroundColor: "transparent" },
                          presentation: "transparentModal",
                        }}
                      />
                      <Stack.Screen
                        name="welcome"
                        options={{
                          contentStyle: { backgroundColor: "transparent" },
                          presentation: "card",
                          animation: "fade",
                        }}
                      />
                      <Stack.Screen
                        name="choose-action"
                        options={{
                          contentStyle: { backgroundColor: "transparent" },
                          presentation: "card",
                          animation: "slide_from_right",
                        }}
                      />
                      <Stack.Screen
                        name="auth"
                        options={{
                          contentStyle: { backgroundColor: "transparent" },
                          presentation: "card",
                          animation: "slide_from_right",
                        }}
                      />
                      <Stack.Screen
                        name="(tabs)"
                        options={{
                          headerShown: false,
                          contentStyle: { backgroundColor: "transparent" },
                        }}
                      />
                      <Stack.Screen
                        name="+not-found"
                        options={{
                          contentStyle: { backgroundColor: "transparent" },
                          presentation: "transparentModal",
                        }}
                      />
                    </Stack>
                    <ThemedStatusBar />
                  </View>
                </GestureHandlerRootView>
              </View>
              </NotificationSocketProvider>
            </AuthProvider>
          </AlertProvider>
        </LanguageProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
