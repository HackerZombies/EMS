// pages/attendance.tsx

import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useGeolocated } from "react-geolocated";

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

  // Use the hook to get location data
  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    userDecisionTimeout: 10000,
  });

  const handleCheckIn = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      if (!isGeolocationAvailable) {
        throw new Error("Geolocation is not supported by your browser.");
      }
      if (!isGeolocationEnabled) {
        throw new Error("Geolocation is disabled. Please allow location access.");
      }
      if (!coords) {
        throw new Error("Unable to retrieve your location at this time.");
      }

      const { latitude, longitude } = coords;
      await axios.post<AttendanceResponse>("/api/attendance/checkin", {
        latitude,
        longitude,
      });
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
      if (!isGeolocationAvailable) {
        throw new Error("Geolocation is not supported by your browser.");
      }
      if (!isGeolocationEnabled) {
        throw new Error("Geolocation is disabled. Please allow location access.");
      }
      if (!coords) {
        throw new Error("Unable to retrieve your location at this time.");
      }

      const { latitude, longitude } = coords;
      await axios.post<AttendanceResponse>("/api/attendance/checkout", {
        latitude,
        longitude,
      });
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
        {positionError && (
           <p style={{ color: "red" }}>
           Error getting location: Code {positionError.code}, Message: {positionError.message || "No message provided"}
         </p>
        )}
        <button onClick={handleCheckIn} disabled={loading || !coords}>
          {loading ? "Processing..." : "Check In"}
        </button>
        <button onClick={handleCheckOut} disabled={loading || !coords}>
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
