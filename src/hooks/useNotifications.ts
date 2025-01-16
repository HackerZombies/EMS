import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  recipientUsername: string;
}

/**
 * Polls unread notifications for an admin user every 10s and shows them as toast messages.
 * 
 * @param isAdmin boolean indicating if the current user is an admin (or HR).
 */
export default function useNotifications(isAdmin: boolean) {
  const router = useRouter();
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Keep track of notification IDs that have already been shown
  const [displayedNotifications, setDisplayedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only run the polling if isAdmin is true
    if (!isAdmin) return;

    // Start polling
    pollInterval.current = setInterval(() => {
      fetchNotifications();
    }, 10_000);

    // Fetch immediately on mount too
    fetchNotifications();

    // Cleanup
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [isAdmin]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications/unread");
      const data = await res.json();

      if (res.ok && Array.isArray(data.notifications)) {
        const notifications: Notification[] = data.notifications;
        
        // Filter out notifications we've already displayed in this session
        const newNotifications = notifications.filter(
          (notif) => !displayedNotifications.has(notif.id)
        );

        // For each new notification, show a toast
        newNotifications.forEach((notif) => {
          // Add to displayedNotifications so we don't show it again
          setDisplayedNotifications((prev) => new Set(prev).add(notif.id));

          toast.info(notif.message, {
            autoClose: 5000,
            onClick: async () => {
              // Mark single notification as read
              await markAsRead([notif.id]);
              // Remove from displayedNotifications set so if it reappears server-side, we could show it or ignore it
              // but since we mark it as read, it won't reappear in /unread anyway
              setDisplayedNotifications((prev) => {
                const next = new Set(prev);
                next.delete(notif.id);
                return next;
              });

              // Optionally navigate the user
              router.push("/activity");
              toast.dismiss(); // close all toasts
            },
          });
        });
      } else {
        console.error("Error fetching notifications:", data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  // You can also provide a function for reading multiple at once if needed
  async function markAsRead(notificationIds: string[]) {
    if (notificationIds.length === 0) return;
    try {
      await fetch("/api/notifications/markAsRead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  }
}
