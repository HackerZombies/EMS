import Head from "next/head";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import Input from "@/components/Input"; // Assuming this is a styled input component
import Button from "@/components/Button"; // Assuming this is a styled button component
import BackButton from "@/components/BackButton";
import Modal from "@/components/Modal";

export default function NewAnnouncement() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Access session info


  // Authorization logic
  const allowedRoles = ["HR"];
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    // Redirect unauthorized users
    router.push("/404");
    return null; // Prevent rendering any content
  }
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState("EMPLOYEE"); // State for user type selection

  // Saving announcements utilizing the announcements/create.ts API endpoint
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title");
    const text = formData.get("text");

    if (title === "" || text === "") {
      setVisible(true);
      return;
    }

    const response = await fetch("/api/announcements/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text, role }),
    });

    // Ensuring that any issues are being outputted
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    await router.push("/announcements");
  }

  return (
    <>
      <Head>
        <title>EMS - New Announcement</title>
      </Head>
      <div className="flex flex-col gap-5 p-5 bg-gradient-to-b from-gray-800 to-black bg-opacity-50 min-h-screen">
        <BackButton />
        <h1 className="text-4xl font-bold text-white">New Announcement</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 bg-gray-900 p-6 rounded-lg shadow-lg">
          <label className="flex flex-col text-left text-white">
            Title
            <Input name="title" type="text" className="mt-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </label>
          <label className="flex flex-col text-left text-white">
            Text
            <textarea
              name="text"
              rows={4} // Set initial rows
              className="mt-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" // Prevent resizing in both directions
              placeholder="Write your announcement here..."
              onInput={(e) => {
                e.currentTarget.style.height = "auto"; // Reset height
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; // Set height to scrollHeight
              }}
            />
          </label>
          <fieldset className="flex flex-col text-left text-white">
            <legend className="mb-2">User  Type</legend>
            <div className="flex gap-4">
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
                HR Employee
              </label>
            </div>
          </fieldset>
          <Button type="submit" className="bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover :shadow-xl">
            Submit
          </Button>
        </form>
      </div>
      <Modal
        visible={visible}
        title="Oops..."
        onClose={() => setVisible(false)} // Use onClose instead of setVisible
      >
        Please fill out both the title and text first.
      </Modal>
    </>
  );
}