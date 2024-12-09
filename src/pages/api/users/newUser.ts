import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import argon2 from "argon2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendEmail } from "@/lib/sendEmail";

function generateUsername(): string {
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  return `${randomNumber}`;
}

function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "TECHNICIAN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { 
    firstName, 
    lastName, 
    password, 
    email, 
    phoneNumber, 
    role,
    dob,
    address,
    qualifications,
    department,
    position
  } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const username = generateUsername();
    const hashedPassword = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        password: hashedPassword,
        email,
        phoneNumber,
        leaveBalance: 28,
        role,
        dob: dob ? new Date(dob) : null,
        address,
        qualifications,
        department,
        position
      },
    });

    await sendEmail(email, username, password);

    return res.status(200).json(newUser);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res
          .status(409)
          .json({ message: "This email or phone number is already in use." });
      }
    }
    console.error("Failed to create user:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
}

