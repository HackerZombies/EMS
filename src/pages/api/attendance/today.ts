// pages/api/attendance/today.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the current date in UTC (adjust if you need local time instead)
    const now = new Date();
    // Create UTC boundaries for "today"
    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
      include: {
        user: true, // include related user data
      },
    });

    // Return the array (or wrap it if you prefer)
    return res.status(200).json(attendances);
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
