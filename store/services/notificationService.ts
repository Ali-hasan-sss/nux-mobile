import { API_CONFIG } from "../../config/api";
import { authApi } from "../../api/authApi";

export interface Notification {
  id: number;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
    notifications: Notification[];
  };
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data?: Notification;
}

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

/** Backend wraps payloads as `{ success, message, data: { ... } }`. */
function unwrapApiData<T>(body: unknown): T | undefined {
  if (body == null || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (record.data != null && typeof record.data === "object") {
    return record.data as T;
  }
  return body as T;
}

class NotificationService {
  // Get all notifications with pagination
  async getAllNotifications(
    page: number = 1,
    pageSize: number = 10
  ): Promise<NotificationsResponse> {
    try {
      console.log(
        "🔔 Fetching notifications - Page:",
        page,
        "PageSize:",
        pageSize
      );

      const response = await authApi.get(
        `${API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_ALL}?page=${page}&pageSize=${pageSize}`
      );

      if (__DEV__) {
        console.log("📬 Notifications Response:", response.data);
      }

      const inner = unwrapApiData<NotificationsResponse["data"]>(response.data);
      return {
        success: (response.data as ApiEnvelope<unknown>)?.success ?? true,
        message:
          (response.data as ApiEnvelope<unknown>)?.message ??
          "notifications fetched",
        data: {
          notifications: inner?.notifications ?? [],
          pagination: inner?.pagination ?? {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            pageSize,
          },
        },
      };
    } catch (error: any) {
      console.error("❌ Failed to fetch notifications:", error);

      if (error.response) {
        console.error("❌ Error response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      throw error;
    }
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      console.log("🔔 Fetching unread notifications count...");

      const response = await authApi.get(
        API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT
      );

      if (__DEV__) {
        console.log("📊 Unread Count Response:", response.data);
      }

      const inner = unwrapApiData<{ count: number }>(response.data);
      const count =
        typeof inner?.count === "number"
          ? inner.count
          : typeof (response.data as { count?: number })?.count === "number"
            ? (response.data as { count: number }).count
            : 0;
      return {
        success: (response.data as ApiEnvelope<unknown>)?.success ?? true,
        message:
          (response.data as ApiEnvelope<unknown>)?.message ?? "ok",
        data: { count },
      };
    } catch (error: any) {
      console.error("❌ Failed to fetch unread count:", error);
      throw error;
    }
  }

  // Mark a single notification as read
  async markAsRead(notificationId: number): Promise<MarkAsReadResponse> {
    try {
      console.log("✅ Marking notification as read:", notificationId);

      const response = await authApi.put(
        `${API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ}/${notificationId}`
      );

      if (__DEV__) {
        console.log("✅ Mark as Read Response:", response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to mark notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<MarkAsReadResponse> {
    try {
      console.log("✅ Marking all notifications as read...");

      const response = await authApi.put(
        API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ
      );

      if (__DEV__) {
        console.log("✅ Mark All as Read Response:", response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to mark all notifications as read:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
