import { Stack } from "expo-router";
import { useSelector } from "react-redux";
import { Redirect } from "expo-router";
import { RootState } from "@/store/store";

export default function AuthLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
        presentation: "card",
        animationDuration: 300,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
