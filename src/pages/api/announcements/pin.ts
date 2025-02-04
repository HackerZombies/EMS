// src/pages/api/announcements/pin.ts

import { prisma } from "@/lib/prisma"
import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

/**
 * PATCH /api/announcements/pin
 * Body: { id: string, pinned: boolean }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  // 1) Check session
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  // Optionally, only allow certain roles to pin/unpin
  const allowedRoles = ["HR", "ADMIN"]
  if (!allowedRoles.includes(session.user.role)) {
    return res.status(403).json({ message: "Forbidden - No permission" })
  }

  try {
    // 2) Parse the body
    const { id, pinned } = req.body
    if (!id || typeof pinned !== "boolean") {
      return res.status(400).json({ message: "Missing or invalid body fields" })
    }

    // 3) Update announcement
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: String(id) },
      data: { pinned },
    })

    return res.status(200).json({ updatedAnnouncement })
  } catch (error: any) {
    // If the record doesn't exist, Prisma throws an error
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Announcement not found" })
    }
    console.error("Error pin/unpin announcement:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
