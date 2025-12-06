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
  const segments = useSegments();

  useEffect(() => {
    const checkLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("user-language");
        if (savedLanguage) {
          setHasLanguage(true);
          // If authenticated, go to tabs, otherwise go to choose-action
          if (isAuthenticated) {
            router.replace("/(tabs)");
          } else {
            router.replace("/choose-action");
          }
        } else {
          // Set default language to English on first launch
          await AsyncStorage.setItem("user-language", "en");
          setHasLanguage(true);
          // If authenticated, go to tabs, otherwise go to choose-action
          if (isAuthenticated) {
            router.replace("/(tabs)");
          } else {
            router.replace("/choose-action");
          }
        }
      } catch (error) {
        console.error("Error checking language:", error);
        // Set default language to English on error
        try {
          await AsyncStorage.setItem("user-language", "en");
        } catch (e) {
          console.error("Error setting default language:", e);
        }
        router.replace("/choose-action");
      } finally {
        setIsLoading(false);
      }
    };

    checkLanguage();
  }, [isAuthenticated]);

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
