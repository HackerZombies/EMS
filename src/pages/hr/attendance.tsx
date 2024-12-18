// pages/hr/attendance.tsx

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";

interface AttendanceRecord {
  id: string;
  userId: string;
  checkIn: string;
  checkOut?: string;
  checkInLat: number;
  checkInLng: number;
  checkOutLat?: number;
  checkOutLng?: number;
  date: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const HrAttendancePage: React.FC = () => {
  const { data: session, status } = useSession();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "HR") {
      fetchAttendance();
    }
  }, [session, status, date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get<AttendanceRecord[]>("/api/hr/attendance", {
        params: { date },
      });
      setAttendanceData(response.data);
    } catch (error) {
      console.error("Fetch Attendance Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Please sign in to view attendance.</p>;
  }

  if (session.user.role !== "HR") {
    return <p>Unauthorized Access</p>;
  }

  return (
    <>
      <Head>
        <title>HR - Daily Attendance</title>
      </Head>
      <div className="container">
        <h1>Daily Attendance</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {loading ? (
          <p>Loading...</p>
        ) : attendanceData.length === 0 ? (
          <p>No attendance records found for this date.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
                <th>Check-In Location</th>
                <th>Check-Out Location</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id}>
                  <td>{record.user.username}</td>
                  <td>
                    {record.user.firstName} {record.user.lastName}
                  </td>
                  <td>{new Date(record.checkIn).toLocaleString()}</td>
                  <td>
                    {record.checkOut
                      ? new Date(record.checkOut).toLocaleString()
                      : "Not Checked Out"}
                  </td>
                  <td>
                    {record.checkInLat.toFixed(5)}, {record.checkInLng.toFixed(5)}
                  </td>
                  <td>
                    {record.checkOutLat && record.checkOutLng
                      ? `${record.checkOutLat.toFixed(5)}, ${record.checkOutLng.toFixed(5)}`
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style jsx>{`
        .container {
          padding: 2rem;
        }
        input[type="date"] {
          margin-bottom: 1rem;
          padding: 0.5rem;
          font-size: 1rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        th,
        td {
          border: 1px solid #ddd;
          padding: 0.5rem;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      `}</style>
    </>
  );
};

export default HrAttendancePage;
