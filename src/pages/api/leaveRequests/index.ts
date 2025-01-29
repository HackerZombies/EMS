import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const { userUsername } = req.query;
      const whereClause = userUsername
        ? { userUsername: String(userUsername) }
        : {}; // Fetch all leave requests if no username is provided.

      const leaveRequests = await prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
              position: true,
              username: true,
            },
          },
        },
      });

      res.status(200).json(leaveRequests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ error: "Failed to fetch leave requests" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
