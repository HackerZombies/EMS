// src/pages/announcements/NewTicket.tsx

'use client';

import Head from "next/head";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button"; // shadcn UI Button
import { Input } from "@/components/ui/input"; // shadcn UI Input
import { Textarea } from "@/components/ui/textarea"; // shadcn UI Textarea
import { ArrowRight } from "lucide-react"; // Lucide-react icon
import { ToastContainer, toast } from "react-toastify"; // react-toastify for toasts
import "react-toastify/dist/ReactToastify.css"; // react-toastify styles
import BackButton from "@/components/BackButton"; // Custom BackButton component

export default function NewTicket() {
  const [loading, setLoading] = useState(false); // State for loading indicator
  const router = useRouter(); // Next.js router for navigation

  // Handle form submission
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent default form submission behavior

    const formData = new FormData(event.currentTarget); // Extract form data

    const subject = formData.get("subject")?.toString().trim(); // Get and trim subject
    const description = formData.get("description")?.toString().trim(); // Get and trim description

    // Validate form fields
    if (!subject || !description) {
      toast.error("Please fill out both the subject and description.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const response = await fetch("/api/tickets/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description }), // Send form data as JSON
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create ticket."); // Throw error if response is not ok
      }

   
      await router.push("/help"); // Redirect to help page
    } catch (error: any) {
      console.error("Error creating ticket:", error);
  
    } finally {
      setLoading(false); // Stop loading
    }
  }

  return (
    <>
      <Head>
        <title>EMS - New Ticket</title>
      </Head>
      <div className="min-h-screen bg-black-50 bg-opacity-5 flex flex-col items-center py-10 px-4">
        {/* Back Button */}
        <div className="self-start mb-6">
          <BackButton />
        </div>

        {/* Ticket Form Card */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">Create New Ticket</h1>
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {/* Subject Field */}
            <div className="flex flex-col">
              <label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
  id="subject"
  name="subject"
  type="text"
  placeholder="Enter the subject of your ticket"
  required
  className="text-black border border-gray-300 focus:border-blue-500"
/>
            </div>

            {/* Description Field */}
            <div className="flex flex-col">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
  id="description"
  name="description"
  placeholder="Provide a detailed description of your issue"
  required
  className="text-black border border-gray-300 focus:border-blue-500 resize-none h-32"
/>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              variant="default" // Use shadcn UI's variant prop for consistent styling
              className="flex items-center justify-center font-bold py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105 disabled:opacity-50"
              aria-label="Submit Ticket"
            >
              {loading ? (
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
                  Submitting...
                </>
              ) : (
                <>
                  {/* Submit Text and Icon */}
                  Submit <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Toast Notifications */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </>
  );
}
