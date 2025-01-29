import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // Ensure this points to your Prisma instance
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: session.user.username, // Assuming the user's email is in the session
      },
      select: {
        avatarImageUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ avatarImageUrl: user.avatarImageUrl || "/default-avatar.png" });
  } catch (error) {
    console.error("Error fetching user avatar:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
