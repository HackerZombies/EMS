import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { Prisma } from "@prisma/client"; // Import Prisma namespace

// API endpoint for announcement deletion utilizing the announcement ID as the identifier for deletion
// Utilized POST as NextAuth.js did not allow for DELETE method to work
// Ensures that it also deals with errors accordingly
export default async function announcementDelete(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const { announcementID } = req.body;

      // Validate the announcementID
      if (!announcementID || typeof announcementID !== "string") {
        return res.status(400).json({ error: "Invalid or missing announcement ID." });
      }

      // Attempt to delete the announcement
      const deletedAnnouncement = await prisma.announcement.delete({
        where: {
          id: announcementID, // No need to convert to string if it's already a string
        },
      });

      // Return the deleted announcement along with a success message
      res.status(200).json({ message: "Announcement deleted successfully.", deletedAnnouncement });
    } catch (err) {
      console.error(err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Check if the error is a Prisma error
        if (err.code === 'P2025') {
          // Record not found
          return res.status(404).json({ error: "Announcement not found." });
        }
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not permitted" });
  }
}