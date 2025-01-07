// api/attendance/[action].ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { broadcastAttendanceUpdate } from "../socket"; // Import the WebSocket broadcast function

export default async function handleAttendanceAction(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  if (!["checkin", "checkout"].includes(action as string)) {
    return res.status(404).json({ message: "Invalid action" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { username, date, checkInTime, checkOutTime, checkInLatitude, checkInLongitude, checkOutLatitude, checkOutLongitude } = req.body;

  if (!username || !date) {
    return res.status(400).json({ message: "Username and date are required" });
  }

  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    let updatedAttendance;

    if (action === "checkin") {
      if (!checkInTime || checkInLatitude === undefined || checkInLongitude === undefined) {
        return res.status(400).json({ message: "Missing required fields for check-in" });
      }

      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      });

      if (existingAttendance) {
        return res.status(400).json({ message: "Attendance already marked for today" });
      }

      updatedAttendance = await prisma.attendance.create({
        data: {
          date: parsedDate,
          checkInTime: new Date(checkInTime),
          checkInLatitude: parseFloat(checkInLatitude),
          checkInLongitude: parseFloat(checkInLongitude),
          userUsername: username,
        },
        include: {
          user: {
            select: { username: true, firstName: true, lastName: true, role: true },
          },
        },
      });
    }

    if (action === "checkout") {
      if (!checkOutTime || checkOutLatitude === undefined || checkOutLongitude === undefined) {
        return res.status(400).json({ message: "Missing required fields for check-out" });
      }

      const attendance = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      });

      if (!attendance) {
        return res.status(400).json({ message: "No check-in record found for today" });
      }

      if (attendance.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today" });
      }

      updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime: new Date(checkOutTime),
          checkOutLatitude: parseFloat(checkOutLatitude),
          checkOutLongitude: parseFloat(checkOutLongitude),
        },
        include: {
          user: {
            select: { username: true, firstName: true, lastName: true, role: true },
          },
        },
      });
    }

    if (updatedAttendance) {
      broadcastAttendanceUpdate(updatedAttendance);
    }

    return res.status(200).json({ message: `${action === "checkin" ? "Check-In" : "Check-Out"} successful` });
  } catch (error) {
    console.error(`Error during ${action}:`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}