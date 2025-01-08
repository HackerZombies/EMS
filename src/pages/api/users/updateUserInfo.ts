import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendUpdateEmail } from "@/lib/sendUserUpdateEmail"; // Import the sendUpdateEmail function

interface UpdateUserRequest {
  username: string;
  password?: string;
  email?: string;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Extract user data from req body
  let { username, password, email}: UpdateUserRequest = req.body;

  // Validate email format
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (email && !emailPattern.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Don't update empty fields
  if (email === "") email = undefined;

  try {
    // Check for existing email or phone number
    if (email) {
      const existingEmailUser  = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmailUser  && existingEmailUser .username !== username) {
        return res.status(409).json({ message: "Email is already in use by another user." });
      }
    }
    // Hash the raw password from req body
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // Update user in database
    const updatedUser  = await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword,
        email,
      },
    });

    // Send update email with updated information
    if (email && password) { // Ensure both email and password are defined
      await sendUpdateEmail(email, username, password);
    }

    return res.status(200).json({ success: true, data: updatedUser  });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      return res.status(409).json({ message: "This email or phone number is already in use." });
    } else {
      console.error("Failed to update user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  }
}