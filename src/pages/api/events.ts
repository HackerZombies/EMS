// src/pages/api/events.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { Event } from "@/types/events";
import { formatToIST } from "@/lib/timezone";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Get the session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ events: [], userName: "Unknown User" });
    }

    const limit = 4;

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    });

    if (!user) {
      return res.status(200).json({
        events: [],
        userName: "Unknown User",
      });
    }

    // Construct userName from firstName, middleName, and lastName
    const userName = [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Unknown User";

    // Define the time threshold for event expiration (24 hours ago)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch all relevant events within the last 24 hours
    const [announcements, tickets, leaves, documents, attendanceRecords] =
      await Promise.all([
        prisma.announcement.findMany({
          where:
            user.role === "HR"
              ? { dateCreated: { gte: twentyFourHoursAgo } }
              : {
                  role: { in: [user.role, "EMPLOYEE"] },
                  dateCreated: { gte: twentyFourHoursAgo },
                },
          orderBy: { dateCreated: "desc" },
        }),
        prisma.ticket.findMany({
          where: {
            userUsername: user.username,
            dateCreated: { gte: twentyFourHoursAgo },
          },
          orderBy: { dateCreated: "desc" },
        }),
        prisma.leaveRequest.findMany({
          where: {
            userUsername: user.username,
            dateCreated: { gte: twentyFourHoursAgo },
          },
          orderBy: { dateCreated: "desc" },
        }),
        prisma.document.findMany({
          where: {
            userUsername: user.username,
            dateCreated: { gte: twentyFourHoursAgo },
          },
          orderBy: { dateCreated: "desc" },
        }),
        prisma.attendance.findMany({
          where: {
            userUsername: user.username,
            date: { gte: twentyFourHoursAgo },
          },
          orderBy: { date: "desc" },
        }),
      ]);

    // Transform and combine all events into a single list
    const transformedAnnouncements = announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      type: "Announcements" as const,
      icon: "ph:megaphone-bold",
      date: formatToIST(announcement.dateCreated),
      title: announcement.title,
      text: announcement.text,
      linkTo: "/announcements",
      originalType: 'announcement' as const,
      originalId: announcement.id,
    }));

    const transformedTickets = tickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "Help" as const,
      icon: "ph:chats-circle-bold",
      date: formatToIST(ticket.dateCreated),
      title: `You created a ticket (#${ticket.id})`,
      text: ticket.subject,
      linkTo: `/help/ticket/${ticket.id}`,
      originalType: 'ticket' as const,
      originalId: ticket.id,
    }));

    const transformedLeaves = leaves.map((leave) => ({
      id: `leave-${leave.id}`,
      type: "Leave" as const,
      icon: "ph:calendar-check",
      date: formatToIST(leave.dateCreated),
      title: `Leave request (${leave.requestStatus})`,
      text: leave.reason,
      linkTo: "/leave",
      originalType: 'leave' as const,
      originalId: leave.id,
    }));

    const transformedDocuments = documents.map((document) => ({
      id: `document-${document.id}`,
      type: "Documents" as const,
      icon: "ph:folder-open",
      date: formatToIST(document.dateCreated),
      title: `Document uploaded (${document.filename})`,
      text: "Document available for review.",
      linkTo: "/documents",
      originalType: 'document' as const,
      originalId: document.id,
    }));

    const transformedAttendance = attendanceRecords.map((record) => ({
      id: `attendance-${record.id}`,
      type: "Attendance" as const,
      icon: "ph:clock",
      date: formatToIST(record.date),
      title: "Attendance recorded",
      text: `Check-in: ${
        record.checkInTime ? formatToIST(record.checkInTime) : "N/A"
      } | Check-out: ${
        record.checkOutTime ? formatToIST(record.checkOutTime) : "N/A"
      }`,
      linkTo: "/attendance",
      originalType: 'attendance' as const,
      originalId: record.id,
    }));

    // Combine all transformed events
    const allEvents: EventWithOriginal[] = [
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

    // Get the latest four events
    const latestEvents = allEvents.slice(0, limit);

    // Remove originalType and originalId before sending to the client
    const latestEventsForClient: Event[] = latestEvents.map(
      ({ originalType, originalId, ...rest }) => rest
    );

    res.status(200).json({
      events: latestEventsForClient,
      userName,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Define an extended Event type to keep track of original type and id
interface EventWithOriginal extends Event {
  originalType: 'announcement' | 'ticket' | 'leave' | 'document' | 'attendance';
  originalId: string;
}
