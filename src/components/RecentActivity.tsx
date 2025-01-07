// src/components/RecentActivity.tsx

import { useRouter } from "next/router";
import { formatDistanceToNow } from "date-fns"; // For relative time formatting
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Event {
  id: string;
  type: "Announcements" | "Help" | "Leave" | "Documents" | "Attendance";
  icon: string;
  date: string; // ISO string
  title: string;
  text: string;
  linkTo?: string;
}

interface RecentActivityListProps {
  events: Event[];
  userName: string;
}

export default function RecentActivityList({
  events,
  userName,
}: RecentActivityListProps) {
  const router = useRouter();

  return (
    <Card className="bg-zinc-900/90 border-zinc-800 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold text-zinc-100">
              Recent Activity
            </CardTitle>
            
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              icon="lucide:clock"
              className="w-12 h-12 text-zinc-600 mx-auto mb-3"
            />
            <p className="text-zinc-400">No recent activities found.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 hover:bg-zinc-700 transition-colors cursor-pointer"
                onClick={() => event.linkTo && router.push(event.linkTo)}
              >
                <Icon
                  icon={event.icon}
                  className="w-10 h-10 text-yellow-500 mr-4"
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-zinc-100">
                    {event.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{event.text}</p>
                </div>
                <p className="text-sm text-zinc-500 ml-4">
                  {formatDistanceToNow(new Date(event.date), {
                    addSuffix: true,
                  })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
