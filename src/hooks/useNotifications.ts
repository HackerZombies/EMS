// src/hooks/useNotifications.ts
import { useState, useEffect } from "react";
// Example: using axios for fetching. Replace with your own fetching logic.
import axios from "axios";

interface Notification {
  id: string; // or number, depending on your DB
  message: string;
  createdAt: string; // ISO string
  isRead: boolean;
  recipientUsername: string;
}

// Return type: customize as needed
interface UseNotificationsReturn {
  notifications: Notification[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  markAsRead: (notificationIds: string[]) => Promise<void>;
}

export default function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // Example function to fetch notifications from an API endpoint
  async function fetchNotifications() {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await axios.get("/api/notifications"); // Adjust URL as needed
      setNotifications(response.data); // Assume response.data is an array of Notification
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Example function to mark notifications as read
  async function markAsRead(notificationIds: string[]) {
    try {
      // Example PATCH/POST request to your server
      await axios.patch("/api/notifications/mark-as-read", {
        notificationIds,
      });
      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }

  useEffect(() => {
    // Fetch on mount
    fetchNotifications();
  }, []);

  const total = notifications.length; // If you need the total count

  return {
    notifications,
    total,
    isLoading,
    isError,
    markAsRead,
  };
}
