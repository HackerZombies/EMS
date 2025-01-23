// src/pages/api/users/user/[username]/auditLogs.ts

import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";

const ALLOWED_ROLES = ["HR", "ADMIN"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Validate session and user role
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username } = req.query;

    // Validate username parameter
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required and must be a string" });
    }

    // Extract pagination parameters from query (optional)
    const page = parseInt(req.query.page as string, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit as string, 10) || 20; // Default to 20 items per page
    const skip = (page - 1) * limit;

    // Fetch total count of audit logs for the user
    const total = await prisma.auditLog.count({
      where: { targetUsername: username },
    });

    // Fetch paginated audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { targetUsername: username },
      orderBy: { datePerformed: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: { username: true, firstName: true, lastName: true },
        },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
