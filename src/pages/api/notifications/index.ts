// pages/api/notifications/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { Prisma } from "@prisma/client";

// 1) Define a type for userNotification + relation
type UserNotificationWithNotification = Prisma.UserNotificationGetPayload<{
  include: { notification: true };
}>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userRole = session.user.role; // e.g. "EMPLOYEE"
  const userId = session.user.id;
  const username = session.user.username;
  const onlyUnread = req.query.onlyUnread === "true";

  try {
    const pivotWhere: any = {
      userId: userId,
    };
    if (onlyUnread) {
      pivotWhere.isRead = false;
    }

    const notificationWhere = {
      OR: [
        { roleTargets: { has: userRole } },
        { roleTargets: { has: "EVERYONE" } },
        { recipientUsername: username },
        { roleTargets: { equals: [] } },
        { roleTargets: { equals: null } },
      ],
    };

    // 2) Explicitly type the return as UserNotificationWithNotification[]
    const userNotifications: UserNotificationWithNotification[] =
      await prisma.userNotification.findMany({
        where: {
          ...pivotWhere,
          notification: notificationWhere,
        },
        include: {
          notification: true,
        },
        orderBy: {
          notification: {
            createdAt: "desc",
          },
        },
      });

    // 3) Now pivot in .map() has the correct type
    const notifications = userNotifications.map((pivot) => ({
      id: pivot.id,
      message: pivot.notification.message,
      createdAt: pivot.notification.createdAt.toISOString(),
      isRead: pivot.isRead,
      targetUrl: pivot.notification.targetUrl,
    }));

    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
