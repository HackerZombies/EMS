"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AnimatedNotificationToast } from "./NotificationToast";

interface NotificationItem {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  targetUrl?: string;
}

export function NotificationListener() {
  // Track which notifications have been shown in the current session.
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    // Fetch unread notifications immediately and then every 10 seconds.
    async function fetchUnreadNotifications() {
      try {
        const res = await fetch("/api/notifications?onlyUnread=true", {
          credentials: "include", // send cookies if needed
          signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch notifications: ${res.statusText}`);
        }
        const data = await res.json();
        if (isMounted) {
          handleNewNotifications(data.notifications || []);
        }
      } catch (err: any) {
        // Ignore abort errors.
        if (err.name === "AbortError") return;
        console.error("Polling error:", err);
      }
    }

    // Immediately fetch notifications, then set up polling.
    fetchUnreadNotifications();
    const intervalId = setInterval(fetchUnreadNotifications, 10000);

    // Cleanup on unmount.
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      controller.abort();
    };
  }, []);

  // Process and display any new notifications.
  function handleNewNotifications(notifications: NotificationItem[]) {
    notifications.forEach((notif) => {
      if (!seenIds.current.has(notif.id)) {
        seenIds.current.add(notif.id);
        showToast(notif);
      }
    });
  }

  // Mark a notification as read.
  async function markNotificationAsRead(notificationId: string) {
    try {
      const resp = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        // Adjust the payload as needed for your API.
        body: JSON.stringify({ isRead: true }),
      });
      if (!resp.ok) {
        console.error("Failed to mark notification as read:", resp.statusText);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  // Display a toast for the notification.
  function showToast(notif: NotificationItem) {
    const stableToastId = notif.id;

    toast(
      <AnimatedNotificationToast
        toastId={stableToastId}
        message={notif.message}
        createdAt={notif.createdAt}
        targetUrl={notif.targetUrl}
        // When the toast is opened or closed, mark the notification as read.
        onOpen={() => {
          markNotificationAsRead(notif.id);
          toast.dismiss(stableToastId);
        }}
        onClose={() => {
          markNotificationAsRead(notif.id);
          toast.dismiss(stableToastId);
        }}
      />,
      {
        toastId: stableToastId,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
        icon: false,
        closeButton: false,
        className: "p-0 bg-transparent shadow-none",
      }
    );
  }

  return null;
}
