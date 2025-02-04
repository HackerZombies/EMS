// pages/api/notifications/markAllRead.ts
import { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    // Mark all unread notifications for this user as read
    // (role-based or username-based logic as needed)
    await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          // same logic as your GET /api/notifications
          // e.g. roleTargets includes userRole, or empty => global
          // or recipientUsername = userName
        ],
      },
      data: { isRead: true },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
