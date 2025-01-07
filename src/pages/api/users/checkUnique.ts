// pages/api/users/checkUnique.ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, phoneNumber } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phoneNumber: phoneNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(200).json({ isUnique: false, field: "email" });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(200).json({ isUnique: false, field: "phoneNumber" });
      }
    }

    return res.status(200).json({ isUnique: true });
  } catch (error) {
    console.error("Error checking uniqueness:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
