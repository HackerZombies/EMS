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
import { useState, useCallback, useEffect } from "react";
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

// The new bento-grid-based display
import { AnnouncementsGrid } from "@/components/AnnouncementsGrid";

// Fetch announcements from the server
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
      OR: [{ roleTargets: { has: userRole } }, { roleTargets: { equals: [] } }],
    },
    orderBy: [{ pinned: "desc" }, { dateCreated: "desc" }],
  });

  return {
    props: {
      initialAnnouncements: JSON.parse(JSON.stringify(announcements)) as ExtendedAnnouncement[],
    },
  };
};

// Helper functions
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

  // State for announcements and filters
  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>(initialAnnouncements);
  const [loading, setLoading] = useState(false);
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

  // Filter logic for announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.text.toLowerCase().includes(searchTerm.toLowerCase());

    if (showPinnedOnly && !a.pinned) return false;
    if (!showArchived && a.archived) return false;

    return matchesSearch;
  });

  // Handlers
  async function handlePinToggle(a: ExtendedAnnouncement) {
    try {
      setLoading(true);
      await togglePinAnnouncement(a.id, !a.pinned);
      setAnnouncements((prev) =>
        prev.map((ann) => (ann.id === a.id ? { ...ann, pinned: !ann.pinned } : ann))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      setLoading(true);
      await deleteAnnouncementById(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to delete ALL announcements?")) {
      return;
    }
    try {
      setLoading(true);
      await Promise.all(announcements.map((a) => deleteAnnouncementById(a.id)));
      setAnnouncements([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetails(notif: NotificationItem) {
    await markNotificationAsRead(notif.id);
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    }
  }

  // Use a controlled Tabs state
  const [selectedTab, setSelectedTab] = useState("announcements");
  useEffect(() => {
    if (router.query.tab && typeof router.query.tab === "string") {
      setSelectedTab(router.query.tab);
    }
  }, [router.query.tab]);

  const userRole = session?.user.role || "";

  return (
    <>
      <Head>
        <title>EMS - Announcements</title>
      </Head>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Container with less padding to make layout more compact */}
      <div className="p-2 md:p-4 min-h-screen bg-gray-50 text-gray-900 rounded-lg">
        <div className="max-w-7xl mx-auto w-full">
          {/* 
            Removed the "All Updates" heading; 
            If you want a subtle heading, you can keep a smaller label here:
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">Updates</h2>
          */}

          {/* Tabs with a tighter design */}
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="space-y-2"
          >
            <TabsList className="bg-gray-200 rounded-md p-1 flex space-x-1">
              <TabsTrigger
                value="announcements"
                className="text-xs font-medium px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded"
              >
                Announcements
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="text-xs font-medium px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded"
              >
                Notifications
                {unreadCount > 0 && (
                  <Badge
                    variant="default"
                    className="ml-2 bg-yellow-300 text-black text-[10px] font-semibold"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="mt-3">
              <div className="flex items-center justify-between mb-3">
                {(userRole === "HR" || userRole === "ADMIN") && (
                  <Link href="/announcements/new">
                    {/* A green button, smaller style */}
                    <Button
                      variant="default"
                      className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 border-none"
                    >
                      Create
                    </Button>
                  </Link>
                )}
              </div>

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
                // Pass smaller prop (if you want to customize the search bar styling)
                className="mb-3"
              />

              {filteredAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 mt-10">
                  <XCircle className="w-10 h-10 mb-2" />
                  <h2 className="text-sm font-semibold">No announcements found</h2>
                </div>
              ) : (
                <AnnouncementsGrid
                  announcements={filteredAnnouncements}
                  onPinToggle={
                    userRole === "HR" || userRole === "ADMIN"
                      ? handlePinToggle
                      : undefined
                  }
                  onDelete={
                    userRole === "HR" || userRole === "ADMIN"
                      ? handleDeleteAnnouncement
                      : undefined
                  }
                  loading={loading}
                />
              )}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-3">
              <div className="flex justify-end mb-2">
                {unreadCount > 0 && (
                  <Button
                    variant="default"
                    onClick={handleMarkAllRead}
                    className="h-6 px-2 text-xs bg-teal-600 hover:bg-teal-700 border-none"
                  >
                    Mark All Read
                  </Button>
                )}
              </div>

              <div className="rounded-lg p-2 shadow-sm bg-white min-h-[200px] text-sm">
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
                        onClick={() => handleViewDetails(notif)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {notifications.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">No notifications found.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
