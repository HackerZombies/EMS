import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendLeaveRequestUpdateEmail } from "@/lib/sendLeaveRequestUpdateEmail"; // Import the sendLeaveRequestUpdateEmail function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === "PATCH") {
    try {
      const { requestStatus } = req.body;
      // Ensure id is treated as a string
      if (typeof id !== "string" || id.length !== 24) {
        console.error("Invalid ID format:", id);
        return res.status(400).json({ error: "Invalid ID format" });
      }
      // Validate requestStatus
      const validStatuses = ["Accepted", "Declined", "Pending"];
      if (!requestStatus || !validStatuses.includes(requestStatus)) {
        console.error("Invalid request status:", requestStatus);
        return res.status(400).json({ error: "Invalid request status" });
      }
      // Log the values before updating
      console.log("Updating leave request:", { id, requestStatus });

      // Fetch the leave request to get the user's username
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: id as string },
        select: { userUsername: true },
      });

      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      // Fetch the user's email
      const user = await prisma.user.findUnique({
        where: { username: leaveRequest.userUsername },
        select: { email: true, username: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id: id as string }, // Use type assertion to ensure id is treated as a string
        data: { requestStatus, dateResponded: new Date() },
      });

      // Send leave request update email
      if (requestStatus === "Accepted" || requestStatus === "Declined") {
        await sendLeaveRequestUpdateEmail(user.email, user.username, requestStatus);
      }

      res.status(200).json(updatedLeaveRequest);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Leave request not found" });
        } else {
          console.error("Prisma error updating leave request status:", error);
          return res.status(400).json({ error: "Failed to update leave request status" });
        }
      } else {
        console.error("Unexpected error updating leave request status:", error);
        return res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}