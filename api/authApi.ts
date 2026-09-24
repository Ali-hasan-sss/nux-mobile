import axios from "axios";
import { CrossPlatformStorage } from "../store/services/crossPlatformStorage";
import { API_CONFIG } from "../config/api";
import { getMobileApiHeaders } from "../config/apiHeaders";
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "../lib/networkError";
import { SessionExpiredError } from "../lib/sessionExpired";
import { handleSessionExpired } from "../lib/sessionAuth";
import {
  attachDeviceIdInterceptor,
  getClientDeviceIdHeader,
} from "../lib/attachDeviceIdInterceptor";

const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: getMobileApiHeaders(),
});

attachDeviceIdInterceptor(authApi);

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
      originalRequest.url?.includes("/auth/apple") ||
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

        return authApi(originalRequest);
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
          const hint = __DEV__
            ? ` Cannot reach ${API_CONFIG.BASE_URL}. Is the backend running on 0.0.0.0:${5000}? Same Wi‑Fi / correct LAN IP in .env?`
            : "";
          const networkError = new Error(`${NETWORK_ERROR_MESSAGE}${hint}`);
          (networkError as Error & { code?: string }).code = "NETWORK_ERROR";
          if (__DEV__) {
            console.error("[authApi] Network error →", API_CONFIG.BASE_URL, error);
          }
          return Promise.reject(networkError);
        }

        return Promise.reject(error);
  }
);

export { authApi };
