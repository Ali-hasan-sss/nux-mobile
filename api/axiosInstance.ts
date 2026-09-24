import axios from "axios";
import { CrossPlatformStorage } from "../store/services/crossPlatformStorage";
import { API_CONFIG } from "../config/api";
import { getMobileApiHeaders } from "../config/apiHeaders";
import { SessionExpiredError } from "../lib/sessionExpired";
import { handleSessionExpired } from "../lib/sessionAuth";
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "../lib/networkError";
import {
  attachDeviceIdInterceptor,
  getClientDeviceIdHeader,
} from "../lib/attachDeviceIdInterceptor";

/** Must match authApi — same BASE_URL as local dev / production (see config/api.ts). */
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: getMobileApiHeaders(),
});

attachDeviceIdInterceptor(api);

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
api.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await CrossPlatformStorage.getTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    } catch (error) {
      console.error("❌ Failed to get token for request:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
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
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
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
          onTokenRefreshFailed(new SessionExpiredError());
          await handleSessionExpired();
          return Promise.reject(new SessionExpiredError());
        }

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken },
          {
            headers: {
              ...getMobileApiHeaders(),
              ...(await getClientDeviceIdHeader()),
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        await CrossPlatformStorage.saveTokens({
          accessToken,
          refreshToken: newRefreshToken,
        });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        onTokenRefreshed(accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        onTokenRefreshFailed(new SessionExpiredError());
        await handleSessionExpired();
        return Promise.reject(new SessionExpiredError());
      } finally {
        isRefreshing = false;
      }
    }

    if (isNetworkError(error)) {
      return Promise.reject(new Error(NETWORK_ERROR_MESSAGE));
    }

    return Promise.reject(error);
  }
);

export default api;
