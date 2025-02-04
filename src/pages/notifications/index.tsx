import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { ScrollArea } from "@/components/ui/scroll-area";
// Updated import: Use NotificationListCard instead of NotificationCard
import { NotificationListCard } from "@/components/NotificationCard";
import {
  useSidebarNotifications,
  NotificationItem,
} from "@/hooks/useSidebarNotifications";

export default function NotificationsPage() {
  const router = useRouter();

  // 1) Use your hook (polls every 10 seconds by default)
  const {
    notifications,
    loading,
    error,
    markNotificationAsRead,
  } = useSidebarNotifications();

  // 2) Handle user clicking a notification
  async function handleViewDetails(notif: NotificationItem) {
    // Mark as read in the DB + locally
    await markNotificationAsRead(notif.id);

    // If there's a targetUrl, navigate there
    // Adjust your NotificationItem type to include `targetUrl?: string`
    // if needed.
    // if (notif.targetUrl) {
    //   router.push(notif.targetUrl)
    // }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-white">All Notifications</h1>

      {/* Loading / Error states */}
      {loading && <p className="text-white">Loading notifications...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <ScrollArea className="w-full max-h-[75vh] bg-transparent rounded-md">
        <div className="space-y-4">
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
                  // 3) On click, mark as read & optionally navigate
                  onClick={() => handleViewDetails(notif)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* If no notifications */}
          {notifications.length === 0 && !loading && (
            <p className="text-sm text-gray-300">No notifications found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
