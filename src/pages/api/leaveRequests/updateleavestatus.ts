// updateleavestatus.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendLeaveRequestUpdateEmail } from "@/lib/sendLeaveRequestUpdateEmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === "PATCH") {
    try {
      const { requestStatus } = req.body;
      if (typeof id !== "string" || id.length !== 24) {
        console.error("Invalid ID format:", id);
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const validStatuses = ["Accepted", "Declined", "Pending"];
      if (!requestStatus || !validStatuses.includes(requestStatus)) {
        console.error("Invalid request status:", requestStatus);
        return res.status(400).json({ error: "Invalid request status" });
      }

      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: id as string },
        select: { userUsername: true },
      });

      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      const user = await prisma.user.findUnique({
        where: { username: leaveRequest.userUsername },
        select: { email: true, username: true, firstName: true, lastName: true, department: true, position: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User  not found" });
      }

      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id: id as string },
        data: { requestStatus, dateResponded: new Date() },
      });

      if (requestStatus === "Accepted" || requestStatus === "Declined") {
        await sendLeaveRequestUpdateEmail(user.email, user.username, requestStatus,);
      }

      res.status(200).json(updatedLeaveRequest);
    } catch (error) {
      // Error handling...
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}