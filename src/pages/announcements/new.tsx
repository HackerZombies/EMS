// src/pages/announcements/new.tsx

'use client';

import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn UI Button
import { Input } from "@/components/ui/input"; // shadcn UI Input
import { Textarea } from "@/components/ui/textarea"; // shadcn UI Textarea
import BackButton from "@/components/BackButton";
import { ToastContainer, toast } from "react-toastify"; // react-toastify for toasts
import "react-toastify/dist/ReactToastify.css"; // react-toastify styles

export default function NewAnnouncement() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Access session info

  // Authorization logic
  const allowedRoles = ["HR", "ADMIN"];
  const isAuthorized =
    session?.user?.role && allowedRoles.includes(session.user.role);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [role, setRole] = useState<string>(
    session?.user?.role === "HR" ? "HR" : "EMPLOYEE"
  ); // Initialize based on user role

  // Handle form submission
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const text = formData.get("text") as string;

    if (title.trim() === "" || text.trim() === "") {
      toast.error("Please fill out both the title and text fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/announcements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong.");
      }

      toast.success("Announcement created successfully!");
      router.push("/announcements");
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast.error(error.message || "Failed to create announcement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Redirect unauthorized users
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    // Redirect unauthorized users
    if (typeof window !== "undefined") {
      router.push("/404");
    }
    return null; // Prevent rendering any content
  }

  return (
    <>
      <Head>
        <title>EMS - New Announcement</title>
      </Head>
      <div className="flex flex-col gap-5 p-5 bg-gradient-to-b from-gray-800 to-black bg-opacity-50 min-h-screen">
        <BackButton />
        <h1 className="text-4xl font-bold text-white">New Announcement</h1>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 bg-gray-900 p-6 rounded-lg shadow-lg"
        >
          {/* Title Input */}
          <label className="flex flex-col text-left text-white">
            Title
            <Input
              name="title"
              type="text"
              placeholder="Announcement Title"
              required
              className="mt-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>

          {/* Textarea for Announcement Text */}
          <label className="flex flex-col text-left text-white">
            Text
            <Textarea
              name="text"
              rows={4}
              placeholder="Write your announcement here..."
              required
              className="mt-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              onInput={(e) => {
                const target = e.currentTarget as HTMLTextAreaElement;
                target.style.height = "auto"; // Reset height
                target.style.height = `${target.scrollHeight}px`; // Set height to scrollHeight
              }}
            />
          </label>

          {/* User Type Selection */}
          <fieldset className="flex flex-col text-left text-white">
            <legend className="mb-2">User Type</legend>
            <div className="flex gap-4">
              {/* Disable role selection if user is HR or ADMIN */}
              {session?.user?.role === "ADMIN" && (
                <>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="EMPLOYEE"
                      checked={role === "EMPLOYEE"}
                      onChange={() => setRole("EMPLOYEE")}
                      className="mr-2 text-green-500 focus:ring-green-500"
                    />
                    All Users
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="HR"
                      checked={role === "HR"}
                      onChange={() => setRole("HR")}
                      className="mr-2 text-green-500 focus:ring-green-500"
                    />
                    HR Employees
                  </label>
                </>
              )}
              {session?.user?.role === "HR" && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="EMPLOYEE"
                    checked={role === "EMPLOYEE"}
                    onChange={() => setRole("EMPLOYEE")}
                    className="mr-2 text-green-500 focus:ring-green-500"
                    disabled // HR can only select EMPLOYEE
                  />
                  All Users
                </label>
              )}
            </div>
          </fieldset>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  );
}
