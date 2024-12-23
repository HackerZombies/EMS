// components/Home.tsx
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { Event } from "@/types/events";
import EventCard from "@/components/EventCard";
import WelcomeMessage from "@/components/WelcomeMessage";
import EventsSummary from "@/components/EventSummary";
import Link from "next/link";

TimeAgo.addLocale(en);

type HomePageProps = { events: Event[]; user: any; currentPage: number; totalPages: number; };

export default function HomePage({ events, user, currentPage, totalPages }: HomePageProps) {
  const timeAgo = new TimeAgo("en-US");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-600 to-gray-950 bg-opacity-20 rounded-lg">
      <div className="container mx-auto px-4 py-8">
        <WelcomeMessage user={user} />
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg bg-black bg-opacity-10 p-6 shadow-lg"
          >
            <h2 className="mb-4 text-2xl font-bold">Recent Activity</h2>
            <div className="space-y-4">
              {events.slice(0, 5).map((event, index) => (
                <EventCard key={index} event={event} timeAgo={timeAgo} />
              ))}
            </div>
          </motion.div>
          <div className="space-y-8">
            <EventsSummary events={events} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg bg-gray-800 bg-opacity-80 p-6 shadow-lg"
            >
              <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton icon="ph:clock" text="Attendance" href="/attendance" />
                <QuickActionButton icon="ph:airplane-takeoff-bold" text="Request Leave" href="/leave" />
                <QuickActionButton icon="ph:file-text-bold" text="Get Payslips" href="/documents" />
                <QuickActionButton icon="ph:chats-circle-bold" text="CreateTicket" href="/help" />
                <QuickActionButton icon="ph:megaphone-bold" text="Alerts" href="/announcements" />
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Pagination Controls */}
        <div className="mt-8 flex justify-center">
          {currentPage > 1 && (
            <Link href={`/?page=${currentPage - 1}`} className="mx-2 rounded-lg bg-gray-700 bg-opacity-80 p-2 text-indigo-200 hover:bg-gray-600">
              Previous
            </Link>
          )}
          <span className="mx-2 text-indigo-200">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={`/?page=${currentPage + 1}`} className="mx-2 rounded-lg bg-gray-700 bg-opacity-80 p-2 text-indigo-200 hover:bg-gray-600">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, text, href }: { icon: string; text: string; href: string }) {
  return (
    <a href={href} className="flex items-center justify-center rounded-lg bg-gray-700 bg-opacity-80 p-4 text-indigo-200 transition-colors hover:bg-gray-600">
      <Icon icon={icon} className="mr-2 text-2xl" />
      <span className="font-medium">{text}</span> </a>
  );
}