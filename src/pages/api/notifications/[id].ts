// pages/api/notifications/[id].ts
import { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // This is the pivot (UserNotification) ID

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // The user must own this pivot record:
    // We'll ensure the userId matches session.user.id
    const userId = session.user.id;

    // Mark as read in the pivot table
    const updated = await prisma.userNotification.updateMany({
      where: {
        id: String(id),
        userId: userId, // extra safety check
      },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: "Record not found or not yours" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
