import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

interface ConflictResponse {
  hasConflict: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConflictResponse | { error: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, startDate, endDate } = req.query;

  // Validate query parameters
  if (
    typeof username !== "string" ||
    typeof startDate !== "string" ||
    typeof endDate !== "string"
  ) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  try {
    // Find a pending leave request for the user that overlaps with the given date range
    const conflict = await prisma.leaveRequest.findFirst({
      where: {
        userUsername: username,
        requestStatus: "Pending", // Only consider pending requests
        AND: [
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(startDate) } },
        ],
      },
    });

    return res.status(200).json({ hasConflict: conflict !== null });
  } catch (error) {
    console.error("Error checking conflict:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
