// src/hooks/useSidebarNotifications.ts
import { useEffect, useState } from "react";

export interface NotificationItem {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  targetUrl?: string; //
}

export function useSidebarNotifications(pollIntervalMs = 10000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from your /api/notifications?onlyUnread=false
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

  // Mark as read
  async function markNotificationAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  useEffect(() => {
    // 1) Fetch immediately
    fetchNotifications();

    // 2) Poll every pollIntervalMs
    const intervalId = setInterval(fetchNotifications, pollIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markNotificationAsRead,
  };
}
