import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { authApi } from "@/api/authApi";
import { API_CONFIG } from "@/config/api";
import { isExpoGoApp } from "@/lib/googleSignIn";

const ANDROID_CHANNEL_ID = "default";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Create Android channels early so FCM can display when app is killed. */
export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "NUX",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1A1F3A",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
    android: {},
  });
  return status === "granted";
}

/** Native FCM (Android) / APNs (iOS) token — matches backend `firebaseToken` field. */
export async function getNativePushToken(): Promise<string | null> {
  if (!Device.isDevice || isExpoGoApp()) {
    return null;
  }

  await ensureNotificationChannels();

  const granted = await requestNotificationPermission();
  if (!granted) {
    if (__DEV__) {
      console.warn("[push] Notification permission not granted");
    }
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("[push] Missing EAS projectId — required for Expo push/FCM setup");
  }

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    if (deviceToken?.data && typeof deviceToken.data === "string") {
      if (__DEV__) {
        console.log("[push] FCM/APNs token registered locally");
      }
      return deviceToken.data;
    }
  } catch (e) {
    console.warn("[push] getDevicePushTokenAsync failed:", e);
  }

  return null;
}

export async function registerPushTokenWithBackend(token: string): Promise<void> {
  await authApi.post(API_CONFIG.ENDPOINTS.FIREBASE.UPDATE_TOKEN, {
    firebaseToken: token,
  });
}

export async function setupPushNotificationsForUser(): Promise<void> {
  try {
    const token = await getNativePushToken();
    if (!token) return;
    await registerPushTokenWithBackend(token);
    if (__DEV__) {
      console.log("[push] Token synced with backend");
    }
  } catch (e) {
    console.warn("[push] Failed to register push token:", e);
  }
}

export function addPushTokenRefreshListener(
  onToken: (token: string) => void
): Notifications.Subscription {
  return Notifications.addPushTokenListener((event) => {
    if (event.data) onToken(event.data);
  });
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/** Call once at app start (before login) so channels + permission exist for background FCM. */
export async function bootstrapPushNotifications(): Promise<void> {
  if (!Device.isDevice || isExpoGoApp()) return;
  await ensureNotificationChannels();
  await requestNotificationPermission();
}
