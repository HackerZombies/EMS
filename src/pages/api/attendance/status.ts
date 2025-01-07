import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handleAttendanceStatus(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of the next day

    const attendance = await prisma.attendance.findFirst({
      where: {
        userUsername: username,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (attendance) {
      return res.status(200).json({
        checkedIn: !!attendance.checkInTime,
        checkedOut: !!attendance.checkOutTime,
        checkInTime: attendance.checkInTime ? attendance.checkInTime.toISOString() : null,
        checkOutTime: attendance.checkOutTime ? attendance.checkOutTime.toISOString() : null,
      });
    } else {
      return res.status(200).json({
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
      });
    }
  } catch (error) {
    console.error("Error fetching attendance status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}