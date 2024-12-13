import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import HomePage from "@/components/Home"; // Ensure this matches the file name
import { Event, Announcement } from "@/types/events";

export default function Home({ events, user, currentPage, totalPages }: { events: Event[], user: any, currentPage: number, totalPages: number }) {
  return <HomePage events={events} user={user} currentPage={currentPage} totalPages={totalPages} />;
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const events: Event[] = [];
  const page = parseInt((context.query.page as string) || "1", 10);
  const limit = 5; // Number of events per page
  const skip = (page - 1) * limit; // Calculate how many events to skip

  if (session) {
    const user = await prisma.user.findUnique({
      where: {
        username: session.user.username,
      },
    });

    // Fetch announcements
    let announcements: Announcement[] = [];
    if (session?.user) {
      if (session.user.role === "HR") {
        announcements = await prisma.announcement.findMany();
      } else {
        announcements = await prisma.announcement.findMany({
          where: { role: { in: [session.user.role, "EMPLOYEE"] } },
        });
      }
    }

    announcements.forEach((announcement) => {
      events.push({
        type: "announcements",
        icon: "ph:megaphone-bold",
        date: announcement.dateCreated,
        title: announcement.title,
        text: announcement.text,
        linkTo: "/announcements",
      });
    });

    // Fetch tickets
    const
    tickets = await prisma.ticket.findMany({
      where: {
        userUsername: session.user.username,
      },
      skip,
      take: limit,
    });

    tickets.forEach((ticket) => {
      events.push({
        type: "help",
        icon: "ph:chats-circle-bold",
        date: ticket.dateCreated,
        title: `You created a ticket (#${ticket.id})`,
        text: ticket.subject,
        linkTo: `/help/ticket/${ticket.id}`,
      });
    });

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        Ticket: {
          userUsername: session.user.username,
        },
        NOT: {
          userUsername: session.user.username,
        },
      },
      include: {
        User: true,
      },
      skip,
      take: limit,
    });

    messages.forEach((message) => {
      events.push({
        type: "help",
        icon: "ph:chats-circle-bold",
        date: message.dateCreated,
        title: `Message received from ${message.User.firstName} ${message.User.lastName} on Ticket #${message.ticketId}`,
        text: message.text,
        linkTo: `/help/ticket/${message.ticketId}`,
      });
    });

    // Fetch leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userUsername: session.user.username,
      },
      skip,
      take: limit,
    });

    leaveRequests.forEach((leaveRequest) => {
      events.push({
        type: "leave",
        icon: "ph:airplane-takeoff-bold",
        date: leaveRequest.dateCreated,
        title: "You submitted a leave request",
        text: `${leaveRequest.startDate.toDateString()} - ${leaveRequest.endDate.toDateString()} (${leaveRequest.reason})`,
        linkTo: "/leave",
      });

      if (leaveRequest.dateResponded) {
        events.push({
          type: "leave",
          icon: "ph:airplane-takeoff-bold",
          date: leaveRequest.dateResponded,
          title: `Your leave request has been ${leaveRequest.requestStatus.toLowerCase()}`,
          text: `${leaveRequest.startDate.toDateString()} - ${leaveRequest.endDate.toDateString()} (${leaveRequest.reason})`,
          linkTo: "/leave",
        });
      }
    });

    // Fetch documents
    const documents = await prisma.document.findMany({
      where: {
        userUsername: session.user.username,
      },
      select: {
        id: true,
        filename: true,
        userUsername: true,
        dateCreated: true,
      },
      skip,
      take: limit,
    });

    documents.forEach((document) => {
      events.push({
        type: "documents",
        icon: "ph:file-text-bold",
        date: document.dateCreated,
        title: "A document was uploaded to your account",
        text: document.filename,
        linkTo: "/documents",
      });
    });

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return { 
    props: { 
      events,
      user: session?.user || null,
      currentPage: page,
      totalPages: Math.ceil(events.length / limit) // Calculate total pages
    } 
  };
};