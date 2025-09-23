import axios from "axios";
import { CrossPlatformStorage } from "../store/services/crossPlatformStorage";
import { AuthTokens } from "../store/types/authTypes";
import { API_CONFIG } from "../config/api";

// Create axios instance
const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Function to add requests to queue while refreshing
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Function to notify all queued requests
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Request interceptor to add auth token
authApi.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await CrossPlatformStorage.getTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        console.log(
          "🔑 Token added to request:",
          tokens.accessToken.substring(0, 20) + "..."
        );
      } else {
        console.log("⚠️ No token available for request");
      }

      // Add debugging info
      console.log("📤 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!tokens?.accessToken,
      });

      return config;
    } catch (error) {
      console.error("❌ Failed to get tokens for request:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
authApi.interceptors.response.use(
  (response) => {
    console.log("📥 API Response:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth routes
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      console.log("🔄 Token expired, attempting refresh...");

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(authApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await CrossPlatformStorage.getTokens();
        if (!tokens?.refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Save new tokens
        await CrossPlatformStorage.saveTokens({
          accessToken,
          refreshToken: newRefreshToken,
        });

        // Update the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Notify all queued requests
        onTokenRefreshed(accessToken);

        console.log("✅ Token refreshed successfully");
        return authApi(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);

        // Clear all data and force logout
        await CrossPlatformStorage.clearAll();

        // Dispatch logout action to clear Redux state
        // Note: This will be handled by the component that catches the error
        console.log("🚪 Forcing logout due to refresh token failure");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

        console.error("❌ API Error:", {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: originalRequest?.url,
        });

        // Handle network errors specifically
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          const networkError = new Error('Network Error - Please check your internet connection');
          (networkError as any).code = 'NETWORK_ERROR';
          return Promise.reject(networkError);
        }

        return Promise.reject(error);
  }
);

export { authApi };
