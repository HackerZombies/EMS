// src/hooks/useSidebarNotifications.ts
import { useEffect, useState } from "react";

export interface NotificationItem {
  // This is the pivot table ID (UserNotification.id)
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  targetUrl?: string;
}

export function useSidebarNotifications(pollIntervalMs = 10000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notifications from /api/notifications?onlyUnread=false
  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?onlyUnread=false");
      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  }

  // Mark a single notification as read
  async function markNotificationAsRead(userNotificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${userNotificationId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === userNotificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  // NEW: Mark all notifications as read
  async function markAllNotificationsAsRead() {
    try {
      const res = await fetch("/api/notifications/markAllRead", {
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // In local state, set all isRead to true
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }

  useEffect(() => {
    // 1) Fetch immediately
    fetchNotifications();
    // 2) Poll every pollIntervalMs
    const intervalId = setInterval(fetchNotifications, pollIntervalMs);
    return () => clearInterval(intervalId);
  }, [pollIntervalMs]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead, // expose new method
  };
}
