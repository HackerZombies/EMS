// src/pages/api/users/user/[username].ts

import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { DocumentCategory } from "@prisma/client"; // Import DocumentCategory from Prisma

const ALLOWED_ROLES = ["HR", "ADMIN"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Validate session & role
    const session = await getServerSession(req, res, authOptions);
    if (
      !session ||
      !session.user ||
      !ALLOWED_ROLES.includes(session.user.role as string)
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required" });
    }

    // Fetch user with qualifications, experiences, certifications, employeeDocuments
    const user = await prisma.user.findUnique({
      where: { username: username as string },
      include: {
        qualifications: true,
        emergencyContacts: true,
        experiences: true,
        certifications: true,
        employeeDocuments: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            size: true,
            dateUploaded: true,
            category: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
