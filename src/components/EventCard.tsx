// src/components/EventCard.tsx
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { Event } from "@/types/events";
import TimeAgo from "javascript-time-ago";

type EventCardProps = {
  event: Event;
  timeAgo: TimeAgo;
};

export default function EventCard({ event, timeAgo }: EventCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-lg bg-black bg-opacity-20 p-4 shadow transition-shadow hover:shadow-md"
    >
      <Link href={event.linkTo || "#"} className="block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon icon={event.icon} className="text-2xl text-indigo-300" />
            <span className="text-sm font-semibold uppercase text-indigo-300">
              {event.type}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Icon icon="ph:clock" />
            <span>{timeAgo.format(event.date)}</span>
          </div>
        </div>
        <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
        <p className="mt-1 text-sm text-gray-300">{event.text}</p>
      </Link>
    </motion.div>
  );
}