// src/pages/announcements/index.tsx

'use client';

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
import { Button } from '@/components/ui/button'; // Ensure this import is correct
import { Trash2, ArrowUpSquare, ArrowDownSquare, XCircle } from 'lucide-react'; // Corrected imports
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal } from '@/components/ui/modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Slot } from '@radix-ui/react-slot';

// Extend Announcement type if imageUrl is optional
interface ExtendedAnnouncement extends Announcement {
  imageUrl?: string;
}

// Server-side props fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let announcements: ExtendedAnnouncement[] = [];
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
  const response = await fetch("/api/announcements/delete", { // Ensure the API path is correct
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
  initialAnnouncements: ExtendedAnnouncement[];
}) {
  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>(initialAnnouncements);
  const { data: session } = useSession();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      toast.success('Announcement deleted successfully!');
    } catch (error) {
      console.error("Error deleting announcement: ", error);
      toast.error('Failed to delete announcement.');
    } finally {
      setLoading(false); // Stop loading after the operation
    }
  };

  const handleClearAll = async () => {
    try {
      setLoading(true); // Start loading when clearing all announcements
      await Promise.all(announcements.map(announcement => deleteAnnouncement(announcement.id)));
      setAnnouncements([]);
      toast.success('All announcements cleared successfully!');
    } catch (error) {
      console.error("Error clearing announcements: ", error);
      toast.error('Failed to clear announcements.');
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

  // Optional: Handle Image Preview (if announcements include images)
  const openImageModal = (url: string) => {
    setSelectedImage(url);
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setModalOpen(false);
  };

  return (
    <>
      <Head>
        <title>EMS - Announcements</title>
      </Head>
      <div className=" p-8 rounded-lg shadow-md text-white min-h-screen">
        {/* Toast Notifications */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Announcements</h1>
          {session?.user?.role === "HR" || session?.user?.role === "ADMIN" && (
            <Link href="/announcements/new">
              <Button
                variant="default" // Changed from "primary" to "default"
                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                aria-label="Create Announcement"
              >
                <ArrowUpSquare className="w-5 h-5 mr-2" />
                Create Announcement
              </Button>
            </Link>
          )}
        </div>

        {/* Clear All Button */}
        {session?.user?.role === "HR" && (
          <Button
            onClick={handleClearAll}
            disabled={loading || announcements.length === 0}
            variant="destructive"
            className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 mb-6"
            aria-label="Clear All Announcements"
          >
            {loading ? (
              <>
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
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All
              </>
            )}
          </Button>
        )}

        {/* No Announcements */}
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-400">
            <XCircle className="w-16 h-16 mb-4" />
            <h1 className="text-2xl font-semibold px-2">No announcements</h1>
            {session?.user?.role === "HR" && (
              <p className="text-gray-500">
                Click &apos;Create Announcement&apos; to add one.
              </p>
            )}
          </div>
        ) : (
          /* Announcements List */
          <motion.div
            className="flex flex-col gap-6"
            initial="hidden"
            animate="visible"
            variants={list}
          >
            {announcements.map((announcement, index) => (
              <motion.div
                className="flex flex-col bg-white rounded-lg p-6 shadow-md transition-transform transform hover:scale-105 hover:shadow-lg"
                variants={item}
                key={announcement.id}
              >
                {/* Announcement Header */}
                <button
                  type="button"
                  className={`w-full text-left transition-colors duration-300 ${
                    expandedIndex === index ? "text-green-600" : "text-gray-900"
                  }`}
                  onClick={() => toggleCollapse(index)}
                  aria-expanded={expandedIndex === index}
                  aria-controls={`announcement-content-${index}`}
                >
                  <h2 className="text-2xl font-bold">{announcement.title}</h2>
                  <p className="text-sm text-gray-500">
                    {converttoReadable(new Date(announcement.dateCreated))}
                  </p>
                </button>

                {/* Announcement Content */}
                <div
                  id={`announcement-content-${index}`}
                  className={`mt-4 text-gray-700 ${
                    expandedIndex === index ? "block" : "hidden"
                  }`}
                >
                  <p className="mb-4">{announcement.text}</p>
                  {/* Conditionally render imageUrl if it exists */}
                  {announcement.imageUrl && (
                    <img
                      src={announcement.imageUrl}
                      alt={`${announcement.title} Image`}
                      className="w-full h-auto rounded-md cursor-pointer"
                      onClick={() => openImageModal(announcement.imageUrl!)}
                      aria-label="View Image"
                    />
                  )}
                  {session?.user?.role === "HR" || session?.user?.role === "ADMIN" && (
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        disabled={loading}
                        variant="destructive"
                        className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                        aria-label={`Delete ${announcement.title}`}
                      >
                        {loading ? (
                          <>
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
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-5 h-5 mr-2" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Image Preview Modal (Optional) */}
        {selectedImage && (
          <Modal isOpen={isModalOpen} onClose={closeImageModal}>
            <div className="flex justify-center items-center">
              <img src={selectedImage} alt="Announcement Preview" className="max-w-full max-h-full rounded-md" />
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
