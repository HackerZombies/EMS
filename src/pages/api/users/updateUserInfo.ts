import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import argon2 from "argon2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendUpdateEmail } from "@/lib/sendUpdateEmail"; // Import the sendEmail function

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
  let { username, firstName, lastName, password, email, phoneNumber } = req.body;

  // Validate email format
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (email && !emailPattern.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate phone number format
  const phonePattern = /^91[0-9]{10}$/;
  if (phoneNumber && !phonePattern.test(phoneNumber)) {
    return res.status(400).json({ message: "Invalid phone number format. Please enter 91 followed by a 10-digit number." });
  }

  // Don't update empty fields
  if (firstName === "") {
    firstName = undefined;
  }
  if (lastName === "") {
    lastName = undefined;
  }
  if (email === "") {
    email = undefined;
  }
  if (phoneNumber === "") {
    phoneNumber = undefined;
  }

  try {
    // Hash the raw password from req body
    const hashedPassword = password ? await argon2.hash(password) : undefined;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        firstName,
        lastName,
        password: hashedPassword,
        email,
        phoneNumber,
      },
    });

    // Send email with updated information
    if (email && password) {
      await sendUpdateEmail(email, username, password);
    }
    if (email) {
      await sendUpdateEmail(email, username, password);
    }
    if (password) {
      await sendUpdateEmail(email, username, password);
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      return res
        .status(409)
        .json({ message: "This email / phone number is already in use." });
    } else {
      // Handle potential errors, like duplicate email or phone number since @unique in schema
      console.error("Failed to update user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  }
}