//api/notifications/unread.ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // The Admin's username
    const { username } = session.user;
    if (!username) {
      return res.status(400).json({ message: "No username in session" });
    }

    // Fetch unread notifications for this Admin
    const notifications = await prisma.notification.findMany({
      where: {
        recipientUsername: username,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ notifications });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
