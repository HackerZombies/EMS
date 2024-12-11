import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Announcement } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "../../lib/prisma";
import { GetServerSideProps } from "next";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

// Server-side props fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let announcements: Announcement[] = [];
  if (session?.user) {
    announcements = await prisma.announcement.findMany();
  }
  return {
    props: {
      initialAnnouncements: announcements,
    },
  };
};

// Deleting announcement function
async function deleteAnnouncement(announcementID: string) {
  const response = await fetch("api/announcements/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ announcementID }),
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.json();
}

// Main component
export default function Announcements({
  initialAnnouncements,
}: {
  initialAnnouncements: Announcement[];
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const session = useSession();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const converttoReadable = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-GB", options);
  };

  const toggleCollapse = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  const handleDeleteAnnouncement = async (announcementID: string) => {
    try {
      setLoading(true); // Start loading when a deletion starts
      await deleteAnnouncement(announcementID);
      const updated = announcements.filter(
        (announcement) => announcement.id !== announcementID
      );
      setAnnouncements(updated);
    } catch (error) {
      console.error("Error deleting announcement: ", error);
    } finally {
      setLoading(false); // Stop loading after the operation
    }
  };

  const handleClearAll = async () => {
    try {
      setLoading(true); // Start loading when clearing all announcements
      await Promise.all(announcements.map(announcement => deleteAnnouncement(announcement.id)));
      setAnnouncements([]);
    } catch (error) {
      console.error("Error clearing announcements: ", error);
    } finally {
      setLoading(false); // Stop loading after the operation
    }
  };

  const list = {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        <title>EMS - Announcements</title>
      </Head>
      <div className="flex flex-col gap-5 p-5 bg-gradient-to-b from-gray-800 to-black min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl md:text-4xl p-2 font-semibold text-white">Announcements</h1>
          {session.data?.user.role === "HR" && (
            <Link href="/announcements/new">
              <button className="bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl mt-2 md:mt-0">
                Create Announcement
              </button>
            </Link>
          )}
        </div>
        {session.data?.user.role === "HR" && (
          <button
            onClick={handleClearAll}
            disabled={loading}
            className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold py-2 px-2 rounded-md shadow-lg mt-4 transition-transform transform hover:scale-105 hover:shadow-xl"
          >
            {loading ? "Clearing..." : "Clear All"}
          </button>
        )}
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-400">
            <Icon icon="ph:megaphone-light" width="8em" />
            <h1 className="text-2xl font-semibold px-2">No announcements</h1>
            {session.data?.user.role === "HR" && (
              <p className="text-gray-500">
                Click &apos;Create Announcement&apos; to add one.
              </p>
            )}
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={list}
          >
            {announcements.map((announcement, index) => (
              <motion.div
                className="flex flex-col bg-gray-900 bg-opacity-80 rounded-lg p-4 text-white shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl"
                variants={item}
                key={announcement.id}
              >
                <button
                  type="button"
                  className={`w-full text-left transition-colors duration-300 ${expandedIndex === index ? "text-green-400" : "text-white"}`}
                  onClick={() => toggleCollapse(index)}
                >
                  <h1 className="text-2xl md:text-3xl font-bold">{announcement.title}</h1>
                  <h2 className="font-medium text-sm md:text-base">
                    {converttoReadable(new Date(announcement.dateCreated))}
                  </h2>
                </button>
                <div
                  className={`relative flex flex-col overflow-hidden border-t border-gray-600 p-2 ${expandedIndex === index ? "" : "hidden"}`}
                >
                  <p className="mt-1 max-h-64 overflow-auto">{announcement.text}</p>
                  {session.data?.user.role === "HR" && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        disabled={loading}
                        className="mt-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold py-1 px-3 rounded-md shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl"
                      >
                        {loading ? "Deleting..." : "Remove"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
