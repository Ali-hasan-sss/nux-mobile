import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store } from "@/store/store";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import "@/i18n/i18n";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";

// Fix PlatformConstants error
if (typeof global !== "undefined") {
  (global as any).PlatformConstants = {
    get: () => null,
    getConstants: () => ({}),
  };
}

export default function RootLayout() {
  const isFrameworkReady = useFrameworkReady();

  if (!isFrameworkReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <LanguageProvider>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="auth" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </GestureHandlerRootView>
          </AuthProvider>
        </LanguageProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
