// pages/api/notifications/markAllRead.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  const username = session.user.username;

  try {
    // Mark all unread notifications for this user as read
    // If you only want to mark those the user can see,
    // apply the same 'notification: {...}' logic
    const result = await prisma.userNotification.updateMany({
      where: {
        userId: userId,
        isRead: false,
        notification: {
          OR: [
            { roleTargets: { has: userRole } },
            { roleTargets: { has: "EVERYONE" } },
            { recipientUsername: username },
            { roleTargets: { equals: [] } },
            { roleTargets: { equals: null } },
          ],
        },
      },
      data: { isRead: true },
    });

    return res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
