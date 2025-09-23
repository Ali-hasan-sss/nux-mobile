// API Configuration for Mobile App

const LOCAL_IP = 'https://nux-backend.onrender.com';

export const API_CONFIG = {
  // Base URLs
  BASE_URL: __DEV__
    ? `https://nux-backend.onrender.com/api`
    : 'https://nux-backend.onrender.com/api',

  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REGISTER_RESTAURANT: '/auth/registerRestaurant',
      ADMIN_LOGIN: '/auth/admin/login',
      REFRESH: '/auth/refresh',
      VERIFY_EMAIL: '/auth/verify-email',
      SEND_VERIFICATION: '/auth/send-verification-code',
      REQUEST_RESET: '/auth/request-password-reset',
      RESET_PASSWORD: '/auth/reset-password',
    },
    CLIENT: {
      BALANCE: '/client/balance/with-restaurants',
      SCAN_QR: '/client/balance/scan-qr',
      PAY: '/client/balance/pay',
      GIFT: '/client/balance/gift',
    },
  },

  // Timeouts
  TIMEOUT: 10000,

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

// Log current configuration
if (__DEV__) {
  console.log('📡 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    localIP: LOCAL_IP,
    isDev: __DEV__,
  });
}
