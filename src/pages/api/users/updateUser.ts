import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import argon2 from "argon2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendUpdateEmail } from "@/lib/sendUserUpdateEmail"; // Import the sendUpdateEmail function

interface UpdateUserRequest {
  username: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  email?: string;
  phoneNumber?: string;
  dob?: string;
  address?: string;
  qualifications?: string;
  department?: string;
  position?: string;
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
  let { username, firstName, lastName, password, email, phoneNumber, dob, address, qualifications, department, position }: UpdateUserRequest = req.body;

  // Validate email format
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (email && !emailPattern.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Update phone number validation to allow just a 10-digit number
  const phonePattern = /^[0-9]{10}$/; // Just 10-digit phone number
  if (phoneNumber && !phonePattern.test(phoneNumber)) {
    return res.status(400).json({ message: "Invalid phone number format. Please enter a 10-digit number." });
  }

  // Validate date of birth
  if (dob) {
    const dobDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    if (age < 18) {
      return res.status(400).json({ message: "Employee must be at least 18 years old" });
    }
  }

  // Don't update empty fields
  if (firstName === "") firstName = undefined;
  if (lastName === "") lastName = undefined;
  if (email === "") email = undefined;
  if (phoneNumber === "") phoneNumber = undefined;
  if (dob === "") dob = undefined;
  if (address === "") address = undefined;
  if (qualifications === "") qualifications = undefined;
  if (department === "") department = undefined;
  if (position === "") position = undefined;

  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (email && email !== existingUser?.email && !password) {
    return res.status(400).json({ message: "A password change is necessary to update the email." });
  }
  

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

    if (phoneNumber) {
      const existingPhoneUser  = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingPhoneUser  && existingPhoneUser .username !== username) {
        return res.status(409).json({ message: "Phone number is already in use by another user." });
      }
    }

    // Prepare update data
    const updateData: any = {
      firstName,
      lastName,
      email,
      phoneNumber,
      dob,
      address,
      qualifications,
      department,
      position,
    };

    // If password is provided, hash it and include it in the update
    if ( password) {
      const hashedPassword = await argon2.hash(password);
      updateData.password = hashedPassword;
    }

    // Ensure username is always defined for the update
    if (!username) {
      return res.status(400).json({ message: "Username is required for the update." });
    }

    const updatedUser  = await prisma.user.update({
      where: { username },
      data: updateData,
    });

    // Send update email with updated information if email is provided
    if (email) {
      await sendUpdateEmail(email, username, password!);
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