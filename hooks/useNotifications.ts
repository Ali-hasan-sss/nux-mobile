import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import { RootState, AppDispatch } from "@/store/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearError,
  clearNotifications,
} from "@/store/slices/notificationSlice";

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notificationState = useSelector(
    (state: RootState) => state.notifications
  );

  // Fetch all notifications
  const loadNotifications = useCallback(
    async (page?: number, pageSize?: number, append?: boolean) => {
      try {
        await dispatch(fetchNotifications({ page, pageSize, append })).unwrap();
      } catch (error) {
        console.error("❌ Error loading notifications:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Fetch unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      console.error("❌ Error loading unread count:", error);
      throw error;
    }
  }, [dispatch]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await dispatch(markNotificationAsRead(notificationId)).unwrap();
      } catch (error) {
        console.error("❌ Error marking notification as read:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
      throw error;
    }
  }, [dispatch]);

  // Clear error
  const clearNotificationError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Clear notifications
  const clearAllNotifications = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  return {
    // State
    notifications: notificationState.notifications,
    unreadCount: notificationState.unreadCount,
    isLoading: notificationState.isLoading,
    error: notificationState.error,
    pagination: notificationState.pagination,

    // Actions
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    clearNotificationError,
    clearAllNotifications,
  };
};
