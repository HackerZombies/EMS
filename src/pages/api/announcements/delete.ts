import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

// API endpoint for announcement deletion utilizing the announcement ID as the identifier for deletion
// Utilised POST as NextAuth.js did not allow for DELETE method to work
// Ensures that it also deals with errors accordingly
export default async function announcementDelete(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const { announcementID } = req.body;
      if (!announcementID) {
        return res
          .status(400)
          .json({ err: "Announcement ID not present in Announcements" });
      }

      // Ensure the announcementID is treated as a string
      const deletedAnnouncement = await prisma.announcement.delete({
        where: {
          id: String(announcementID),
        },
      });

      res.status(200).json(deletedAnnouncement);
    } catch (err) {
      console.error(err);
      res.status(500).json({ err: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ err: "Method not permitted" });
  }
}