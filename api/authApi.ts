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
    "X-Client-Channel": "mobile",
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<{
  onSuccess: (token: string) => void;
  onError: (error: unknown) => void;
}> = [];

// Function to add requests to queue while refreshing
const subscribeTokenRefresh = (
  onSuccess: (token: string) => void,
  onError: (error: unknown) => void
) => {
  refreshSubscribers.push({ onSuccess, onError });
};

// Function to notify all queued requests
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((subscriber) => subscriber.onSuccess(token));
  refreshSubscribers = [];
};

// Function to reject all queued requests when refresh fails
const onTokenRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach((subscriber) => subscriber.onError(error));
  refreshSubscribers = [];
};

// Request interceptor to add auth token
authApi.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await CrossPlatformStorage.getTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      } else {
        console.log("⚠️ No token available for request");
      }
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
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth routes
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/google") ||
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(authApi(originalRequest));
            },
            (refreshError: unknown) => {
              reject(refreshError);
            }
          );
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

        return authApi(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);

        // Reject all pending requests and force logout state for navigation guards
        onTokenRefreshFailed(refreshError);
        await CrossPlatformStorage.clearAll();
        // Avoid static store import here to prevent circular dependency during app boot.
        try {
          const { store } = await import("../store/store");
          store.dispatch({ type: "auth/logout" });
        } catch {
          // ignore: app shell will re-evaluate auth state from cleared tokens
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

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
