// src/pages/announcements/index.tsx

"use client";

import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { useRouter } from "next/router";

// ShadCN UI
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";

// Notification logic
import {
  useSidebarNotifications,
  NotificationItem,
} from "@/hooks/useSidebarNotifications";
import { NotificationListCard } from "@/components/NotificationCard";

// For Searching/Filtering announcements
import { SearchBarAndFilter } from "@/components/SearchBarAndFilter";

// ExtendedAnnouncement type
import { ExtendedAnnouncement } from "@/types/ExtendedAnnouncement";

// The grid-based display
import { AnnouncementsGrid } from "@/components/AnnouncementsGrid";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  const userRole = session.user.role; // e.g. "EMPLOYEE", "HR", "ADMIN"

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { roleTargets: { has: userRole } },
        { roleTargets: { equals: [] } },
      ],
    },
    orderBy: [
      { pinned: "desc" },
      { dateCreated: "desc" },
    ],
  });

  return {
    props: {
      initialAnnouncements: JSON.parse(JSON.stringify(announcements)) as ExtendedAnnouncement[],
    },
  };
};

// Example: If you still want to allow pin/unpin or delete from index
async function togglePinAnnouncement(id: string, pinned: boolean) {
  const resp = await fetch("/api/announcements/pin", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, pinned }),
  });
  if (!resp.ok) throw new Error("Failed to pin/unpin");
  return resp.json();
}

async function deleteAnnouncementById(announcementID: string) {
  const resp = await fetch("/api/announcements/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ announcementID }),
  });
  if (!resp.ok) throw new Error("Failed to delete");
  return resp.json();
}

async function markAllNotificationsRead() {
  const resp = await fetch("/api/notifications/markAllRead", {
    method: "PATCH",
  });
  if (!resp.ok) throw new Error("Failed to mark all as read");
  return resp.json();
}

export default function AnnouncementsIndex({
  initialAnnouncements,
}: {
  initialAnnouncements: ExtendedAnnouncement[];
}) {
  const { data: session } = useSession();
  const router = useRouter();

  // State
  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>(
    initialAnnouncements
  );
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Notifications
  const { notifications, markNotificationAsRead } = useSidebarNotifications(10000);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      notifications.forEach((n) => {
        if (!n.isRead) markNotificationAsRead(n.id);
      });
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all read");
    }
  }, [notifications, markNotificationAsRead]);

  // Filter logic
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.text.toLowerCase().includes(searchTerm.toLowerCase());

    if (showPinnedOnly && !a.pinned) return false;
    if (!showArchived && a.archived) return false;

    return matchesSearch;
  });

  // Pin/unpin
  async function handlePinToggle(a: ExtendedAnnouncement) {
    try {
      setLoading(true);
      await togglePinAnnouncement(a.id, !a.pinned);
      setAnnouncements((prev) =>
        prev.map((ann) => (ann.id === a.id ? { ...ann, pinned: !ann.pinned } : ann))
      );
      toast.success("Pin state updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to pin/unpin");
    } finally {
      setLoading(false);
    }
  }

  // Delete
  async function handleDeleteAnnouncement(id: string) {
    try {
      setLoading(true);
      await deleteAnnouncementById(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  }

  // Clear all
  async function handleClearAll() {
    try {
      setLoading(true);
      await Promise.all(announcements.map((a) => deleteAnnouncementById(a.id)));
      setAnnouncements([]);
      toast.success("All cleared!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear");
    } finally {
      setLoading(false);
    }
  }

  // Handle click on each notification
  async function handleViewDetails(notif: NotificationItem) {
    await markNotificationAsRead(notif.id);
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    }
  }

  // Check user role
  const userRole = session?.user.role || "";

  return (
    <>
      <Head>
        <title>EMS - Announcements</title>
      </Head>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="p-4 md:p-8 min-h-screen text-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">All Updates</h1>
          {/* Only show "Create Announcement" button if HR or ADMIN */}
          {(userRole === "HR" || userRole === "ADMIN") && (
            <Link href="/announcements/new">
              <Button variant="default">Create Announcement</Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="announcements" onValueChange={() => {}}>
          <TabsList>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="outline" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <SearchBarAndFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              showPinnedOnly={showPinnedOnly}
              setShowPinnedOnly={setShowPinnedOnly}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              onClearAll={
                (userRole === "HR" || userRole === "ADMIN") && announcements.length > 0
                  ? handleClearAll
                  : undefined
              }
              isLoading={loading}
            />

            {filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-300 mt-10">
                <XCircle className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold">No announcements found</h2>
              </div>
            ) : (
              <AnnouncementsGrid
                announcements={filteredAnnouncements}
                // Optional for pin/unpin or delete
                onPinToggle={(userRole === "HR" || userRole === "ADMIN") ? handlePinToggle : undefined}
                onDelete={(userRole === "HR" || userRole === "ADMIN") ? handleDeleteAnnouncement : undefined}
                loading={loading}
              />
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="flex justify-end mb-3">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllRead}>
                  Mark All Read
                </Button>
              )}
            </div>

            <div className="rounded-lg p-2 shadow-md min-h-[200px]">
              <AnimatePresence>
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NotificationListCard
                      title={notif.message}
                      time={notif.createdAt}
                      isNew={!notif.isRead}
                      onClose={async () => {
                        await markNotificationAsRead(notif.id);
                      }}
                      onClick={() => handleViewDetails(notif)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {notifications.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">No notifications found.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
