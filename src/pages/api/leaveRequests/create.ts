import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import sendLeaveRequestCreatedEmail from "@/lib/sendLeaveRequestCreatedEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { reason, startDate, endDate, userUsername } = req.body;

    try {
      const leaveRequest = await prisma.leaveRequest.create({
        data: { reason, startDate, endDate, userUsername },
      });

      const user = await prisma.user.findUnique({
        where: { username: userUsername },
        select: { email: true, username: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User  not found" });
      }

      await sendLeaveRequestCreatedEmail(user.email, user.username);

      res.status(200).json(leaveRequest);
    } catch (error) {
      console.error("Error creating leave request:", error);
      return res.status(500).json({ error: "Failed to create leave request" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}