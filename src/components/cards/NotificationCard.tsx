// src/components/cards/NotificationCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSidebarNotifications } from "@/hooks/useSidebarNotifications";

// Ensure this import path matches where NotificationListCard is located
import { NotificationListCard } from "@/components/NotificationCard";

export default function NotificationCard() {
  // Fetch notifications, refreshing every 10s (10,000 ms)
  const { notifications, markNotificationAsRead } = useSidebarNotifications(10000);

  // Sort descending by creation date, then take the 5 most recent notifications
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf())
    .slice(0, 5);

  // Mark notification as read when clicking the notification (opening it)
  async function handleClickNotification(notif: any) {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.targetUrl) {
      window.location.href = notif.targetUrl;
    }
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg p-2 rounded-lg min-h-[450px]">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="px-2 py-2">
        {recentNotifications.length === 0 ? (
          <p className="text-sm text-gray-500">No recent notifications.</p>
        ) : (
          recentNotifications.map((notif) => (
            <NotificationListCard
              key={notif.id}
              title={notif.message}
              time={notif.createdAt}
              isNew={!notif.isRead}
              onClick={() => handleClickNotification(notif)}
            />
          ))
        )}
        {/* Link to view all notifications on the announcements page (notifications tab) */}
        <div className="mt-8 text-right">
          <Link
            href="/announcements?tab=notifications"
            className="text-xs text-blue-500 hover:underline"
          >
            View All Notifications
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
