// components/EventSummary.tsx
import { motion } from "framer-motion";
import { Event } from "@/types/events";
import Link from "next/link"; // Import Link from Next.js

type EventsSummaryProps = {
  events: Event[];
};

const routeMapping: Record<string, string> = {
  announcements: "/announcements",
  leave: "/leave",
  documents: "/documents",
  // Add more mappings as needed
};

export default function EventsSummary({ events }: EventsSummaryProps) {
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-lg bg-black bg-opacity-20 p-4 md:p-6 shadow-lg"
    >
      <h2 className="mb-4 text-xl md:text-2xl font-bold">Events Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Responsive grid */}
        {Object.entries(eventCounts).map(([type, count]) => (
          <Link key={type} href={routeMapping[type] || '#'} passHref>
            <div className="rounded-lg bg-black bg-opacity-20 p-4 cursor-pointer hover:bg-opacity-30 transition">
              <h3 className="text-base md:text-lg font-semibold capitalize text-white hidden md:block">
                {type}
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-teal-500">{count.toString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}