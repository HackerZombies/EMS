// pages/api/notifications/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userRole = session.user.role; // e.g. "EMPLOYEE", "HR", "ADMIN"
  const username = session.user.username;
  const onlyUnread = req.query.onlyUnread === "true";

  // Basic "where" object to hold conditions
  const whereClauses: any = {};

  if (onlyUnread) {
    whereClauses.isRead = false;
  }

  // We want to show notifications if:
  // 1) The roleTargets array has the user's role, e.g. "EMPLOYEE"
  // 2) OR The roleTargets array has "EVERYONE"
  // 3) OR The notification is specifically assigned to their username
  // 4) OR The roleTargets is empty / null => treat as "global"
  whereClauses.OR = [
    {
      roleTargets: { has: userRole }, // "EMPLOYEE" => see notifications that have ["EMPLOYEE", ...]
    },
    {
      roleTargets: { has: "EVERYONE" },
    },
    {
      // if specifically addressed to the user
      recipientUsername: username,
    },
    {
      // if the array is empty => "global"
      roleTargets: { equals: [] },
    },
    {
      // or if it's null => "global"
      roleTargets: { equals: null },
    },
  ];

  try {
    const notifications = await prisma.notification.findMany({
      where: whereClauses,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
