import { AppRegistry, Platform } from "react-native";

// Silence logs in production builds
if (!__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.info = () => {};
}

/**
 * Stripe Android expects this Headless JS task for Payment Sheet lifecycle.
 * StripeProvider does not register it (see stripe-react-native#1981).
 */
if (Platform.OS === "android") {
  AppRegistry.registerHeadlessTask("StripeKeepJsAwakeTask", () => async () => {
    await Promise.resolve();
  });
}
