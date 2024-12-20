import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

type AttendanceRecord = {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  user: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  checkInAddress?: string | null;
  checkOutAddress?: string | null;
};

let socket: Socket;

export default function AllAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to convert latitude and longitude into a human-readable address
  const convertToAddress = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const response = await fetch(`/api/geocode?latitude=${latitude}&longitude=${longitude}`);
      if (!response.ok) {
        throw new Error("Failed to fetch address from backend.");
      }

      const data = await response.json();
      return data.address || null;
    } catch (error) {
      console.error("Error converting coordinates to address:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchSessionAndRole = async () => {
      try {
        // Fetch session details to validate the user's role
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (!session || session.user.role !== "HR") {
          // Redirect if the user is not HR
          alert("Access denied: This page is restricted to HR personnel.");
          router.push("/unauthorized");
          return;
        }

        // Connect to the Socket.IO server
        socket = io("/", { path: "/api/socket" });

        // Listen for attendance updates
        socket.on("attendance-update", async (data: AttendanceRecord[]) => {
          const updatedData = await Promise.all(
            data.map(async (record) => ({
              ...record,
              checkInAddress:
                record.checkInLatitude && record.checkInLongitude
                  ? await convertToAddress(record.checkInLatitude, record.checkInLongitude)
                  : "N/A",
              checkOutAddress:
                record.checkOutLatitude && record.checkOutLongitude
                  ? await convertToAddress(record.checkOutLatitude, record.checkOutLongitude)
                  : "N/A",
            }))
          );
          setAttendanceData(updatedData);
          setLoading(false);
        });

        // Request initial data
        socket.emit("refresh-attendance");
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/unauthorized");
      }
    };

    fetchSessionAndRole();

    // Clean up the connection on unmount
    return () => {
      socket.disconnect();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-opacity-10 bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Daily Attendance (Real-Time)</h1>
      {loading && <p>Loading attendance data...</p>}
      {!loading && attendanceData.length === 0 && <p>No attendance data available.</p>}
      {!loading && attendanceData.length > 0 && (
        <div className="overflow-x-auto bg-opacity-15 bg-white shadow-lg rounded-lg p-4">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Check-In Time</th>
                <th className="px-4 py-2">Check-In Address</th>
                <th className="px-4 py-2">Check-Out Time</th>
                <th className="px-4 py-2">Check-Out Address</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id} className="border-b border-gray-200">
                  <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/manage/users/user/${record.user.username}`}
                      className="text-blue-500 hover:underline"
                    >
                      {record.user.firstName} {record.user.lastName} ({record.user.username})
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {record.checkInTime
                      ? new Date(record.checkInTime).toLocaleTimeString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2">{record.checkInAddress || "N/A"}</td>
                  <td className="px-4 py-2">
                    {record.checkOutTime
                      ? new Date(record.checkOutTime).toLocaleTimeString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2">{record.checkOutAddress || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
