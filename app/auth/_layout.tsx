import { Stack, Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function AuthLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const mustVerify =
    user?.emailVerified === false || user?.emailVerified === undefined;

  if (isAuthenticated && !mustVerify) {
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
      <Stack.Screen
        name="verify-email"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
