import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { notificationIds } = req.body; // array of notification IDs
    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "Invalid request payload" });
    }

    // Mark them as read in the DB
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({ message: "Notifications marked as read" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
