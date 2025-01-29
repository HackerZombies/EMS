import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // Import the sendDeleteEmail function

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Extract user data from req body
  const { username } = req.body;

  try {
    // Fetch the user's email before deleting
    const user = await prisma.user.findUnique({
      where: { username },
      select: { email: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user from database
    const deletedUser = await prisma.user.delete({
      where: { username },
    });

    // Send delete email with notification

    return res.status(200).json(deletedUser);
  } catch (error) {
    // Handle case where user doesn't exist or other db error
    console.error("Failed to delete user:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
}