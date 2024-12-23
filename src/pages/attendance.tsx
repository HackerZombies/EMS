import { useEffect, useState, useCallback } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Head from "next/head";
import { io, Socket } from "socket.io-client";

type AttendanceRecord = {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
};

type Props = {
  username?: string;
};

export default function AttendancePage({ username }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Memoize fetchAttendance to prevent unnecessary re-creations
  const fetchAttendance = useCallback(async () => {
    if (!username) return;
    try {
      const response = await fetch(`/api/attendance/history?username=${username}&days=30`);
      if (!response.ok) {
        throw new Error("Failed to fetch attendance history.");
      }
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    }
  }, [username]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    if (!username) return;

    // Initialize Socket.IO connection
    const newSocket = io("/", { path: "/api/socket" });
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on("attendance-update", (updatedAttendance: AttendanceRecord[]) => {
      setAttendanceData(updatedAttendance);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  const markAttendance = async (action: "checkin" | "checkout") => {
    if (!username) {
      setMessage("You must be logged in to mark attendance.");
      return;
    }

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const date = new Date().toISOString().split("T")[0];
        const time = new Date().toISOString();

        const payload =
          action === "checkin"
            ? {
                username,
                date,
                checkInTime: time,
                checkInLatitude: latitude,
                checkInLongitude: longitude,
              }
            : {
                username,
                date,
                checkOutTime: time,
                checkOutLatitude: latitude,
                checkOutLongitude: longitude,
              };

        try {
          const response = await fetch(`/api/attendance/${action}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to mark attendance.");
          }

          setMessage(
            `Attendance ${action === "checkin" ? "checked in" : "checked out"} successfully!`
          );
          fetchAttendance(); // Refresh attendance data
        } catch (error) {
          console.error("Error marking attendance:", error);
          setMessage(error instanceof Error ? error.message : "Failed to mark attendance.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMessage("Failed to retrieve your location.");
        setLoading(false);
      }
    );
  };

  const handleCheckIn = async () => {
    await markAttendance("checkin");
  };

  const handleCheckOut = async () => {
    await markAttendance("checkout");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <Head>
        <title>Attendance</title>
      </Head>
      <div className="max-w-lg w-full p-6 bg-gray-800 shadow-lg rounded-lg mb-8">
        <h1 className="text-3xl font-bold mb-4">Attendance System</h1>
        {username ? (
          <>
            <p className="mb-4">Welcome, {username}!</p>
            <div className="flex gap-4 mb-4">
              <button
                onClick={handleCheckIn}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                disabled={loading}
              >
                {loading ? "Checking In..." : "Check In"}
              </button>
              <button
                onClick={handleCheckOut}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Checking Out..." : "Check Out"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-red-400">You must log in to mark attendance.</p>
        )}
        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
      <div className="max-w-3xl w-full p-6 bg-gray-800 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Last 30 Days Attendance</h2>
        {attendanceData.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          <table className="min-w-full table-auto border-collapse border border-gray-600">
            <thead>
              <tr className="bg-gray-700">
                <th className="border border-gray-600 px-4 py-2">Date</th>
                <th className="border border-gray-600 px-4 py-2">Check-In Time</th>
                <th className="border border-gray-600 px-4 py-2">Check-Out Time</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.date} className="hover:bg-gray-600">
                  <td className="border border-gray-600 px-4 py-2">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-600 px-4 py-2">
                    {record.checkInTime
                      ? new Date(record.checkInTime).toLocaleTimeString()
                      : "N/A"}
                  </td>
                  <td className="border border-gray-600 px-4 py-2">
                    {record.checkOutTime
                      ? new Date(record.checkOutTime).toLocaleTimeString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Fetch session and pass username as a prop
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return { props: { username: session.user.username } };
  } else {
    return { props: { username: null } };
  }
};
