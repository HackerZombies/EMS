// src/pages/index.tsx

import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { Event } from "@/types/events";
import useSWR from "swr";
import { formatToIST } from "@/lib/timezone";

import RecentActivityList from "@/components/RecentActivity";

interface HomeProps {
  initialEvents: Event[];
  userName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home({ initialEvents, userName }: HomeProps) {
  const { data, error } = useSWR("/api/events", fetcher, { refreshInterval: 5000 });
  const events = data?.events || initialEvents;
  const displayedUserName = data?.userName || userName;

  if (error) return <div>Failed to load events.</div>;
  if (!events) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white">
      <header className="py-6 px-8 shadow-md bg-zinc-800">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-lg">Welcome, {displayedUserName}</p>
      </header>

      <main className="p-6 space-y-8">
        <section>
          <RecentActivityList events={events} userName={displayedUserName} />
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  context: GetServerSidePropsContext
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const events: Event[] = [];
  let userName = "Unknown User";

  if (session) {
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    });

    if (user) {
      userName =
        [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") ||
        "Unknown User";

      // Fetch the latest four events, similar to the API route
      const limit = 4;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [announcements, tickets, leaves, documents, attendanceRecords] =
        await Promise.all([
          prisma.announcement.findMany({
            where:
              user.role === "HR"
                ? {
                    dateCreated: {
                      gte: twentyFourHoursAgo,
                    },
                  }
                : {
                    // For non-HR users, only fetch announcements targeted to them or global announcements.
                    OR: [
                      { roleTargets: { has: user.role } },
                      { roleTargets: { equals: [] } },
                    ],
                    dateCreated: {
                      gte: twentyFourHoursAgo,
                    },
                  },
            orderBy: { dateCreated: "desc" },
          }),
          prisma.ticket.findMany({
            where: {
              userUsername: user.username,
              dateCreated: {
                gte: twentyFourHoursAgo,
              },
            },
            orderBy: { dateCreated: "desc" },
          }),
          prisma.leaveRequest.findMany({
            where: {
              userUsername: user.username,
              dateCreated: {
                gte: twentyFourHoursAgo,
              },
            },
            orderBy: { dateCreated: "desc" },
          }),
          prisma.document.findMany({
            where: {
              userUsername: user.username,
              dateCreated: {
                gte: twentyFourHoursAgo,
              },
            },
            orderBy: { dateCreated: "desc" },
          }),
          prisma.attendance.findMany({
            where: {
              userUsername: user.username,
              date: {
                gte: twentyFourHoursAgo,
              },
            },
            orderBy: { date: "desc" },
          }),
        ]);

      const transformedAnnouncements = announcements.map((announcement) => ({
        id: `announcement-${announcement.id}`,
        type: "Announcements" as const,
        icon: "ph:megaphone-bold",
        date: formatToIST(new Date(announcement.dateCreated)),
        title: announcement.title,
        text: announcement.text,
        linkTo: "/announcements",
      }));

      const transformedTickets = tickets.map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: "Help" as const,
        icon: "ph:chats-circle-bold",
        date: formatToIST(new Date(ticket.dateCreated)),
        title: `You created a ticket (#${ticket.id})`,
        text: ticket.subject,
        linkTo: `/help/ticket/${ticket.id}`,
      }));

      const transformedLeaves = leaves.map((leave) => ({
        id: `leave-${leave.id}`,
        type: "Leave" as const,
        icon: "ph:calendar-check",
        date: formatToIST(new Date(leave.dateCreated)),
        title: `Leave request (${leave.requestStatus})`,
        text: leave.reason,
        linkTo: "/leave",
      }));

      const transformedDocuments = documents.map((document) => ({
        id: `document-${document.id}`,
        type: "Documents" as const,
        icon: "ph:folder-open",
        date: formatToIST(new Date(document.dateCreated)),
        title: `Document uploaded (${document.filename})`,
        text: "Document available for review.",
        linkTo: "/documents",
      }));

      const transformedAttendance = attendanceRecords.map((record) => ({
        id: `attendance-${record.id}`,
        type: "Attendance" as const,
        icon: "ph:clock",
        date: formatToIST(new Date(record.date)),
        title: "Attendance recorded",
        text: `Check-in: ${
          record.checkInTime ? formatToIST(new Date(record.checkInTime)) : "N/A"
        } | Check-out: ${
          record.checkOutTime ? formatToIST(new Date(record.checkOutTime)) : "N/A"
        }`,
        linkTo: "/attendance",
      }));

      // Combine all transformed events
      const allEvents: Event[] = [
        ...transformedAnnouncements,
        ...transformedTickets,
        ...transformedLeaves,
        ...transformedDocuments,
        ...transformedAttendance,
      ];

      // Sort all events by date descending
      allEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Take only the latest four events
      const latestEvents = allEvents.slice(0, limit);

      events.push(...latestEvents);
    }
  }

  return {
    props: {
      initialEvents: events,
      userName,
    },
  };
};
