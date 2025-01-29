// src/pages/help/ticket/[id].tsx

'use client';

import Head from "next/head";
import axios from "axios";
import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import { Ticket, Prisma } from "@prisma/client";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button"; // shadcn UI Button
import { Textarea } from "@/components/ui/textarea"; // shadcn UI Textarea
import { Send, UserCircle } from "lucide-react"; // Lucide-react icons
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify"; // react-toastify for toasts
import "react-toastify/dist/ReactToastify.css"; // react-toastify styles
import TicketStatus from "@/components/TicketStatus";
import { prisma } from "@/lib/prisma"; // Ensure correct import

const messageWithUser = Prisma.validator<Prisma.MessageDefaultArgs>()({
  include: { user: true },
});

type MessageWithUser = Prisma.MessageGetPayload<typeof messageWithUser>;

type Props = {
  ticket: Ticket | null;
  messages: MessageWithUser[];
};

export default function UserTicket({ ticket: initialTicket, messages }: Props) {
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(initialTicket);
  const [message, setMessage] = useState<string>("");
  const [commentList, setCommentList] = useState<MessageWithUser[]>(messages);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  
  // Adjust based on actual admin roles
  const isAdmin =
    session?.user?.role === "HR" || session?.user?.role === "ADMIN";

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">Ticket Not Found</h1>
          <p className="text-gray-700">The ticket you are looking for does not exist.</p>
          <BackButton className="mt-4" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (message.trim() === "") {
      toast.error("Please type a message before sending.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/tickets/newMessage", {
        message,
        username: session?.user?.username,
        ticketId: ticket.id,
      });

      const newComment: MessageWithUser = response.data;
      setCommentList([...commentList, newComment]);
      setMessage("");
      toast.success("Message sent successfully!");
    } catch (error: any) {
      console.error("Error creating comment:", error);
      toast.error(error.response?.data?.message || "Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = ticket.status === "Resolved" ? "Unresolved" : "Resolved";

    setIsUpdatingStatus(true);

    try {
      const response = await axios.post("/api/tickets/updateStatus", {
        ticketId: ticket.id,
        newStatus,
      });

      const updatedTicket: Ticket = response.data;
      setTicket(updatedTicket);
      toast.success(
        `Ticket marked as ${updatedTicket.status === "Resolved" ? "Resolved" : "Unresolved"}!`
      );
    } catch (error: any) {
      console.error("Error changing ticket status:", error);
      toast.error(error.response?.data?.message || "Failed to update ticket status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const list = {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        when: "afterChildren",
      },
    },
  };

  const item = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "tween" },
    },
    hidden: { opacity: 0, y: 10 },
  };

  return (
    <>
      <Head>
        <title>Ticket #{ticket.id} - EMS</title>
      </Head>
      <div className="min-h-screen p-6 flex flex-col items-center">
        {/* Back Button */}
        <div className="self-start mb-6">
          <BackButton />
        </div>

        {/* Ticket Details */}
        <div className="w-full max-w-3xl  rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Ticket #{ticket.id}</h1>
              <h2 className="text-2xl font-bold text-green-400">{ticket.subject}</h2>
            </div>
            <div className="flex flex-row items-center gap-4">
              <TicketStatus status={ticket.status} />
              {isAdmin && (
                <Button
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  variant={ticket.status === "Resolved" ? "ghost" : "destructive"}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105 disabled:opacity-50"
                  aria-label={
                    ticket.status === "Resolved"
                      ? "Mark ticket as unresolved"
                      : "Mark ticket as resolved"
                  }
                >
                  {isUpdatingStatus ? (
                    <>
                      {/* Loading Spinner */}
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      {/* Loading Text */}
                      Updating...
                    </>
                  ) : (
                    <>
                      {ticket.status === "Resolved" ? "Mark as Unresolved" : "Mark as Resolved"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <motion.div
          className="w-full max-w-3xl flex flex-col gap-4"
          initial="hidden"
          animate="visible"
          variants={list}
        >
          {commentList.map((comment) => (
            <motion.div
              key={comment.id}
              variants={item}
              className={`flex flex-col p-4 rounded-lg shadow-md ${
                comment.userUsername === session?.user?.username
                  ? "bg--500 self-end"
                  : "bg-gray-100 self-start"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-6 h-6 text-white" />
                  <span className="font-medium text-teal-300">
                    {comment.userUsername === session?.user?.username
                      ? "You"
                      : `${comment.user.firstName} ${comment.user.lastName}`}
                  </span>
                </div>
                <span className="text-sm text-white">
                  {new Date(comment.dateCreated).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-100">{comment.text}</p>
            </motion.div>
          ))}

          {/* New Message Input */}
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 mt-4"
            variants={item}
          >
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-none"
              aria-label="Message"
              required
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="default"
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105 disabled:opacity-50"
              aria-label="Send Message"
            >
              {isSubmitting ? (
                <>
                  {/* Loading Spinner */}
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  {/* Loading Text */}
                  Sending...
                </>
              ) : (
                <>
                  {/* Submit Text and Icon */}
                  Send <Send className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.form>
        </motion.div>

        {/* Toast Notifications */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { props: { ticket: null, messages: [] } };
  }

  try {
    const ticketId = context.params?.id as string; // Ensure id is a string

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return {
        notFound: true,
      };
    }

    const messages = await prisma.message.findMany({
      where: { ticketId: ticketId },
      include: { user: true },
      orderBy: { dateCreated: "asc" }, // Order messages chronologically
    });

    return {
      props: {
        ticket,
        messages,
      },
    };
  } catch (error: any) {
    console.error("Error fetching ticket details:", error);
    return { props: { ticket: null, messages: [] } };
  }
};
