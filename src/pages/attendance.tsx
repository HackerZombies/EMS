// pages/attendance.tsx

import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";

interface AttendanceResponse {
  id: string;
  userId: string;
  checkIn: string;
  checkOut?: string;
  checkInLat: number;
  checkInLng: number;
  checkOutLat?: number;
  checkOutLng?: number;
  date: string;
}

const AttendancePage: React.FC = () => {
  const { data: session, status } = useSession();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => {
            reject(new Error("Unable to retrieve your location"));
          }
        );
      }
    });
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const location = await getLocation();
      const response = await axios.post<AttendanceResponse>(
        "/api/attendance/checkin",
        location
      );
      setStatusMessage("Checked in successfully!");
    } catch (error: any) {
      setStatusMessage(
        error.response?.data?.message || error.message || "Check-In Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const location = await getLocation();
      const response = await axios.post<AttendanceResponse>(
        "/api/attendance/checkout",
        location
      );
      setStatusMessage("Checked out successfully!");
    } catch (error: any) {
      setStatusMessage(
        error.response?.data?.message || error.message || "Check-Out Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Please sign in to mark attendance.</p>;
  }

  return (
    <>
      <Head>
        <title>Attendance</title>
      </Head>
      <div className="container">
        <h1>Attendance</h1>
        {statusMessage && <p>{statusMessage}</p>}
        <button onClick={handleCheckIn} disabled={loading}>
          {loading ? "Processing..." : "Check In"}
        </button>
        <button onClick={handleCheckOut} disabled={loading}>
          {loading ? "Processing..." : "Check Out"}
        </button>
      </div>
      <style jsx>{`
        .container {
          padding: 2rem;
          text-align: center;
        }
        button {
          margin: 1rem;
          padding: 0.5rem 1rem;
          font-size: 1rem;
        }
      `}</style>
    </>
  );
};

export default AttendancePage;
