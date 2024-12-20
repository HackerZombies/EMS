import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { username, days } = req.query;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  const daysBack = parseInt(days as string, 10) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        userUsername: username as string,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ message: "Failed to fetch attendance history." });
  }
}
