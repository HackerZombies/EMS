import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getSession({ req });
  if (!session || !["HR", "ADMIN"].includes(session.user?.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { date } = req.query;

  if (!date || typeof date !== "string") {
    return res.status(400).json({ message: "Invalid date parameter" });
  }

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: true,
      },
    });

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("HR Attendance Fetch Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
