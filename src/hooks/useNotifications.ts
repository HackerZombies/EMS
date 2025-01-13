import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  recipientUsername: string;
}

// 1) Accept a boolean flag (isAdmin) so the hook always gets called
export default function useNotifications(isAdmin: boolean) {
  const router = useRouter();
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 2) Only run the polling if isAdmin is true
    if (!isAdmin) return;

    // Start polling
    pollInterval.current = setInterval(fetchNotifications, 10_000);

    // Cleanup
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [isAdmin]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications/unread");
      const data = await res.json();

      if (res.ok) {
        const notifications: Notification[] = data.notifications;
        if (notifications.length > 0) {
          // Show a toast for each new notification
          notifications.forEach((notif) => {
            toast.info(notif.message, {
              // 3) Make the toast disappear automatically after 5s
              autoClose: 5000,

              // If you DO want them to remain clickable and do something onClick:
              onClick: async () => {
                // Mark as read
                await markAsRead([notif.id]);
                // Go to the activity page
                router.push("/activity");
                // Dismiss the toast immediately
                toast.dismiss();
              },
            });
          });
        }
      } else {
        console.error("Error fetching notifications:", data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  async function markAsRead(notificationIds: string[]) {
    if (notificationIds.length === 0) return;
    try {
      await fetch("/api/notifications/markAsRead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });
      // No further handling needed
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  }
}
