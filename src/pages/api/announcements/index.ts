import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userRole = session.user.role; // e.g. "EMPLOYEE", "HR", "ADMIN"
  const { search, archived, pinFirst } = req.query;

  // Base where clause
  const whereClauses: Prisma.AnnouncementWhereInput = {
    OR: [
      { roleTargets: { has: userRole } },
      { roleTargets: { equals: [] } },
    ],
  };

  // Auxiliary array for additional AND conditions
  const andClauses: Prisma.AnnouncementWhereInput[] = [];

  if (search) {
    const searchVal = String(search).toLowerCase();
    andClauses.push({
      OR: [
        { title: { contains: searchVal, mode: "insensitive" } },
        { text: { contains: searchVal, mode: "insensitive" } },
      ],
    });
  }

  if (archived === "false") {
    andClauses.push({ archived: false });
  }

  // Only add AND if there are any conditions
  if (andClauses.length > 0) {
    whereClauses.AND = andClauses;
  }

  let orderBy: Prisma.Enumerable<Prisma.AnnouncementOrderByWithRelationInput> = [
    { dateCreated: "desc" },
  ];
  if (pinFirst === "true") {
    orderBy = [
      { pinned: "desc" },
      { dateCreated: "desc" },
    ];
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: whereClauses,
      orderBy,
    });

    return res.status(200).json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
