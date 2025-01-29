// src/pages/api/tickets/newMessage.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define a Zod schema for input validation
const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
  ticketId: z.string().min(1, "Ticket ID is required."),
  username: z.string().min(1, "Username is required."),
});

// Define TypeScript types for the response
type SuccessResponse = {
  id: string;
  text: string;
  ticketId: string;
  userUsername: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
  dateCreated: string;
};

type ErrorResponse = {
  message: string;
};

type Data = SuccessResponse | ErrorResponse;

// API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse and validate the request body
    const { message, username, ticketId } = messageSchema.parse(req.body);

    // Create a new message in the database
    const newMessage = await prisma.message.create({
      data: {
        text: message,
        ticketId: ticketId.toString(), // Ensure ticketId is a string
        userUsername: username,
      },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Convert dateCreated from Date to string
    const formattedMessage: SuccessResponse = {
      ...newMessage,
      dateCreated: newMessage.dateCreated.toISOString(),
    };

    // Send the success response
    return res.status(201).json(formattedMessage);
  } catch (error: any) {
    console.error("Error creating comment:", error);

    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }

    // Handle Prisma validation errors (e.g., foreign key constraints)
    if (error.code === "P2003") {
      return res.status(400).json({ message: "Invalid foreign key." });
    }

    // Handle other unexpected errors
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
