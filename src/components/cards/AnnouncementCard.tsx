"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CustomPagination from "@/components/ui/Paginationn";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ExtendedAnnouncement } from "@/types/ExtendedAnnouncement";
import { Skeleton } from "@/components/ui/skeleton";

type TabType = "latest" | "pinned" | "archived";

const ITEMS_PER_PAGE = 3;

function stripHTML(html: string): string {
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }
  return html.replace(/<[^>]+>/g, "");
}

const AnnouncementCard: React.FC = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";

  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>("latest");

  // Add separate state for latest pagination
  const [latestPage, setLatestPage] = useState<number>(1);
  const [pinnedPage, setPinnedPage] = useState<number>(1);
  const [archivedPage, setArchivedPage] = useState<number>(1);
  const [highlightPinnedId, setHighlightPinnedId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else if (data && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // Check for new pinned announcements (created within last 5 minutes)
  useEffect(() => {
    const pinned = announcements.filter((a) => a.pinned && !a.archived);
    const newThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    const now = Date.now();
    const newPinned = pinned.find(
      (a) => now - new Date(a.dateCreated).getTime() < newThreshold
    );
    if (newPinned) {
      setSelectedTab("pinned");
      setHighlightPinnedId(newPinned.id);
      const timer = setTimeout(() => {
        setHighlightPinnedId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [announcements]);

  // Updated function to only filter announcements based on the tab.
  const getAnnouncementsForTab = (tab: TabType) => {
    if (tab === "latest") {
      return announcements.filter((a) => !a.archived && !a.pinned);
    }
    if (tab === "pinned") {
      return announcements.filter((a) => a.pinned && !a.archived);
    }
    if (tab === "archived") {
      return announcements.filter((a) => a.archived);
    }
    return [];
  };

  // Pagination logic for latest announcements
  const latestData = getAnnouncementsForTab("latest");
  const totalLatestPages = Math.ceil(latestData.length / ITEMS_PER_PAGE);
  const paginatedLatestData = latestData.slice(
    (latestPage - 1) * ITEMS_PER_PAGE,
    latestPage * ITEMS_PER_PAGE
  );

  // Pagination logic for pinned announcements
  const pinnedData = getAnnouncementsForTab("pinned");
  const totalPinnedPages = Math.ceil(pinnedData.length / ITEMS_PER_PAGE);
  const paginatedPinnedData = pinnedData.slice(
    (pinnedPage - 1) * ITEMS_PER_PAGE,
    pinnedPage * ITEMS_PER_PAGE
  );

  // Pagination logic for archived announcements
  const archivedData = getAnnouncementsForTab("archived");
  const totalArchivedPages = Math.ceil(archivedData.length / ITEMS_PER_PAGE);
  const paginatedArchivedData = archivedData.slice(
    (archivedPage - 1) * ITEMS_PER_PAGE,
    archivedPage * ITEMS_PER_PAGE
  );

  const handlePinToggle = async (announcement: ExtendedAnnouncement) => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements/pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: announcement.id, pinned: !announcement.pinned }),
      });
      if (!res.ok) throw new Error("Failed to update pin state");
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcement.id ? { ...a, pinned: !a.pinned } : a
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementID: id }),
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      await res.json();
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnnouncementItem = (a: ExtendedAnnouncement) => {
    const plainText = stripHTML(a.text);
    // If this is a pinned announcement that should be highlighted, add a ring.
    const highlightClass =
      selectedTab === "pinned" && highlightPinnedId === a.id
        ? "ring-2 ring-yellow-500"
        : "";
    return (
      <motion.div
        key={a.id}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 2 }}
        transition={{ duration: 0.1 }}
        className={`p-1 border rounded mb-1 bg-white dark:bg-gray-700 shadow-sm ${highlightClass}`}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">{a.title}</h3>
          {(userRole === "HR" || userRole === "ADMIN") && (
            <div className="flex space-x-1">
              <Button variant="outline" size="xs" onClick={() => handlePinToggle(a)}>
                {a.pinned ? "Unpin" : "Pin"}
              </Button>
              <Button variant="destructive" size="xs" onClick={() => handleDeleteAnnouncement(a.id)}>
                Delete
              </Button>
            </div>
          )}
        </div>
        <p className="mt-1 text-[10px] text-gray-600 dark:text-gray-300 truncate">
          {plainText}
        </p>
        <div className="mt-1 flex justify-between items-center">
          <span className="text-[9px] text-gray-400">
            {new Date(a.dateCreated).toLocaleDateString()}
          </span>
          <Link href={`/announcements/${a.id}`}>
            <Button variant="link" size="xs">
              Read More
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg p-2 rounded-lg">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">Announcements</CardTitle>
      </CardHeader>
      <CardContent className="px-2 py-2">
        <Tabs value={selectedTab} onValueChange={(val) => setSelectedTab(val as TabType)}>
          <TabsList className="mb-1 flex gap-1">
            <TabsTrigger value="latest" className="text-xs px-2">
              Latest
            </TabsTrigger>
            <TabsTrigger value="pinned" className="text-xs px-2">
              Pinned
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-2">
              Archived
            </TabsTrigger>
          </TabsList>

          {/* Latest Tab */}
          <TabsContent value="latest">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full animate-pulse" />
                <Skeleton className="h-6 w-full animate-pulse" />
                <Skeleton className="h-6 w-full animate-pulse" />
              </div>
            ) : !loading && latestData.length === 0 ? (
              <p className="text-gray-500 text-[10px]">No announcements found.</p>
            ) : (
              <>
                <AnimatePresence>
                  {paginatedLatestData.map(renderAnnouncementItem)}
                </AnimatePresence>
                {totalLatestPages > 1 && (
                  <div className="mt-1 flex justify-center text-xs">
                    <CustomPagination
                      currentPage={latestPage}
                      totalPages={totalLatestPages}
                      onPageChange={(page: number) => setLatestPage(page)}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Pinned Tab */}
          <TabsContent value="pinned">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full animate-pulse" />
                <Skeleton className="h-6 w-full animate-pulse" />
                <Skeleton className="h-6 w-full animate-pulse" />
              </div>
            ) : !loading && pinnedData.length === 0 ? (
              <p className="text-gray-500 text-[10px]">No pinned announcements found.</p>
            ) : (
              <>
                <AnimatePresence>
                  {paginatedPinnedData.map(renderAnnouncementItem)}
                </AnimatePresence>
                {totalPinnedPages > 1 && (
                  <div className="mt-1 flex justify-center text-xs">
                    <CustomPagination
                      currentPage={pinnedPage}
                      totalPages={totalPinnedPages}
                      onPageChange={(page: number) => setPinnedPage(page)}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Archived Tab */}
          <TabsContent value="archived">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full animate-pulse" />
                <Skeleton className="h-6 w-full animate-pulse" />
                <Skeleton className="h-6 w-full animate-pulse" />
              </div>
            ) : !loading && archivedData.length === 0 ? (
              <p className="text-gray-500 text-[10px]">No archived announcements found.</p>
            ) : (
              <>
                <AnimatePresence>
                  {paginatedArchivedData.map(renderAnnouncementItem)}
                </AnimatePresence>
                {totalArchivedPages > 1 && (
                  <div className="mt-1 flex justify-center text-xs">
                    <CustomPagination
                      currentPage={archivedPage}
                      totalPages={totalArchivedPages}
                      onPageChange={(page: number) => setArchivedPage(page)}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-1 text-right">
          <Link href="/announcements" className="text-xs text-blue-500 hover:underline">
            View All Announcements
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
