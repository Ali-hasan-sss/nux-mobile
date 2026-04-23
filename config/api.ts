import Constants from "expo-constants";
import { Platform } from "react-native";

/** See `.env.example` — tunnel / odd setups need EXPO_PUBLIC_API_URL. */

const PRODUCTION_API = "https://back.nuxapp.de/api";
const DEFAULT_DEV_PORT = 5000;

function normalizeApiBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Same machine IP/hostname Metro uses (LAN mode). Not valid for tunnel-only hosts. */
function metroBundlerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === "string" && hostUri.length > 0) {
    const host = hostUri.split(":")[0]?.trim();
    if (host) return host;
  }
  const dbg = (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost;
  if (typeof dbg === "string" && dbg.length > 0) {
    return dbg.split(":")[0]?.trim() ?? null;
  }
  return null;
}

function isTunnelLikeHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.includes("exp.direct") ||
    h.includes("ngrok") ||
    h.includes("tunnel") ||
    h.endsWith(".exp.host")
  );
}

function defaultDevApiBase(): string {
  const h = metroBundlerHost();
  if (h && !isTunnelLikeHost(h) && h !== "localhost" && h !== "127.0.0.1") {
    return `http://${h}:${DEFAULT_DEV_PORT}/api`;
  }
  if (h && isTunnelLikeHost(h) && __DEV__) {
    console.warn(
      "[API] Metro is using a tunnel URL; your backend on :5000 is not reachable through it. " +
        "Use LAN in Expo (`Shift+m` → localhost/LAN) or set EXPO_PUBLIC_API_URL to http://<PC_IP>:5000/api"
    );
  }
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEFAULT_DEV_PORT}/api`;
  }
  return `http://127.0.0.1:${DEFAULT_DEV_PORT}/api`;
}

function resolveApiBaseUrl(): string {
  const fromEnv =
    typeof process.env.EXPO_PUBLIC_API_URL === "string"
      ? process.env.EXPO_PUBLIC_API_URL.trim()
      : "";
  if (fromEnv) return normalizeApiBase(fromEnv);
  if (__DEV__) return defaultDevApiBase();
  return PRODUCTION_API;
}

export const API_CONFIG = {
  BASE_URL: resolveApiBaseUrl(),

  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      ADMIN_LOGIN: "/auth/admin/login",
      REFRESH: "/auth/refresh",
      VERIFY_EMAIL: "/auth/verify-email",
      SEND_VERIFICATION: "/auth/send-verification-code",
      REQUEST_RESET: "/auth/request-password-reset",
      RESET_PASSWORD: "/auth/reset-password",
    },
    CLIENT: {
      BALANCE: "/client/balance/with-restaurants",
      SCAN_QR: "/client/balance/scan-qr",
      PAY: "/client/balance/pay",
    },
    NOTIFICATIONS: {
      GET_ALL: "/notifications",
      GET_UNREAD_COUNT: "/notifications/count",
      MARK_AS_READ: "/notifications/read",
      MARK_ALL_AS_READ: "/notifications/read-all",
    },
    MENU: {
      GET_CATEGORIES: "/customer/menu",
      GET_ITEMS: "/customer/menu/items",
    },
    ORDERS: {
      CREATE: "/customer/orders",
    },
    CONTACT: {
      SEND: "/contact",
    },
  },

  // Timeouts
  TIMEOUT: 30000,

  // Development settings
  DEV: {
    LOG_REQUESTS: __DEV__,
    LOG_RESPONSES: __DEV__,
  },
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Resolve image URL from path stored without domain.
 * If path is already absolute (http/https), return as-is.
 * Otherwise prepend backend domain so /uploads/... loads correctly.
 */
export function getImageUrl(
  path: string | null | undefined
): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  const base = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
  const pathClean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${pathClean}`;
}

if (__DEV__) {
  console.log("📡 API Configuration:", {
    baseUrl: API_CONFIG.BASE_URL,
    metroHost: metroBundlerHost(),
    overrideEnv: process.env.EXPO_PUBLIC_API_URL ?? "(not set)",
    isDev: __DEV__,
  });
}
