// API Configuration for Mobile App

const LOCAL_IP = "https://back.nuxapp.de";
const DOMAIN = "https://back.nuxapp.de";
export const API_CONFIG = {
  // Base URLs
  BASE_URL: __DEV__ ? `${DOMAIN}/api` : `${DOMAIN}/api`,

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
      GIFT: "/client/balance/gift",
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

// Log current configuration
if (__DEV__) {
  console.log("📡 API Configuration:", {
    baseUrl: API_CONFIG.BASE_URL,
    localIP: LOCAL_IP,
    isDev: __DEV__,
  });
}
