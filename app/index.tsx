import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { BouncingLogoLoader } from "@/components/BouncingLogoLoader";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasLanguage, setHasLanguage] = useState(false);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const mustVerify =
    user?.emailVerified === false || user?.emailVerified === undefined;
  const segments = useSegments();

  useEffect(() => {
    const checkLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("user-language");
        if (savedLanguage) {
          setHasLanguage(true);
          if (isAuthenticated) {
            if (mustVerify) {
              router.replace("/auth/verify-email");
            } else {
              router.replace("/(tabs)");
            }
          } else {
            router.replace("/choose-action");
          }
        } else {
          // أول فتح للتطبيق: لا نعيّن لغة افتراضية، نوجّه لشاشة اختيار اللغة
          router.replace("/welcome");
        }
      } catch (error) {
        console.error("Error checking language:", error);
        router.replace("/welcome");
      } finally {
        setIsLoading(false);
      }
    };

    checkLanguage();
  }, [isAuthenticated, mustVerify]);

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedBackground>
          <BouncingLogoLoader size={120} />
        </AnimatedBackground>
      </View>
    );
  }

  return null;
}
